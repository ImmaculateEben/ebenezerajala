import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const defaultRuntimeConfig = {
  supabase: {
    url: "https://rsawwbmgbcknuqpueioc.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzYXd3Ym1nYmNrbnVxcHVlaW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDYwMzgsImV4cCI6MjA4ODIyMjAzOH0.lQXtlu-krAEureNpjMLWuaTSe5nIQfQOnZP5TCdIRsI"
  },
  adminEmail: "ebenezerajala1305@gmail.com",
  storageBucket: "portfolio-assets"
};

const runtimeConfig = {
  ...defaultRuntimeConfig,
  ...(window.EA_RUNTIME_CONFIG || {})
};

const mergedSupabaseConfig = {
  ...defaultRuntimeConfig.supabase,
  ...(runtimeConfig.supabase || {})
};

function resolveSupabaseConfig(config) {
  return {
    url: String(config.url || "").trim(),
    anonKey: String(config.anonKey || "").trim()
  };
}

function hasSupabaseConfig(config) {
  return ["url", "anonKey"].every((key) => String(config[key] || "").trim());
}

let client = null;
let ready = false;
let initializationError = "";

const resolvedSupabaseConfig = resolveSupabaseConfig(mergedSupabaseConfig);

if (hasSupabaseConfig(resolvedSupabaseConfig)) {
  try {
    client = createClient(resolvedSupabaseConfig.url, resolvedSupabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    ready = true;
  } catch (error) {
    initializationError = error instanceof Error ? error.message : "Supabase failed to initialize.";
  }
} else {
  initializationError =
    "Supabase runtime config is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY).";
}

export function getRuntimeMode() {
  return ready ? "supabase" : "unavailable";
}

export function isSupabaseReady() {
  return ready;
}

export function getSupabaseInitializationError() {
  return initializationError;
}

export function getRuntimeConfig() {
  return runtimeConfig;
}

export function getSupabaseClient() {
  return client;
}

export async function signInAdmin(email, password) {
  if (ready && client) {
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || "")
    });
    if (error) {
      throw new Error(error.message || "Unable to sign in.");
    }
    return data;
  }
  throw new Error("Supabase is not configured. Admin sign-in is disabled until runtime-config.js is set.");
}

export async function signOutAdmin() {
  if (ready && client) {
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error(error.message || "Unable to sign out.");
    }
    return;
  }
}

export function onAdminAuthChanged(callback) {
  if (ready && client) {
    client.auth.getSession().then(({ data }) => {
      callback(data.session?.user || null);
    });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }
  callback(null);
  return () => undefined;
}
