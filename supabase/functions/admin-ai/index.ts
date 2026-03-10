import { createClient } from "npm:@supabase/supabase-js@2";

const baseCorsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin"
};
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const PROVIDER_TIMEOUT_MS = 20_000;

type ProviderResult = {
  text: string;
  provider: string;
  model: string;
};

class ProviderError extends Error {
  provider: string;
  model: string;
  status: number;

  constructor(provider: string, model: string, message: string, status = 502) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.model = model;
    this.status = status;
  }
}

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

function getLengthInstruction(length: string) {
  const value = normalizeText(length, 24).toLowerCase();
  if (value === "short") return "Keep it tight: 1-2 sentences.";
  if (value === "long") return "Write 2-3 polished paragraphs.";
  return "Write one polished paragraph of 3-5 sentences.";
}

function getTaskInstruction(task: string) {
  const value = normalizeText(task, 24).toLowerCase();
  if (value === "improve") return "Improve the existing copy while preserving its intent.";
  if (value === "rewrite") return "Rewrite the copy with a clearer structure and stronger wording.";
  if (value === "shorten") return "Shorten the copy while keeping the most persuasive points.";
  if (value === "expand") return "Expand the copy with useful specifics and a stronger narrative.";
  return "Generate fresh copy from the request.";
}

function getMaxOutputTokens(length: string) {
  const value = normalizeText(length, 24).toLowerCase();
  if (value === "short") return 1536;
  if (value === "long") return 6144;
  return 3072;
}

function getFieldTypeInstruction(fieldType: string) {
  const value = normalizeText(fieldType, 32).toLowerCase();
  if (value === "single-line") {
    return "Return concise plain text suitable for a short single-line field.";
  }
  if (value === "list") {
    return "Return plain text lines for a multiline list field. Do not use markdown bullets unless the request clearly asks for them.";
  }
  if (value === "multi-paragraph") {
    return "Return multiple polished paragraphs separated by blank lines.";
  }
  if (value === "html") {
    return "Return clean HTML only, using simple tags like <p>, <ul>, and <li> when useful. Do not return markdown.";
  }
  return "Return polished plain text that fits naturally into the target field.";
}

function normalizeRelatedFields(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return {
        label: normalizeText(item.label, 120),
        value: normalizeText(item.value, 1200)
      };
    })
    .filter((entry) => entry.label && entry.value)
    .slice(0, 20);
}

function formatRelatedFields(fields: Array<{ label: string; value: string }>) {
  if (!fields.length) {
    return "";
  }

  return fields
    .map((entry) => `- ${entry.label}: ${entry.value}`)
    .join("\n");
}

function getProviderErrorMessage(data: unknown, fallback: string) {
  const source = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const providerError = source.error && typeof source.error === "object"
    ? source.error as Record<string, unknown>
    : null;

  if (typeof providerError?.message === "string" && providerError.message.trim()) {
    return providerError.message.trim();
  }

  if (typeof source.message === "string" && source.message.trim()) {
    return source.message.trim();
  }

  return fallback;
}

async function fetchJsonWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch (_error) {
      data = null;
    }

    return { response, data };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The AI provider timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractGeminiText(data: unknown) {
  const source = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const candidates = Array.isArray(source.candidates)
    ? source.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>
    : [];

  return candidates
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => String(part?.text || ""))
    .join("\n")
    .trim();
}

function extractChatCompletionText(data: unknown) {
  const source = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const choices = Array.isArray(source.choices)
    ? source.choices as Array<{ message?: { content?: unknown } }>
    : [];

  return choices
    .map((choice) => {
      const content = choice.message?.content;
      if (typeof content === "string") {
        return content;
      }
      if (Array.isArray(content)) {
        return content
          .map((part) => {
            if (typeof part === "string") {
              return part;
            }
            if (part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string") {
              return String((part as Record<string, unknown>).text);
            }
            return "";
          })
          .join("\n");
      }
      return "";
    })
    .join("\n")
    .trim();
}

async function generateWithGemini(
  instruction: string,
  maxOutputTokens: number,
  apiKey: string,
  model: string
): Promise<ProviderResult> {
  if (!apiKey) {
    throw new ProviderError("google-gemini", model, "Gemini is not configured.", 500);
  }

  const { response, data } = await fetchJsonWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: instruction }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens
        }
      })
    }
  );

  if (!response.ok) {
    const message = response.status === 429
      ? "Gemini quota has been reached."
      : getProviderErrorMessage(data, "The Gemini request failed.");
    throw new ProviderError("google-gemini", model, message, response.status);
  }

  const text = extractGeminiText(data);
  if (!text) {
    throw new ProviderError("google-gemini", model, "Gemini returned an empty response.", 502);
  }

  return {
    text,
    provider: "google-gemini",
    model
  };
}

