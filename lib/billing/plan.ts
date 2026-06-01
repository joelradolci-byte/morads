import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  LIMITS_PAID,
  LIMITS_TRIAL,
  TRIAL_DAYS,
  type PlanKind,
} from "@/lib/usage/config";

export type SuscripcionRow = {
  user_id: string;
  email: string;
  plan: string;
  estado: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_audits_used: number;
  trial_anuncios_used: number;
  trial_pdf_used: boolean;
  trial_pdf_audit_id: string | null;
  trial_consumed: boolean;
  lemon_customer_id: string | null;
  lemon_subscription_id: string | null;
  lemon_status: string | null;
};

export type PlanState =
  | { kind: "paid"; row: SuscripcionRow }
  | {
      kind: "trial_active";
      row: SuscripcionRow;
      endsAt: Date;
      daysLeft: number;
      auditsLeft: number;
      anunciosLeft: number;
      pdfLeft: number;
    }
  | { kind: "trial_expired"; row: SuscripcionRow }
  | {
      kind: "trial_not_started";
      row: SuscripcionRow | null;
      reason: "connect_ads" | "confirm_email";
    };

function isPaidRow(row: SuscripcionRow): boolean {
  const plan = String(row.plan ?? "").toLowerCase();
  const estado = String(row.estado ?? "").toLowerCase();
  return (
    plan === "pro" ||
    plan === "paid" ||
    estado === "activa" ||
    estado === "active"
  );
}

function trialWindowExpired(endsAt: string | null): boolean {
  if (!endsAt) return false;
  return new Date(endsAt).getTime() <= Date.now();
}

export async function getAuthEmailConfirmed(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) return false;
  return Boolean(data.user.email_confirmed_at);
}

export async function fetchSuscripcion(userId: string): Promise<SuscripcionRow | null> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("suscripciones")
    .select(
      "user_id, email, plan, estado, trial_started_at, trial_ends_at, trial_audits_used, trial_anuncios_used, trial_pdf_used, trial_pdf_audit_id, trial_consumed, lemon_customer_id, lemon_subscription_id, lemon_status"
    )
    .eq("user_id", userId)
    .maybeSingle();
  return data as SuscripcionRow | null;
}

export async function emailTrialAlreadyConsumed(
  email: string,
  excludeUserId?: string
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();
  let q = admin
    .from("suscripciones")
    .select("user_id, trial_consumed, trial_started_at")
    .ilike("email", normalized);

  const { data } = await q;
  if (!data?.length) return false;

  return data.some(row => {
    if (excludeUserId && row.user_id === excludeUserId) return false;
    return row.trial_consumed || Boolean(row.trial_started_at);
  });
}

export async function ensureSuscripcionRow(
  userId: string,
  email: string
): Promise<SuscripcionRow> {
  const existing = await fetchSuscripcion(userId);
  if (existing) return existing;

  const admin = getSupabaseAdmin();
  const row = {
    user_id: userId,
    email: email.trim().toLowerCase(),
    plan: "free",
    estado: "trial_not_started",
  };
  const { data, error } = await admin.from("suscripciones").insert(row).select().single();
  if (error) {
    const again = await fetchSuscripcion(userId);
    if (again) return again;
    throw new Error(`suscripciones insert: ${error.message}`);
  }
  return data as SuscripcionRow;
}

export async function expireTrialIfNeeded(row: SuscripcionRow): Promise<SuscripcionRow> {
  if (isPaidRow(row)) return row;
  if (!row.trial_started_at || !row.trial_ends_at) return row;
  if (!trialWindowExpired(row.trial_ends_at)) return row;
  if (row.estado === "trial_expired") return row;

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("suscripciones")
    .update({ estado: "trial_expired", trial_consumed: true })
    .eq("user_id", row.user_id)
    .select()
    .single();

  await admin.rpc("mark_trial_email_consumed", { p_email: row.email });

  return (data as SuscripcionRow) ?? { ...row, estado: "trial_expired", trial_consumed: true };
}

