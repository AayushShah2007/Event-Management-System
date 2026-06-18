import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

console.log("[Supabase] URL loaded:", supabaseUrl ? "YES (" + supabaseUrl.substring(0, 20) + "...)" : "NO - EMPTY!");
console.log("[Supabase] Key loaded:", supabaseAnonKey ? "YES (" + supabaseAnonKey.substring(0, 10) + "...)" : "NO - EMPTY!");

// Custom fetch with 8s timeout to prevent supabase-js from hanging
const fetchWithTimeout: typeof fetch = (url, options) => {
  return fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: { fetch: fetchWithTimeout },
});

export const getSupabaseClient = () => {
  return supabase;
};
