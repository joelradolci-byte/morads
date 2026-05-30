import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { computeFeedbackEligibility } from "./eligibility";
import type { SurveyPayload } from "./validateSurvey";

export async function fetchFeedbackEligibilityForUser(userId: string) {
  const admin = getSupabaseAdmin();

  const { data: audits, error: auditError } = await admin
    .from("historial_auditorias")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (auditError) throw auditError;

  const auditCount = audits?.length ?? 0;
  const firstAuditAt =
    auditCount > 0 && audits?.[0]?.created_at
      ? String(audits[0].created_at)
      : null;

  const { data: lastSurvey } = await admin
    .from("feedback")
    .select("created_at")
    .eq("user_id", userId)
    .eq("tipo", "encuesta")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const eligibility = computeFeedbackEligibility({
    auditCount,
    firstAuditAt,
    lastSurveyAt: lastSurvey?.created_at
      ? String(lastSurvey.created_at)
      : null,
  });

  return eligibility;
}

export async function insertFeedbackSurvey(
  userId: string,
  email: string,
  payload: SurveyPayload
) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("feedback").insert({
    user_id: userId,
    usuario_email: email,
    tipo: "encuesta",
    nps: payload.nps,
    feature_ratings: payload.feature_ratings,
    intereses: payload.intereses,
    mensaje: payload.comentario ?? null,
  });

  if (error) throw error;
}
