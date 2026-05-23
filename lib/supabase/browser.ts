import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase browser environment variables.");
}

const globalForSupabase = globalThis as typeof globalThis & {
  __moraSupabaseBrowserClient?: SupabaseClient;
};

export const supabase =
  globalForSupabase.__moraSupabaseBrowserClient ??
  createClient(supabaseUrl, supabaseAnonKey);

globalForSupabase.__moraSupabaseBrowserClient = supabase;
