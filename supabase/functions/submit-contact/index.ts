import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let payload: Record<string, unknown>;

  try {
    payload = await request.json();
  } catch (_error) {
    return jsonResponse({ error: "Invalid JSON payload." }, 400);
  }

  const honeypot = normalizeText(payload.website, 200);
  if (honeypot) {
    return jsonResponse({ error: "Spam validation failed." }, 400);
  }

  const name = normalizeText(payload.name, 120);
  const email = normalizeText(payload.email, 160);
  const subject = normalizeText(payload.subject, 200);
  const message = normalizeText(payload.message, 3000);

  if (!name || !email || !message) {
    return jsonResponse({ error: "Name, email, and message are required." }, 400);
  }

  if (!isValidEmail(email)) {
    return jsonResponse({ error: "A valid email address is required." }, 400);
  }

  const normalizedEmail = email.toLowerCase();
  const nowIso = new Date().toISOString();

  const { data: limitRow, error: limitError } = await supabase
    .from("contact_rate_limits")
    .select("last_submission_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (limitError && limitError.code !== "PGRST116") {
    return jsonResponse({ error: limitError.message || "Rate limit check failed." }, 500);
  }

  if (limitRow?.last_submission_at) {
    const elapsedMs = Date.now() - new Date(limitRow.last_submission_at).getTime();
    if (elapsedMs < 60_000) {
      return jsonResponse({ error: "Please wait a minute before sending another message." }, 429);
    }
  }

  const { data: siteRow, error: siteError } = await supabase
    .from("site_content")
    .select("payload")
    .eq("id", "main")
    .maybeSingle();

  if (siteError && siteError.code !== "PGRST116") {
    return jsonResponse({ error: siteError.message || "Unable to load site settings." }, 500);
  }

  const sitePayload = siteRow?.payload || {};
  const deliveredTo =
    sitePayload?.settings?.contactRecipientEmail ||
    sitePayload?.profile?.email ||
    "";

  if (!deliveredTo) {
    return jsonResponse({ error: "No contact recipient email has been configured." }, 500);
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
    return jsonResponse({ error: insertError.message || "Unable to store the message." }, 500);
  }

  const { error: rateLimitWriteError } = await supabase.from("contact_rate_limits").upsert(
    {
      email: normalizedEmail,
      last_submission_at: nowIso
    },
    { onConflict: "email" }
  );

  if (rateLimitWriteError) {
    return jsonResponse({ error: rateLimitWriteError.message || "Unable to store the rate-limit state." }, 500);
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
      console.error("Resend delivery failed", error);
    }
  }

  return jsonResponse({
    id: messageId,
    deliveredTo,
    emailSent,
    mode: "supabase"
  });
});