async function generateWithGroq(
  instruction: string,
  maxOutputTokens: number,
  apiKey: string,
  model: string
): Promise<ProviderResult> {
  if (!apiKey) {
    throw new ProviderError("groq", model, "Groq is not configured.", 500);
  }

  const { response, data } = await fetchJsonWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: instruction
          }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_completion_tokens: Math.min(maxOutputTokens, 4096)
      })
    }
  );

  if (!response.ok) {
    const message = response.status === 429
      ? "Groq free-tier quota has been reached."
      : getProviderErrorMessage(data, "The Groq request failed.");
    throw new ProviderError("groq", model, message, response.status);
  }

  const text = extractChatCompletionText(data);
  if (!text) {
    throw new ProviderError("groq", model, "Groq returned an empty response.", 502);
  }

  return {
    text,
    provider: "groq",
    model
  };
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
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
  const geminiModel = Deno.env.get("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL;
  const groqApiKey = Deno.env.get("GROQ_API_KEY") || "";
  const groqModel = Deno.env.get("GROQ_MODEL") || DEFAULT_GROQ_MODEL;

  if (!supabaseUrl || !serviceRoleKey || (!geminiApiKey && !groqApiKey)) {
    return jsonResponse({ error: "Admin AI is not configured on the server." }, 500, corsHeaders);
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

  const task = normalizeText(payload.task, 24).toLowerCase() || "generate";
  const prompt = normalizeText(payload.prompt, 9000);
  const currentText = normalizeText(payload.currentText, 18000);
  const fieldContext = normalizeText(payload.fieldContext, 400) || "portfolio copy";
  const fieldLabel = normalizeText(payload.fieldLabel, 160) || "content field";
  const sectionContext = normalizeText(payload.sectionContext, 160) || "portfolio admin form";
  const fieldType = normalizeText(payload.fieldType, 32) || "plain-text";
  const tone = normalizeText(payload.tone, 40).toLowerCase() || "professional";
  const length = normalizeText(payload.length, 24).toLowerCase() || "medium";
  const contextNotes = normalizeText(payload.contextNotes, 6000);
  const relatedFields = normalizeRelatedFields(payload.relatedFields);
  const relatedFieldText = formatRelatedFields(relatedFields);

  if (!prompt && !currentText) {
    return jsonResponse({ error: "A prompt or current text is required." }, 400, corsHeaders);
  }

  const instruction = [
    "You are an expert copy assistant for a professional web developer portfolio.",
    getTaskInstruction(task),
    "Use any related form values to keep the result consistent with the rest of the content and avoid contradictions.",
    `Section: ${sectionContext}.`,
    `Target field: ${fieldLabel}.`,
    `Field context: ${fieldContext}.`,
    getFieldTypeInstruction(fieldType),
    `Tone: ${tone}.`,
    getLengthInstruction(length),
    relatedFieldText ? `Related form inputs:\n${relatedFieldText}` : "",
    contextNotes ? `Additional user instructions:\n${contextNotes}` : "",
    currentText ? `Current text:\n${currentText}` : "",
    prompt ? `Primary request:\n${prompt}` : "",
    "Return only the final copy for the target field. Do not add headings, explanations, markdown fences, or labels."
  ]
    .filter(Boolean)
    .join("\n\n");

  const maxOutputTokens = getMaxOutputTokens(length);
  const providerChain = [
    geminiApiKey
      ? () => generateWithGemini(instruction, maxOutputTokens, geminiApiKey, geminiModel)
      : null,
    groqApiKey
      ? () => generateWithGroq(instruction, maxOutputTokens, groqApiKey, groqModel)
      : null
  ].filter(Boolean) as Array<() => Promise<ProviderResult>>;

  try {
    const providerFailures: Array<ProviderError> = [];

    for (const runProvider of providerChain) {
      try {
        const result = await runProvider();

        if (providerFailures.length) {
          console.warn(
            JSON.stringify({
              event: "admin_ai_fallback_succeeded",
              provider: result.provider,
              model: result.model,
              previousFailures: providerFailures.map((failure) => ({
                provider: failure.provider,
                model: failure.model,
                status: failure.status
              }))
            })
          );
        }

        return jsonResponse(result, 200, corsHeaders);
      } catch (error) {
        const failure = error instanceof ProviderError
          ? error
          : new ProviderError("unknown", "unknown", error instanceof Error ? error.message : "Unknown AI provider error.", 502);

        providerFailures.push(failure);
        console.error(
          JSON.stringify({
            event: "admin_ai_provider_failed",
            provider: failure.provider,
            model: failure.model,
            status: failure.status,
            error: failure.message
          })
        );
      }
    }

    const lastFailure = providerFailures[providerFailures.length - 1];
    if (lastFailure) {
      const quotaFailure = providerFailures.some((failure) => failure.status === 429);
      const errorMessage = quotaFailure
        ? "AI quota has been reached on the available providers. Try again later."
        : lastFailure.message || "Unable to generate AI copy right now.";
      return jsonResponse({ error: errorMessage }, quotaFailure ? 429 : 502, corsHeaders);
    }

    return jsonResponse({ error: "Unable to generate AI copy right now." }, 502, corsHeaders);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "admin_ai_failed",
        message: error instanceof Error ? error.message : "Unknown admin AI error"
      })
    );
    return jsonResponse({ error: "Unable to generate AI copy right now." }, 500, corsHeaders);
  }
});
