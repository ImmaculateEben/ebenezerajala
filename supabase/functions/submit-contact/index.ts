import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend";

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

function isAllowedOrigin(origin: string, allowedOrigins: string[]) {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes(origin);
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

function getRequestOrigin(request: Request) {
  return String(request.headers.get("origin") || "").trim();
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")
    || "";
  return forwarded.split(",")[0]?.trim() || "";
}

async function hashIdentifier(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

async function verifyTurnstile(secret: string, token: string, remoteIp: string) {
  const body = new URLSearchParams({
    secret,
    response: token
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  return response.json();
}

async function readSubmissionLimit(
  supabase: ReturnType<typeof createClient>,
  scope: "email" | "ip",
  identifier: string
) {
  const { data, error } = await supabase
    .from("contact_submission_limits")
    .select("last_submission_at")
    .eq("scope", scope)
    .eq("identifier", identifier)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message || "Rate limit check failed.");
  }

  return data?.last_submission_at ? new Date(data.last_submission_at).getTime() : 0;
}

async function writeSubmissionLimit(
  supabase: ReturnType<typeof createClient>,
  scope: "email" | "ip",
  identifier: string,
  nowIso: string
) {
  const { error } = await supabase.from("contact_submission_limits").upsert(
    {
      scope,
      identifier,
      last_submission_at: nowIso
    },
    { onConflict: "scope,identifier" }
  );

  if (error) {
    throw new Error(error.message || "Unable to store the rate-limit state.");
  }
}

Deno.serve(async (request) => {
  const origin = getRequestOrigin(request);
  const allowedOrigins = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS") || "");
  const corsHeaders = buildCorsHeaders(origin);

  if (origin) {
    if (!allowedOrigins.length) {
      return jsonResponse({ error: "Allowed origins are not configured." }, 500, corsHeaders);
    }

    if (!isAllowedOrigin(origin, allowedOrigins)) {
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
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "";
  const turnstileSecretKey = Deno.env.get("TURNSTILE_SECRET_KEY") || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 500, corsHeaders);
  }

  if (!turnstileSecretKey) {
    return jsonResponse({ error: "Contact form protection is not configured." }, 500, corsHeaders);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch (_error) {
    return jsonResponse({ error: "Invalid JSON payload." }, 400, corsHeaders);
  }

  const honeypot = normalizeText(payload.website, 200);
  if (honeypot) {
    return jsonResponse({ error: "Spam validation failed." }, 400, corsHeaders);
  }

  const name = normalizeText(payload.name, 120);
  const email = normalizeText(payload.email, 160);
  const subject = normalizeText(payload.subject, 200);
  const message = normalizeText(payload.message, 3000);
  const turnstileToken = normalizeText(payload.turnstileToken, 4096);

  if (!name || !email || !message) {
    return jsonResponse({ error: "Name, email, and message are required." }, 400, corsHeaders);
  }

  if (!isValidEmail(email)) {
    return jsonResponse({ error: "A valid email address is required." }, 400, corsHeaders);
  }

  if (!turnstileToken) {
    return jsonResponse({ error: "Please complete the spam-protection check." }, 400, corsHeaders);
  }

  const normalizedEmail = email.toLowerCase();
  const clientIp = getClientIp(request);
  const nowIso = new Date().toISOString();
  const ipIdentifier = clientIp ? await hashIdentifier(clientIp) : "";

  try {
    const turnstileResult = await verifyTurnstile(turnstileSecretKey, turnstileToken, clientIp);
    if (!turnstileResult?.success) {
      console.error(
        JSON.stringify({
          event: "contact_turnstile_failed",
          errors: turnstileResult?.["error-codes"] || []
        })
      );
      return jsonResponse({ error: "Please complete the spam-protection check." }, 400, corsHeaders);
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "contact_turnstile_error",
        message: error instanceof Error ? error.message : "Unknown Turnstile error"
      })
    );
    return jsonResponse({ error: "Unable to verify the spam-protection check." }, 502, corsHeaders);
  }

  try {
    const emailLastSubmissionAt = await readSubmissionLimit(supabase, "email", normalizedEmail);
    if (emailLastSubmissionAt && Date.now() - emailLastSubmissionAt < 60_000) {
      return jsonResponse({ error: "Please wait a minute before sending another message." }, 429, corsHeaders);
    }

    if (ipIdentifier) {
      const ipLastSubmissionAt = await readSubmissionLimit(supabase, "ip", ipIdentifier);
      if (ipLastSubmissionAt && Date.now() - ipLastSubmissionAt < 60_000) {
        return jsonResponse({ error: "Please wait a minute before sending another message." }, 429, corsHeaders);
      }
    }

    const { data: siteRow, error: siteError } = await supabase
      .from("site_content")
      .select("payload")
      .eq("id", "main")
      .maybeSingle();

    if (siteError && siteError.code !== "PGRST116") {
      return jsonResponse({ error: siteError.message || "Unable to load site settings." }, 500, corsHeaders);
    }

    const sitePayload = siteRow?.payload || {};
    const deliveredTo =
      sitePayload?.settings?.contactRecipientEmail ||
      sitePayload?.profile?.email ||
      "";

    if (!deliveredTo) {
      return jsonResponse({ error: "No contact recipient email has been configured." }, 500, corsHeaders);
    }

    const messageId = crypto.randomUUID();
    const messagePayload = {
      id: messageId,
      name,
      email,
      subject,
      message,
      createdAt: nowIso,
      status: "new",
      source: "portfolio-contact-form",
      deliveredTo
    };

    const { error: insertError } = await supabase.from("messages").upsert(
      {
        id: messageId,
        payload: messagePayload,
        created_at: nowIso
      },
      { onConflict: "id" }
    );

    if (insertError) {
      return jsonResponse({ error: insertError.message || "Unable to store the message." }, 500, corsHeaders);
    }

    await writeSubmissionLimit(supabase, "email", normalizedEmail, nowIso);
    if (clientIp) {
      await writeSubmissionLimit(supabase, "ip", ipIdentifier, nowIso);
    }

    let emailSent = false;

    if (resendApiKey && resendFromEmail) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: resendFromEmail,
          to: [deliveredTo],
          replyTo: email,
          subject: `New Portfolio Contact: ${subject || "General Enquiry"}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Subject: ${subject || "General Enquiry"}`,
            `Received: ${nowIso}`,
            "",
            message
          ].join("\n")
        });
        emailSent = true;
      } catch (error) {
        console.error(
          JSON.stringify({
            event: "contact_resend_failed",
            message: error instanceof Error ? error.message : "Unknown email delivery error"
          })
        );
      }
    }

    return jsonResponse(
      {
        id: messageId,
        deliveredTo,
        emailSent,
        mode: "supabase"
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "contact_submit_failed",
        message: error instanceof Error ? error.message : "Unknown submission error"
      })
    );
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to process the request." }, 500, corsHeaders);
  }
});
