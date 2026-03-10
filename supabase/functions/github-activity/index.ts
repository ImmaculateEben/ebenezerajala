import { createClient } from "npm:@supabase/supabase-js@2";

const CACHE_TTL_SECONDS = 6 * 60 * 60;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_MARKUP_BYTES = 300_000;
const GITHUB_CONTRIBUTIONS_BASE = "https://github.com";
const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

const BASE_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  Vary: "Origin",
};

type CacheRow = {
  markup: string;
  expires_at: string;
  fetched_at: string;
  source_url: string;
};

function parseAllowedOrigins(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildCorsHeaders(origin: string): Record<string, string> {
  return origin
    ? { ...BASE_CORS_HEADERS, "Access-Control-Allow-Origin": origin }
    : { ...BASE_CORS_HEADERS };
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });
}

function validateUsername(raw: unknown): string {
  const username = String(raw ?? "").trim();
  if (!username) {
    throw new Error("username is required.");
  }
  if (!GITHUB_USERNAME_RE.test(username)) {
    throw new Error(
      "Invalid GitHub username. Only letters, numbers, and hyphens are allowed (1-39 chars, no leading/trailing hyphens).",
    );
  }
  return username;
}

function buildSourceUrl(username: string): string {
  return `${GITHUB_CONTRIBUTIONS_BASE}/users/${encodeURIComponent(username)}/contributions`;
}

function isFreshCache(cache: CacheRow | null): boolean {
  if (!cache?.expires_at) {
    return false;
  }
  return new Date(cache.expires_at).getTime() > Date.now();
}

async function fetchGitHubContributions(username: string): Promise<string> {
  const sourceUrl = buildSourceUrl(username);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PortfolioCalendarBot/2.0; +https://immaculatedesigns.com.ng)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const finalUrl = String(response.url || sourceUrl);
  if (!finalUrl.startsWith(`${GITHUB_CONTRIBUTIONS_BASE}/`)) {
    throw new Error("Response URL does not match expected GitHub origin.");
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`GitHub user "${username}" not found.`);
    }
    if (response.status === 429) {
      throw new Error("GitHub rate limit reached. Try again soon.");
    }
    throw new Error(`GitHub returned HTTP ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (
    !contentType.includes("text/html") &&
    !contentType.includes("text/plain") &&
    !contentType.includes("image/svg")
  ) {
    throw new Error("Unexpected content-type in GitHub response.");
  }

  const markup = (await response.text()).trim();
  if (!markup) {
    throw new Error("GitHub returned an empty response.");
  }
  if (markup.length > MAX_MARKUP_BYTES) {
    throw new Error("GitHub response exceeded size limit.");
  }

  return markup;
}

async function getCacheEntry(
  supabase: ReturnType<typeof createClient>,
  username: string,
): Promise<CacheRow | null> {
  const { data, error } = await supabase
    .from("github_activity_cache")
    .select("markup, expires_at, fetched_at, source_url")
    .eq("username", username)
    .maybeSingle<CacheRow>();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data ?? null;
}

async function upsertCache(
  supabase: ReturnType<typeof createClient>,
  username: string,
  markup: string,
  now: Date,
): Promise<void> {
  const sourceUrl = buildSourceUrl(username);
  const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1_000).toISOString();

  await supabase.from("github_activity_cache").upsert(
    {
      username,
      markup,
      fetched_at: now.toISOString(),
      expires_at: expiresAt,
      source_url: sourceUrl,
      metadata: {},
    },
    { onConflict: "username" },
  );
}

Deno.serve(async (req: Request) => {
  const origin = String(req.headers.get("origin") || "").trim();
  const allowedOrigins = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS") || "");

  if (origin) {
    if (!allowedOrigins.length) {
      return jsonResponse({ error: "Allowed origins are not configured." }, 500, BASE_CORS_HEADERS);
    }
    if (!allowedOrigins.includes(origin)) {
      return jsonResponse({ error: "Origin not allowed." }, 403, BASE_CORS_HEADERS);
    }
  }

  const corsHeaders = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed." }, 405, corsHeaders);
  }

  const authHeader = String(req.headers.get("authorization") || "").trim();
  const apikeyHeader = String(req.headers.get("apikey") || "").trim();
  if (!authHeader && !apikeyHeader) {
    return jsonResponse({ error: "Missing authorization." }, 401, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Server configuration error." }, 500, corsHeaders);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let username: string;
  try {
    username = validateUsername(new URL(req.url).searchParams.get("username"));
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 400, corsHeaders);
  }

  let cachedEntry: CacheRow | null = null;
  try {
    cachedEntry = await getCacheEntry(supabase, username);
  } catch (_error) {
    cachedEntry = null;
  }

  if (isFreshCache(cachedEntry)) {
    return jsonResponse(
      {
        username,
        markup: cachedEntry?.markup || "",
        cached: true,
        stale: false,
        fetchedAt: cachedEntry?.fetched_at || "",
        sourceUrl: cachedEntry?.source_url || buildSourceUrl(username),
      },
      200,
      corsHeaders,
    );
  }

  const now = new Date();

  try {
    const markup = await fetchGitHubContributions(username);

    try {
      await upsertCache(supabase, username, markup, now);
    } catch (_error) {
      // Cache writes are best-effort.
    }

    return jsonResponse(
      {
        username,
        markup,
        cached: false,
        stale: false,
        fetchedAt: now.toISOString(),
        sourceUrl: buildSourceUrl(username),
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    if (cachedEntry?.markup) {
      return jsonResponse(
        {
          username,
          markup: cachedEntry.markup,
          cached: true,
          stale: true,
          fetchedAt: cachedEntry.fetched_at || "",
          sourceUrl: cachedEntry.source_url || buildSourceUrl(username),
          message: (error as Error).message,
        },
        200,
        corsHeaders,
      );
    }

    return jsonResponse({ error: (error as Error).message }, 502, corsHeaders);
  }
});
