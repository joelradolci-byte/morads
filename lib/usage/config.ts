export type UsageAction = "audit" | "anuncios" | "pdf";

export type PlanTier = "trial" | "paid";

/** Cupos en ventana de evaluación (totales, no mensuales) */
export type TrialActionLimits = {
  total: number;
  minIntervalSec: number;
  maxPerHour: number;
};

export type TrialLimits = Record<UsageAction, TrialActionLimits>;

/** Cupos mensuales Mora Watchdog ($26.99/mes) */
export type PaidActionLimits = {
  monthly: number;
  minIntervalSec: number;
  maxPerHour: number;
};

export type PaidLimits = Record<UsageAction, PaidActionLimits>;

/** @deprecated Usar trialLimits / paidLimits en snapshot extendido */
export type ActionLimits = PaidActionLimits;

/** @deprecated Usar PaidLimits */
export type PlanLimits = PaidLimits;

export const TRIAL_DAYS = 14;

export const PRO_PRICE_USD = 26.99;

export const PRO_PRICE_LABEL = `$${PRO_PRICE_USD.toFixed(2)}`;

export const PRO_PRICE_PER_MONTH = `${PRO_PRICE_LABEL}/mes`;

/** Evaluación: 14 días desde 1er customer_id en Google Ads */
export const LIMITS_TRIAL: TrialLimits = {
  audit: { total: 2, minIntervalSec: 86400, maxPerHour: 2 },
  anuncios: { total: 1, minIntervalSec: 60, maxPerHour: 3 },
  pdf: { total: 1, minIntervalSec: 0, maxPerHour: 5 },
};

/** Mora Watchdog — Lemon Squeezy $26.99/mes */
export const LIMITS_PAID: PaidLimits = {
  audit: { monthly: 30, minIntervalSec: 120, maxPerHour: 5 },
  anuncios: { monthly: 20, minIntervalSec: 60, maxPerHour: 15 },
  pdf: { monthly: 60, minIntervalSec: 30, maxPerHour: 20 },
};

export type PlanKind =
  | "paid"
  | "trial_active"
  | "trial_expired"
  | "trial_not_started";

export type UsageSnapshot = {
  tier: PlanTier;
  planKind: PlanKind;
  period: string;
  limits: PaidLimits;
  trialLimits: TrialLimits;
  usage: {
    audit: number;
    anuncios: number;
    pdf: number;
  };
  trialUsage?: {
    audit: number;
    anuncios: number;
    pdf: number;
  };
  trialEndsAt?: string | null;
  trialDaysLeft?: number | null;
  trialNotStartedReason?: "connect_ads" | "confirm_email" | null;
  pdfWatermark: boolean;
  features: {
    safeApply: boolean;
    comparisonPdf: boolean;
    fullReport: boolean;
    whiteLabelPdf: boolean;
  };
};

export function currentUsagePeriod(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function countForAction(
  usage: { audits_count: number; anuncios_count: number; pdf_count: number },
  action: UsageAction
): number {
  switch (action) {
    case "audit":
      return usage.audits_count;
    case "anuncios":
      return usage.anuncios_count;
    case "pdf":
      return usage.pdf_count;
  }
}
