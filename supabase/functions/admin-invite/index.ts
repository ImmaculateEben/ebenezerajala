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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.replace(/^Bearer\s+/i, "").trim();
}

function resolveInviteRedirect(origin: string, allowedOrigins: string[]) {
  const base = origin || allowedOrigins[0] || "";
  return base ? `${base.replace(/\/+$/, "")}/admin` : undefined;
}

function isExistingUserInviteError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("already been registered")
    || normalized.includes("already registered")
    || normalized.includes("already exists");
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

  let requesterEmail = "";
  try {
    requesterEmail = await requireAdminEmail(supabase, request);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unauthorized." }, 403, corsHeaders);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch (_error) {
    return jsonResponse({ error: "Invalid JSON payload." }, 400, corsHeaders);
  }

  const email = normalizeText(payload.email, 160).toLowerCase();
  const roleInput = normalizeText(payload.role, 24).toLowerCase();
  const role = ["viewer", "editor", "admin"].includes(roleInput) ? roleInput : "editor";

  if (!email || !isValidEmail(email)) {
    return jsonResponse({ error: "A valid email address is required." }, 400, corsHeaders);
  }

  try {
    let existingUser = false;
    const redirectTo = resolveInviteRedirect(origin, allowedOrigins);
    const inviteOptions = redirectTo ? { redirectTo } : undefined;
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, inviteOptions);

    if (inviteError) {
      if (isExistingUserInviteError(inviteError.message || "")) {
        existingUser = true;
      } else {
        throw new Error(inviteError.message || "Unable to send the invite email.");
      }
    }

    const { data, error } = await supabase
      .from("admin_users")
      .upsert(
        {
          email,
          role,
          invited_by: requesterEmail
        },
        { onConflict: "email" }
      )
      .select("email, role, invited_by, created_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Unable to update the admin allowlist.");
    }

    return jsonResponse(
      {
        invited: true,
        email,
        role,
        existingUser,
        invitedBy: data?.invited_by || requesterEmail,
        createdAt: data?.created_at || ""
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "admin_invite_failed",
        message: error instanceof Error ? error.message : "Unknown admin invite error",
        targetEmail: email,
        requesterEmail
      })
    );
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to invite the admin user." }, 500, corsHeaders);
  }
});
