import type { SupabaseClient } from "@supabase/supabase-js";

/** Elimina todas las auditorías del usuario al cambiar de cuenta Google Ads. */
export async function wipeHistorialOnAccountChange(
  admin: SupabaseClient,
  userId: string
): Promise<{ error: Error | null }> {
  const { error } = await admin
    .from("historial_auditorias")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}
