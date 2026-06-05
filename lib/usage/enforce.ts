import { getPlanState, type PlanState } from "@/lib/billing/plan";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  countForAction,
  currentUsagePeriod,
  LIMITS_PAID,
  LIMITS_TRIAL,
  PRO_PRICE_PER_MONTH,
  type PaidActionLimits,
  type PlanTier,
  type TrialActionLimits,
  type UsageAction,
  type UsageSnapshot,
} from "./config";

export type { UsageSnapshot };

export type UsageDenyReason =
  | "rate_limit"
  | "quota_exceeded"
  | "unauthorized"
  | "trial_not_started"
  | "trial_expired"
  | "pro_required";

export class UsageLimitError extends Error {
  constructor(
    public reason: UsageDenyReason,
    public retryAfterSeconds: number,
    public message: string,
    public snapshot?: UsageSnapshot
  ) {
    super(message);
    this.name = "UsageLimitError";
  }
}

export class ProFeatureError extends Error {
  constructor(
    public message: string,
    public snapshot?: UsageSnapshot
  ) {
    super(message);
    this.name = "ProFeatureError";
  }
}

async function fetchMonthlyUsage(userId: string, period: string) {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("user_usage")
    .select("audits_count, anuncios_count, pdf_count")
    .eq("user_id", userId)
    .eq("period", period)
    .maybeSingle();

  return {
    audits_count: data?.audits_count ?? 0,
    anuncios_count: data?.anuncios_count ?? 0,
    pdf_count: data?.pdf_count ?? 0,
  };
}

async function countEventsSince(
  userId: string,
  action: UsageAction,
  sinceIso: string
): Promise<number> {
  const admin = getSupabaseAdmin();
  const { count, error } = await admin
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", sinceIso);

  if (error) {
    console.warn("[usage] count events:", error.message);
    return 0;
  }
  return count ?? 0;
}

async function lastEventAt(userId: string, action: UsageAction): Promise<Date | null> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("usage_events")
    .select("created_at")
    .eq("user_id", userId)
    .eq("action", action)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.created_at) return null;
  return new Date(data.created_at);
}

function tierFromState(state: PlanState): PlanTier {
  return state.kind === "paid" ? "paid" : "trial";
}

export function buildUsageSnapshot(
  state: PlanState,
  period: string,
  usageRow: { audits_count: number; anuncios_count: number; pdf_count: number }
): UsageSnapshot {
  const tier = tierFromState(state);
  const trialUsage =
    state.kind === "trial_active" || state.kind === "trial_expired"
      ? {
          audit: state.row.trial_audits_used,
          anuncios: state.row.trial_anuncios_used,
          pdf: state.row.trial_pdf_used ? 1 : 0,
        }
      : state.kind === "trial_not_started" && state.row
        ? {
            audit: state.row.trial_audits_used,
            anuncios: state.row.trial_anuncios_used,
            pdf: state.row.trial_pdf_used ? 1 : 0,
          }
        : undefined;

  return {
    tier,
    planKind: state.kind,
    period,
    limits: LIMITS_PAID,
    trialLimits: LIMITS_TRIAL,
    usage: {
      audit: usageRow.audits_count,
      anuncios: usageRow.anuncios_count,
      pdf: usageRow.pdf_count,
    },
    trialUsage,
    trialEndsAt:
      state.kind === "trial_active"
        ? state.endsAt.toISOString()
        : state.kind === "trial_expired"
          ? state.row.trial_ends_at
          : null,
    trialDaysLeft: state.kind === "trial_active" ? state.daysLeft : null,
    trialNotStartedReason:
      state.kind === "trial_not_started" ? state.reason : null,
    pdfWatermark: state.kind !== "paid",
    features: {
      safeApply: state.kind === "paid",
      comparisonPdf: state.kind === "paid",
      fullReport: state.kind === "paid",
      whiteLabelPdf: state.kind === "paid",
    },
  };
}

export async function getUsageSnapshot(
  userId: string,
  userEmail?: string | null
): Promise<UsageSnapshot> {
  const period = currentUsagePeriod();
  const state = await getPlanState(userId, userEmail);
  const usageRow = await fetchMonthlyUsage(userId, period);
  return buildUsageSnapshot(state, period, usageRow);
}

