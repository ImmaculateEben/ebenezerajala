import { createClient } from "npm:@supabase/supabase-js@2";

const baseCorsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  Vary: "Origin"
};

const GITHUB_USERNAME_PATTERN = /^[A-Za-z0-9-]{1,39}$/;

function parseAllowedOrigins(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildCorsHeaders(origin: string) {
  return origin
    ? {
        ...baseCorsHeaders,
        "Access-Control-Allow-Origin": origin
      }
    : { ...baseCorsHeaders };
}

function jsonResponse(body: Record<string, unknown>, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=3600"
    }
  });
}

function normalizeUsername(value: string) {
  const username = String(value || "").trim();
  if (!GITHUB_USERNAME_PATTERN.test(username) || username.startsWith("-") || username.endsWith("-")) {
    return "";
  }
  return username;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildGitHubEndpoint(username: string) {
  const today = new Date();
  const from = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
  return `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${toIsoDate(from)}&to=${toIsoDate(today)}`;
}

function looksLikeContributionSvg(markup: string) {
  const source = String(markup || "");
  return source.includes("<svg") && source.includes("data-date");
}

Deno.serve(async (request) => {
  const origin = String(request.headers.get("origin") || "").trim();
  const allowedOrigins = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS") || "");
  const corsHeaders = buildCorsHeaders(origin);

  if (origin) {
    if (!allowedOrigins.length) {
      return jsonResponse({ error: "Allowed origins are not configured." }, 500, corsHeaders);
    }

    if (!allowedOrigins.includes(origin)) {
      return jsonResponse({ error: "Origin not allowed." }, 403, corsHeaders);
    }
  }

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed." }, 405, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 500, corsHeaders);
  }

  const url = new URL(request.url);
  const username = normalizeUsername(url.searchParams.get("username") || "");
  if (!username) {
    return jsonResponse({ error: "A valid GitHub username is required." }, 400, corsHeaders);
  }

  const ttlSeconds = Math.max(900, Number(Deno.env.get("GITHUB_ACTIVITY_CACHE_TTL_SECONDS") || 21600));
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: cached, error: cacheError } = await supabase
    .from("github_activity_cache")
    .select("username, markup, fetched_at, expires_at, source_url")
    .eq("username", username)
    .maybeSingle();

  if (cacheError && cacheError.code !== "PGRST116") {
    return jsonResponse({ error: cacheError.message || "Unable to read the GitHub activity cache." }, 500, corsHeaders);
  }

  const now = new Date();
  const sourceUrl = buildGitHubEndpoint(username);
  const cachedExpiresAt = cached?.expires_at ? new Date(cached.expires_at) : null;

  if (cached?.markup && cachedExpiresAt && cachedExpiresAt.getTime() > now.getTime()) {
    return jsonResponse(
      {
        username,
        markup: cached.markup,
        cached: true,
        stale: false,
        fetchedAt: cached.fetched_at || "",
        sourceUrl: cached.source_url || sourceUrl
      },
      200,
      corsHeaders
    );
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "EbenezerPortfolio/1.0",
        Accept: "image/svg+xml,text/html;q=0.9,*/*;q=0.8"
      }
    });

    const markup = await response.text();
    if (!response.ok || !looksLikeContributionSvg(markup)) {
      throw new Error(`GitHub returned ${response.status}.`);
    }

    const fetchedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

    const { error: upsertError } = await supabase.from("github_activity_cache").upsert(
      {
        username,
        markup,
        fetched_at: fetchedAt,
        expires_at: expiresAt,
        source_url: sourceUrl,
        metadata: { httpStatus: response.status }
      },
      { onConflict: "username" }
    );

    if (upsertError) {
      console.error(JSON.stringify({ event: "github_cache_upsert_failed", message: upsertError.message }));
    }

    return jsonResponse(
      {
        username,
        markup,
        cached: false,
        stale: false,
        fetchedAt,
        sourceUrl
      },
      200,
      corsHeaders
    );
  } catch (error) {
    if (cached?.markup) {
      return jsonResponse(
        {
          username,
          markup: cached.markup,
          cached: true,
          stale: true,
          fetchedAt: cached.fetched_at || "",
          sourceUrl: cached.source_url || sourceUrl,
          message: error instanceof Error ? error.message : "Using stale cached data."
        },
        200,
        corsHeaders
      );
    }

    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unable to load GitHub activity." },
      502,
      corsHeaders
    );
  }
});