export async function getPlanState(userId: string, userEmail?: string | null): Promise<PlanState> {
  let row = await fetchSuscripcion(userId);
  if (!row && userEmail) {
    row = await ensureSuscripcionRow(userId, userEmail);
  }
  if (!row) {
    return {
      kind: "trial_not_started",
      row: null,
      reason: "connect_ads",
    };
  }

  row = await expireTrialIfNeeded(row);

  if (isPaidRow(row)) {
    return { kind: "paid", row };
  }

  const emailOk = await getAuthEmailConfirmed(userId);
  if (!emailOk) {
    return { kind: "trial_not_started", row, reason: "confirm_email" };
  }

  if (!row.trial_started_at) {
    return { kind: "trial_not_started", row, reason: "connect_ads" };
  }

  if (row.estado === "trial_expired" || trialWindowExpired(row.trial_ends_at)) {
    return { kind: "trial_expired", row };
  }

  const endsAt = new Date(row.trial_ends_at!);
  const msLeft = endsAt.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

  return {
    kind: "trial_active",
    row,
    endsAt,
    daysLeft,
    auditsLeft: Math.max(0, LIMITS_TRIAL.audit.total - row.trial_audits_used),
    anunciosLeft: Math.max(0, LIMITS_TRIAL.anuncios.total - row.trial_anuncios_used),
    pdfLeft: row.trial_pdf_used ? 0 : 1,
  };
}

export function planKindFromState(state: PlanState): PlanKind {
  return state.kind;
}

export async function startTrialIfEligible(
  userId: string,
  email: string
): Promise<{ started: boolean; error?: string }> {
  const confirmed = await getAuthEmailConfirmed(userId);
  if (!confirmed) {
    return { started: false, error: "confirm_email" };
  }

  if (await emailTrialAlreadyConsumed(email, userId)) {
    return { started: false, error: "trial_already_used" };
  }

  const row = await ensureSuscripcionRow(userId, email);
  if (row.trial_started_at) {
    return { started: false };
  }

  if (isPaidRow(row)) {
    return { started: false };
  }

  const now = new Date();
  const ends = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("suscripciones")
    .update({
      trial_started_at: now.toISOString(),
      trial_ends_at: ends.toISOString(),
      estado: "trial_active",
    })
    .eq("user_id", userId)
    .is("trial_started_at", null);

  if (error) {
    console.error("[billing] startTrial:", error.message);
    return { started: false, error: error.message };
  }

  return { started: true };
}

export async function activateProFromLemon(
  userId: string,
  payload: {
    lemon_customer_id?: string;
    lemon_subscription_id?: string;
    lemon_variant_id?: string;
    lemon_status?: string;
  }
): Promise<void> {
  const admin = getSupabaseAdmin();
  const row = await fetchSuscripcion(userId);
  await admin
    .from("suscripciones")
    .update({
      plan: "pro",
      estado: "activa",
      trial_consumed: true,
      lemon_customer_id: payload.lemon_customer_id ?? null,
      lemon_subscription_id: payload.lemon_subscription_id ?? null,
      lemon_variant_id: payload.lemon_variant_id ?? null,
      lemon_status: payload.lemon_status ?? "active",
    })
    .eq("user_id", userId);
  if (row?.email) {
    await admin.rpc("mark_trial_email_consumed", { p_email: row.email });
  }
}

export async function deactivatePro(
  userId: string,
  estado: "cancelada" | "past_due" = "cancelada"
): Promise<void> {
  const admin = getSupabaseAdmin();
  const row = await fetchSuscripcion(userId);
  await admin
    .from("suscripciones")
    .update({
      plan: "free",
      estado,
      lemon_status: estado === "past_due" ? "past_due" : "cancelled",
    })
    .eq("user_id", userId);

  if (row?.email) {
    await admin.rpc("mark_trial_email_consumed", { p_email: row.email });
  }
}

export function isProFeatureAllowed(state: PlanState): boolean {
  return state.kind === "paid";
}