async function checkRateLimit(
  userId: string,
  action: UsageAction,
  limits: { minIntervalSec: number; maxPerHour: number }
): Promise<number> {
  const now = Date.now();

  if (limits.minIntervalSec > 0) {
    const last = await lastEventAt(userId, action);
    if (last) {
      const elapsed = (now - last.getTime()) / 1000;
      if (elapsed < limits.minIntervalSec) {
        return Math.ceil(limits.minIntervalSec - elapsed);
      }
    }
  }

  if (limits.maxPerHour > 0) {
    const since = new Date(now - 60 * 60 * 1000).toISOString();
    const count = await countEventsSince(userId, action, since);
    if (count >= limits.maxPerHour) {
      return 3600;
    }
  }

  return 0;
}

function denyTrialNotStarted(state: PlanState, snapshot: UsageSnapshot): never {
  const msg =
    state.kind === "trial_not_started" && state.reason === "confirm_email"
      ? "Confirmá tu email para iniciar la evaluación."
      : "Conectá tu cuenta de Google Ads para activar tus 14 días de evaluación.";
  throw new UsageLimitError("trial_not_started", 0, msg, snapshot);
}

function denyTrialExpired(snapshot: UsageSnapshot): never {
  throw new UsageLimitError(
    "trial_expired",
    0,
    "Tu evaluación terminó. Activá Watchdog para seguir auditando.",
    snapshot
  );
}

async function assertTrialQuota(
  userId: string,
  action: UsageAction,
  state: Extract<PlanState, { kind: "trial_active" }>,
  snapshot: UsageSnapshot
): Promise<void> {
  const limits = LIMITS_TRIAL[action];
  const used =
    action === "audit"
      ? state.row.trial_audits_used
      : action === "anuncios"
        ? state.row.trial_anuncios_used
        : state.row.trial_pdf_used
          ? 1
          : 0;

  if (used >= limits.total) {
    throw new UsageLimitError(
      "quota_exceeded",
      0,
      `Usaste el límite de evaluación (${limits.total}). Activá Watchdog para continuar.`,
      snapshot
    );
  }

  const retryAfter = await checkRateLimit(userId, action, limits);
  if (retryAfter > 0) {
    const msg =
      retryAfter >= 3600
        ? "Demasiados intentos en la última hora. Probá más tarde."
        : `Esperá ${retryAfter} segundos antes de volver a intentar.`;
    throw new UsageLimitError("rate_limit", retryAfter, msg, snapshot);
  }
}

async function assertPaidQuota(
  userId: string,
  action: UsageAction,
  snapshot: UsageSnapshot
): Promise<void> {
  const limits = LIMITS_PAID[action];
  const period = currentUsagePeriod();
  const usageRow = await fetchMonthlyUsage(userId, period);
  const used = countForAction(usageRow, action);

  if (used >= limits.monthly) {
    throw new UsageLimitError(
      "quota_exceeded",
      0,
      `Llegaste al límite mensual de ${limits.monthly} para esta función.`,
      snapshot
    );
  }

  const retryAfter = await checkRateLimit(userId, action, limits);
  if (retryAfter > 0) {
    const msg =
      retryAfter >= 3600
        ? "Demasiados intentos en la última hora. Probá de nuevo más tarde."
        : `Esperá ${retryAfter} segundos antes de volver a intentar.`;
    throw new UsageLimitError("rate_limit", retryAfter, msg, snapshot);
  }
}

/** Lanza UsageLimitError si no puede continuar. */
export async function assertUsageAllowed(
  userId: string,
  action: UsageAction,
  userEmail?: string | null
): Promise<UsageSnapshot> {
  const period = currentUsagePeriod();
  const state = await getPlanState(userId, userEmail);
  const usageRow = await fetchMonthlyUsage(userId, period);
  const snapshot = buildUsageSnapshot(state, period, usageRow);

  if (state.kind === "trial_not_started") {
    denyTrialNotStarted(state, snapshot);
  }
  if (state.kind === "trial_expired") {
    denyTrialExpired(snapshot);
  }
  if (state.kind === "trial_active") {
    await assertTrialQuota(userId, action, state, snapshot);
    return snapshot;
  }
  if (state.kind === "paid") {
    await assertPaidQuota(userId, action, snapshot);
    return snapshot;
  }

  return snapshot;
}

