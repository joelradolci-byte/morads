import { supabase } from "@/lib/supabase/browser";

export async function moraAuthHeaders(
  extra?: Record<string, string>
): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
