export type UsageAction = "audit" | "anuncios" | "pdf";

export type PlanTier = "trial" | "paid";

export type ActionLimits = {
  monthly: number;
  minIntervalSec: number;
  maxPerHour: number;
};

export type PlanLimits = Record<UsageAction, ActionLimits>;

export type UsageSnapshot = {
  tier: PlanTier;
  period: string;
  limits: PlanLimits;
  usage: {
    audit: number;
    anuncios: number;
    pdf: number;
  };
};

/** Trial / sin suscripción activa */
export const LIMITS_TRIAL: PlanLimits = {
  audit: { monthly: 5, minIntervalSec: 120, maxPerHour: 3 },
  anuncios: { monthly: 5, minIntervalSec: 60, maxPerHour: 10 },
  pdf: { monthly: 10, minIntervalSec: 30, maxPerHour: 10 },
};

/** Plan pago ($29/mes) — plan pro o estado activa en `suscripciones` */
export const LIMITS_PAID: PlanLimits = {
  audit: { monthly: 30, minIntervalSec: 120, maxPerHour: 5 },
  anuncios: { monthly: 20, minIntervalSec: 60, maxPerHour: 15 },
  pdf: { monthly: 60, minIntervalSec: 30, maxPerHour: 20 },
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
