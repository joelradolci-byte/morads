export type HallazgoApplyRisk = "bajo" | "medio" | "alto";

export type HallazgoApplyStatus =
  | "preview"
  | "aplicado"
  | "cancelado"
  | "bloqueado_sin_conexion";

export type HallazgoApplyPayload = {
  accion?: string;
  id_rastreo: string;
  sugerencia: string;
  tipo?: "critico" | "mejora";
};

export interface HallazgoApplyPlan {
  id: string;
  createdAt: string;
  hallazgo_id: string;
  title: string;
  riskLevel: HallazgoApplyRisk;
  steps: string[];
  reason: string;
  expectedImpact: string;
  requiresConfirmation: true;
  consentLabel: string;
  payload?: HallazgoApplyPayload;
}

export interface HallazgoApplyResult {
  status: HallazgoApplyStatus;
  message: string;
  appliedAt?: string;
  receiptId?: string;
}

const CONSENT_TEXT =
  "Mora prepara el cambio, pero la decisión final la tomás vos. " +
  "Confirmando, aceptás registrar este cambio para aplicarlo en tu cuenta de Google Ads.";

function generarId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function construirPlanHallazgo(params: {
  hallazgo_id: string;
  title: string;
  riskLevel?: HallazgoApplyRisk;
  steps: string[];
  reason: string;
  expectedImpact: string;
  payload?: HallazgoApplyPayload;
}): HallazgoApplyPlan {
  return {
    id: generarId("hz"),
    createdAt: new Date().toISOString(),
    hallazgo_id: params.hallazgo_id,
    title: params.title,
    riskLevel: params.riskLevel ?? "medio",
    steps: params.steps,
    reason: params.reason,
    expectedImpact: params.expectedImpact,
    requiresConfirmation: true,
    consentLabel: CONSENT_TEXT,
    payload: params.payload,
  };
}

export function validateHallazgoPlan(
  plan: HallazgoApplyPlan
): { ok: true } | { ok: false; message: string } {
  if (!plan || typeof plan !== "object") {
    return { ok: false, message: "Plan inválido o faltante." };
  }
  if (!plan.hallazgo_id || typeof plan.hallazgo_id !== "string") {
    return { ok: false, message: "Falta hallazgo_id en el plan." };
  }
  if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
    return { ok: false, message: "El plan no incluye pasos para aplicar." };
  }
  const pasosInvalidos = plan.steps.filter(s => typeof s !== "string" || !s.trim());
  if (pasosInvalidos.length > 0) {
    return { ok: false, message: "El plan contiene pasos vacíos o inválidos." };
  }
  return { ok: true };
}

