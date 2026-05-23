// Aplicación segura de negativos del Destripador de Búsquedas.
// Sigue el patrón Copilot: preview → confirmación → escritura registrada.

import type {
  CategoriaIntencionId,
  DestripadorTermino,
} from "./motorMora";

export type NegativoMatchType = "FRASE" | "EXACTA";

export type NegativoScope = "campana" | "cuenta";

export type NegativosApplyStatus =
  | "preview"
  | "aplicado"
  | "cancelado"
  | "bloqueado_sin_conexion";

export interface NegativoItem {
  termino: string;
  match_type: NegativoMatchType;
  scope: NegativoScope;
  campana_id?: string;
  campana_nombre?: string;
  categoria: CategoriaIntencionId;
  motivo: string;
  gasto_estimado_recuperado: number;
}

export interface NegativosApplyPlan {
  id: string;
  createdAt: string;
  items: NegativoItem[];
  totales: {
    cantidad: number;
    ahorro_estimado: number;
    fraseras: number;
    exactas: number;
  };
  guardrails: {
    marcas_aplicadas: string[];
    terminos_protegidos: number;
  };
  requiresConfirmation: true;
  riskLevel: "alto";
  consentLabel: string;
}

export interface NegativosApplyResult {
  status: NegativosApplyStatus;
  message: string;
  appliedAt?: string;
  applied: NegativoItem[];
  rejected: { item: NegativoItem; reason: string }[];
  receiptId?: string;
}

export interface NegativosAuditEntry {
  id: string;
  planId: string;
  status: NegativosApplyStatus;
  timestamp: string;
  items: NegativoItem[];
  message: string;
}

const CONSENT_TEXT =
  "Mora identifica y prepara la aplicación, pero la decisión final la tomás vos. " +
  "Confirmando, vos aceptás aplicar estos negativos en tu cuenta de Google Ads.";

function generarId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function construirPlanNegativos(
  seleccion: DestripadorTermino[],
  opciones: {
    matchType: NegativoMatchType;
    scope: NegativoScope;
    marcasAplicadas: string[];
    terminosProtegidos: number;
  }
): NegativosApplyPlan {
  const items: NegativoItem[] = seleccion
    .filter(t => !t.protegido)
    .map(t => ({
      termino: t.termino,
      match_type: opciones.matchType,
      scope: opciones.scope,
      campana_id: opciones.scope === "campana" ? t.campana_id : undefined,
      campana_nombre: opciones.scope === "campana" ? t.campana_nombre : undefined,
      categoria: t.categoria_intencion,
      motivo: t.motivo,
      gasto_estimado_recuperado: t.gasto,
    }));

  const fraseras = items.filter(i => i.match_type === "FRASE").length;
  const exactas = items.length - fraseras;
  const ahorro = items.reduce((acc, i) => acc + i.gasto_estimado_recuperado, 0);

  return {
    id: generarId("neg"),
    createdAt: new Date().toISOString(),
    items,
    totales: {
      cantidad: items.length,
      ahorro_estimado: parseFloat(ahorro.toFixed(2)),
      fraseras,
      exactas,
    },
    guardrails: {
      marcas_aplicadas: opciones.marcasAplicadas,
      terminos_protegidos: opciones.terminosProtegidos,
    },
    requiresConfirmation: true,
    riskLevel: "alto",
    consentLabel: CONSENT_TEXT,
  };
}

export function formatearNegativosParaGoogleAds(plan: NegativosApplyPlan): string {
  return plan.items
    .map(item => {
      if (item.match_type === "EXACTA") return `[${item.termino}]`;
      return `"${item.termino}"`;
    })
    .join("\n");
}

export function buildAuditEntry(
  plan: NegativosApplyPlan,
  result: Omit<NegativosApplyResult, "applied" | "rejected"> & { applied: NegativoItem[] }
): NegativosAuditEntry {
  return {
    id: generarId("audit"),
    planId: plan.id,
    status: result.status,
    timestamp: result.appliedAt || new Date().toISOString(),
    items: result.applied,
    message: result.message,
  };
}

// Ejecución local segura: por ahora la integración con Google Ads vive del lado del backend.
// Esta función se usa como espejo del estado para mostrar feedback inmediato en la UI.
export function simularResultadoLocal(plan: NegativosApplyPlan): NegativosApplyResult {
  return {
    status: "aplicado",
    message:
      "Mora registró tu confirmación y dejó los negativos listos para aplicar en Google Ads.",
    appliedAt: new Date().toISOString(),
    applied: plan.items,
    rejected: [],
    receiptId: plan.id,
  };
}
