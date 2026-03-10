import { createClient } from "npm:@supabase/supabase-js@2";

/* ── Constants ──────────────────────────────────────────────────── */
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const FETCH_TIMEOUT_MS = 8_000;
const MAX_MARKUP_BYTES = 300_000; // 300 KB safety cap on GitHub response
// GitHub's public contributions endpoint (no auth required, unauthenticated)
const GITHUB_CONTRIBUTIONS_BASE = "https://github.com";
// Strict username validation: 1-39 chars, alphanumeric + hyphens, no leading/trailing hyphen
const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

/* ── CORS ───────────────────────────────────────────────────────── */
const BASE_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  Vary: "Origin",
};

function parseAllowedOrigins(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  if (!origin) return true;
  if (!allowed.length) return true;
  return allowed.includes(origin);
}

function buildCorsHeaders(
  origin: string,
  allowed: string[]
): Record<string, string> {
  const ok = isAllowedOrigin(origin, allowed);
  return ok && origin
    ? { ...BASE_CORS_HEADERS, "Access-Control-Allow-Origin": origin }
    : { ...BASE_CORS_HEADERS };
}

/* ── HTTP helpers ───────────────────────────────────────────────── */
function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/* ── Input validation ───────────────────────────────────────────── */
function validateUsername(raw: unknown): string {
  const username = String(raw ?? "").trim();
  if (!username) throw new Error("username is required.");
  if (!GITHUB_USERNAME_RE.test(username)) {
    throw new Error(
      "Invalid GitHub username. Only letters, numbers, and hyphens are allowed (1-39 chars, no leading/trailing hyphens)."
    );
  }
  return username;
}

/* ── SSRF-safe GitHub fetch ─────────────────────────────────────── */
async function fetchGitHubContributions(username: string): Promise<string> {
  // Construct URL deterministically — never from user input in the path
  const url = `${GITHUB_CONTRIBUTIONS_BASE}/users/${encodeURIComponent(username)}/contributions`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PortfolioCalendarBot/2.0; +https://immaculatedesigns.com.ng)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        // Tell GitHub this is an XHR so it only returns the fragment
        "X-Requested-With": "XMLHttpRequest",
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }

  // SSRF guard: ensure the final URL is still github.com after any redirect
  const finalUrl = String(response.url || url);
  if (!finalUrl.startsWith(GITHUB_CONTRIBUTIONS_BASE + "/")) {
    throw new Error("Response URL does not match expected GitHub origin.");
  }

  if (!response.ok) {
    if (response.status === 404) throw new Error(`GitHub user "${username}" not found.`);
    if (response.status === 429) throw new Error("GitHub rate limit reached. Try again soon.");
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

  const text = await response.text();
  if (!text || !text.trim()) throw new Error("GitHub returned an empty response.");
  if (text.length > MAX_MARKUP_BYTES) throw new Error("GitHub response exceeded size limit.");

  return text.trim();
}

/* ── DB cache helpers ───────────────────────────────────────────── */
type CacheRow = { markup: string; expires_at: string };

async function getCached(
  supabase: ReturnType<typeof createClient>,
  username: string
): Promise<string | null> {
  const { data } = await supabase
    .from("github_activity_cache")
    .select("markup, expires_at")
    .eq("username", username)
    .maybeSingle<CacheRow>();

  if (!data) return null;
  if (new Date(data.expires_at) <= new Date()) return null; // stale
  return data.markup;
}

async function upsertCache(
  supabase: ReturnType<typeof createClient>,
  username: string,
  markup: string,
  now: Date
): Promise<void> {
  const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1_000).toISOString();
  await supabase.from("github_activity_cache").upsert(
    {
      username,
      markup,
      fetched_at: now.toISOString(),
      expires_at: expiresAt,
      source_url: `${GITHUB_CONTRIBUTIONS_BASE}/users/${username}/contributions`,
      metadata: {},
    },
    { onConflict: "username" }
  );
}

/* ── Main handler ───────────────────────────────────────────────── */
Deno.serve(async (req: Request) => {
  const origin = String(req.headers.get("origin") || "").trim();
  const allowedOrigins = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS") || "");
  const cors = buildCorsHeaders(origin, allowedOrigins);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed." }, 405, cors);
  }

  // Require a valid Supabase anon or service-role token to prevent open abuse
  const authHeader = String(req.headers.get("authorization") || "").trim();
  const apikeyHeader = String(req.headers.get("apikey") || "").trim();
  if (!authHeader && !apikeyHeader) {
    return jsonResponse({ error: "Missing authorization." }, 401, cors);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Server configuration error." }, 500, cors);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Parse + validate username
  let username: string;
  try {
    const params = new URL(req.url).searchParams;
    username = validateUsername(params.get("username"));
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 400, cors);
  }

  const now = new Date();

  // Try cache first
  try {
    const cached = await getCached(supabase, username);
    if (cached) {
      return jsonResponse({ markup: cached, cached: true }, 200, cors);
    }
  } catch (_cacheErr) {
    // Non-fatal — fall through to live fetch
  }

  // Live fetch from GitHub
  let markup: string;
  try {
    markup = await fetchGitHubContributions(username);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 502, cors);
  }

  // Write to cache (non-fatal if this fails)
  try {
    await upsertCache(supabase, username, markup, now);
  } catch (_writeErr) {
    // Ignore cache write errors
  }

  return jsonResponse({ markup, cached: false }, 200, cors);
});
