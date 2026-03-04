import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const defaultRuntimeConfig = {
  supabase: {
    url: "",
    anonKey: ""
  },
  adminEmail: "",
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

function hasSupabaseConfig(config) {
  return ["url", "anonKey"].every((key) => String(config[key] || "").trim());
}

let client = null;
let ready = false;
let initializationError = "";

if (hasSupabaseConfig(mergedSupabaseConfig)) {
  try {
    client = createClient(mergedSupabaseConfig.url, mergedSupabaseConfig.anonKey, {
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
  initializationError = "Supabase runtime config is missing.";
}

export function getRuntimeMode() {
  return ready ? "supabase" : "local-preview";
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
