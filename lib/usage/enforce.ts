import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  countForAction,
  currentUsagePeriod,
  LIMITS_PAID,
  LIMITS_TRIAL,
  type ActionLimits,
  type PlanLimits,
  type PlanTier,
  type UsageAction,
  type UsageSnapshot,
} from "./config";

export type { UsageSnapshot };

export type UsageDenyReason = "rate_limit" | "quota_exceeded" | "unauthorized";

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

async function resolvePlanTier(userId: string): Promise<PlanTier> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("suscripciones")
    .select("plan, estado, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return "trial";

  const plan = String(data.plan ?? "").toLowerCase();
  const estado = String(data.estado ?? data.status ?? "").toLowerCase();

  if (plan === "pro" || plan === "paid" || estado === "activa" || estado === "active") {
    return "paid";
  }

  return "trial";
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

async function countEventsSince(userId: string, action: UsageAction, sinceIso: string): Promise<number> {
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

function buildSnapshot(
  tier: PlanTier,
  period: string,
  usageRow: { audits_count: number; anuncios_count: number; pdf_count: number }
): UsageSnapshot {
  const limits = tier === "paid" ? LIMITS_PAID : LIMITS_TRIAL;
  return {
    tier,
    period,
    limits,
    usage: {
      audit: usageRow.audits_count,
      anuncios: usageRow.anuncios_count,
      pdf: usageRow.pdf_count,
    },
  };
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const period = currentUsagePeriod();
  const tier = await resolvePlanTier(userId);
  const usageRow = await fetchMonthlyUsage(userId, period);
  return buildSnapshot(tier, period, usageRow);
}

async function checkRateLimit(
  userId: string,
  action: UsageAction,
  limits: ActionLimits
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

/** Lanza UsageLimitError si no puede continuar. */
export async function assertUsageAllowed(userId: string, action: UsageAction): Promise<UsageSnapshot> {
  const period = currentUsagePeriod();
  const tier = await resolvePlanTier(userId);
  const limitsPlan = tier === "paid" ? LIMITS_PAID : LIMITS_TRIAL;
  const limits = limitsPlan[action];
  const usageRow = await fetchMonthlyUsage(userId, period);
  const snapshot = buildSnapshot(tier, period, usageRow);

  const used = countForAction(usageRow, action);
  if (used >= limits.monthly) {
    throw new UsageLimitError(
      "quota_exceeded",
      0,
      `Llegaste al límite mensual de ${limits.monthly} para esta función. Se renueva el próximo mes.`,
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

  return snapshot;
}

export async function recordUsageSuccess(userId: string, action: UsageAction): Promise<void> {
  const admin = getSupabaseAdmin();
  const period = currentUsagePeriod();

  const { error: eventError } = await admin.from("usage_events").insert({
    user_id: userId,
    action,
  });
  if (eventError) {
    console.warn("[usage] insert event:", eventError.message);
  }

  const { error: rpcError } = await admin.rpc("increment_user_usage", {
    p_user_id: userId,
    p_action: action,
    p_period: period,
  });
  if (rpcError) {
    console.warn("[usage] increment rpc:", rpcError.message);
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
      tier: err.snapshot?.tier,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...(err.retryAfterSeconds > 0
          ? { "Retry-After": String(err.retryAfterSeconds) }
          : {}),
      },
    }
  );
}
