import { createClient } from "npm:@supabase/supabase-js@2";

const baseCorsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin"
};

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
      "Content-Type": "application/json"
    }
  });
}

function normalizeText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().replace(/\u0000/g, "").slice(0, maxLength);
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.replace(/^Bearer\s+/i, "").trim();
}

function normalizeAbsoluteUrl(value: unknown) {
  const raw = normalizeText(value, 2000);
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    if (!/^https?:$/.test(parsed.protocol)) {
      return "";
    }
    parsed.hash = "";
    return parsed.toString();
  } catch (_error) {
    return "";
  }
}

function normalizePropertyUrl(value: string) {
  if (!value) {
    return "";
  }

  try {
    const parsed = new URL(value);
    parsed.pathname = parsed.pathname === "/" ? "/" : `${parsed.pathname.replace(/\/+$/, "")}/`;
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch (_error) {
    return "";
  }
}

function resolveSitemapUrl(value: unknown, propertyUrl: string) {
  const raw = normalizeText(value, 2000);
  if (!raw) {
    return propertyUrl ? new URL("sitemap.xml", propertyUrl).toString() : "";
  }

  try {
    return new URL(raw, propertyUrl || undefined).toString();
  } catch (_error) {
    return "";
  }
}

function base64UrlEncode(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string) {
  const normalized = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function getGoogleAccessToken() {
  const clientEmail = Deno.env.get("SEARCH_CONSOLE_SERVICE_ACCOUNT_EMAIL") || "";
  const privateKey = Deno.env.get("SEARCH_CONSOLE_SERVICE_ACCOUNT_PRIVATE_KEY") || "";

  if (!clientEmail || !privateKey) {
    return "";
  }

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/webmasters",
      aud: "https://oauth2.googleapis.com/token",
      exp: issuedAt + 3600,
      iat: issuedAt
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken)
  );
  const assertion = `${unsignedToken}.${base64UrlEncode(new Uint8Array(signatureBuffer))}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google token request failed with status ${tokenResponse.status}.`);
  }

  const tokenPayload = await tokenResponse.json();
  return normalizeText(tokenPayload?.access_token, 4096);
}

async function requireAdminEmail(
  supabase: ReturnType<typeof createClient>,
  request: Request
) {
  const token = getBearerToken(request);
  if (!token) {
    throw new Error("Missing authorization token.");
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) {
    throw new Error(error?.message || "Unable to resolve the authenticated user.");
  }

  const email = data.user.email.toLowerCase();
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("email")
    .ilike("email", email)
    .maybeSingle();

  if (adminError && adminError.code !== "PGRST116") {
    throw new Error(adminError.message || "Unable to verify admin access.");
  }

  if (!adminUser?.email) {
    throw new Error("Admin access is required.");
  }

  return email;
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

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 500, corsHeaders);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    await requireAdminEmail(supabase, request);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unauthorized." }, 403, corsHeaders);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch (_error) {
    return jsonResponse({ error: "Invalid JSON payload." }, 400, corsHeaders);
  }

  const action = normalizeText(payload.action, 60);
  if (action !== "pingSitemap") {
    return jsonResponse({ error: "Unsupported action." }, 400, corsHeaders);
  }

  const propertyUrl = normalizePropertyUrl(normalizeAbsoluteUrl(payload.siteUrl));
  const sitemapUrl = resolveSitemapUrl(payload.sitemapUrl, propertyUrl);
  if (!propertyUrl || !sitemapUrl) {
    return jsonResponse({ error: "A valid site URL is required." }, 400, corsHeaders);
  }

  const checkedAt = new Date().toISOString();

  let reachable = false;
  let responseStatus = 0;
  let contentType = "";

  try {
    const sitemapResponse = await fetch(sitemapUrl, {
      headers: {
        Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8"
      }
    });
    responseStatus = sitemapResponse.status;
    contentType = normalizeText(sitemapResponse.headers.get("content-type") || "", 200);
    reachable = sitemapResponse.ok;
  } catch (_error) {
    reachable = false;
  }

  if (!reachable) {
    return jsonResponse(
      {
        checkedAt,
        submitted: false,
        reachable: false,
        sitemapUrl,
        status: "unreachable",
        message: `The sitemap URL could not be reached (status ${responseStatus || "unknown"}).`
      },
      502,
      corsHeaders
    );
  }

  const hasGoogleCredentials = Boolean(
    Deno.env.get("SEARCH_CONSOLE_SERVICE_ACCOUNT_EMAIL") &&
    Deno.env.get("SEARCH_CONSOLE_SERVICE_ACCOUNT_PRIVATE_KEY")
  );

  if (!hasGoogleCredentials) {
    return jsonResponse(
      {
        checkedAt,
        submitted: false,
        reachable: true,
        sitemapUrl,
        status: "checked",
        message: `Sitemap is reachable (${responseStatus}, ${contentType || "unknown content type"}). Add Search Console API credentials to submit automatically.`
      },
      200,
      corsHeaders
    );
  }

  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
      throw new Error("Search Console API credentials are incomplete.");
    }

    const submitEndpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    const submitResponse = await fetch(submitEndpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      throw new Error(errorText || `Search Console returned ${submitResponse.status}.`);
    }

    return jsonResponse(
      {
        checkedAt,
        submitted: true,
        reachable: true,
        sitemapUrl,
        status: "submitted",
        message: "Sitemap is reachable and was submitted to Google Search Console."
      },
      200,
      corsHeaders
    );
  } catch (error) {
    return jsonResponse(
      {
        checkedAt,
        submitted: false,
        reachable: true,
        sitemapUrl,
        status: "checked",
        message: error instanceof Error ? error.message : "Unable to submit the sitemap to Search Console."
      },
      200,
      corsHeaders
    );
  }
});