export async function assertProFeature(
  userId: string,
  userEmail?: string | null
): Promise<UsageSnapshot> {
  const snapshot = await getUsageSnapshot(userId, userEmail);
  if (snapshot.planKind !== "paid") {
    throw new ProFeatureError(
      `Esta función está disponible en Mora Watchdog (${PRO_PRICE_PER_MONTH}).`,
      snapshot
    );
  }
  return snapshot;
}

export type PdfUsageOptions = {
  auditId: string;
  isRedownload?: boolean;
};

/** PDF en trial: 1 total; re-descarga mismo audit sin consumir de nuevo. */
export async function assertPdfAllowed(
  userId: string,
  options: PdfUsageOptions,
  userEmail?: string | null
): Promise<UsageSnapshot> {
  const snapshot = await assertUsageAllowed(userId, "pdf", userEmail);
  const state = await getPlanState(userId, userEmail);

  if (state.kind !== "trial_active") {
    return snapshot;
  }

  const { auditId, isRedownload } = options;
  if (
    isRedownload &&
    state.row.trial_pdf_used &&
    state.row.trial_pdf_audit_id === auditId
  ) {
    return snapshot;
  }

  if (state.row.trial_pdf_used && state.row.trial_pdf_audit_id !== auditId) {
    throw new UsageLimitError(
      "quota_exceeded",
      0,
      "En evaluación solo podés exportar 1 PDF. Activá Watchdog para más.",
      snapshot
    );
  }

  return snapshot;
}

export async function recordUsageSuccess(
  userId: string,
  action: UsageAction,
  userEmail?: string | null,
  pdfAuditId?: string
): Promise<void> {
  const admin = getSupabaseAdmin();
  const state = await getPlanState(userId, userEmail);

  const { error: eventError } = await admin.from("usage_events").insert({
    user_id: userId,
    action,
  });
  if (eventError) {
    console.warn("[usage] insert event:", eventError.message);
  }

  if (state.kind === "paid") {
    const period = currentUsagePeriod();
    const { error: rpcError } = await admin.rpc("increment_user_usage", {
      p_user_id: userId,
      p_action: action,
      p_period: period,
    });
    if (rpcError) {
      console.warn("[usage] increment rpc:", rpcError.message);
    }
    return;
  }

  if (state.kind === "trial_active") {
    const patch: Record<string, unknown> = {};
    if (action === "audit") {
      patch.trial_audits_used = state.row.trial_audits_used + 1;
    } else if (action === "anuncios") {
      patch.trial_anuncios_used = state.row.trial_anuncios_used + 1;
    } else if (action === "pdf" && pdfAuditId) {
      if (!state.row.trial_pdf_used) {
        patch.trial_pdf_used = true;
        patch.trial_pdf_audit_id = pdfAuditId;
      }
    }
    if (Object.keys(patch).length > 0) {
      await admin.from("suscripciones").update(patch).eq("user_id", userId);
    }
  }
}

export function usageLimitResponse(err: UsageLimitError): Response {
  return new Response(
    JSON.stringify({
      error: err.reason,
      message: err.message,
      retry_after_seconds: err.retryAfterSeconds,
      usage: err.snapshot?.usage,
      limits: err.snapshot?.limits,
      trialLimits: err.snapshot?.trialLimits,
      trialUsage: err.snapshot?.trialUsage,
      tier: err.snapshot?.tier,
      planKind: err.snapshot?.planKind,
      trialEndsAt: err.snapshot?.trialEndsAt,
      trialDaysLeft: err.snapshot?.trialDaysLeft,
      features: err.snapshot?.features,
    }),
    {
      status: err.reason === "trial_not_started" || err.reason === "trial_expired" ? 403 : 429,
      headers: {
        "Content-Type": "application/json",
        ...(err.retryAfterSeconds > 0
          ? { "Retry-After": String(err.retryAfterSeconds) }
          : {}),
      },
    }
  );
}

export function proFeatureResponse(err: ProFeatureError): Response {
  return new Response(
    JSON.stringify({
      error: "pro_required",
      message: err.message,
      planKind: err.snapshot?.planKind,
      features: err.snapshot?.features,
    }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}
