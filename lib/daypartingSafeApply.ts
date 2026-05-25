import type { DaypartingAccionTipo, DaypartingFranja } from "./motorMora";

export type DaypartingApplyStatus =
  | "preview"
  | "aplicado"
  | "cancelado"
  | "bloqueado_sin_conexion";

export interface DaypartingApplyItem {
  franja_id: string;
  etiqueta: string;
  hora_inicio: number;
  hora_fin: number;
  accion: DaypartingAccionTipo;
  gasto_desperdiciado: number;
  campanas: string[];
}

export interface DaypartingApplyPlan {
  id: string;
  createdAt: string;
  items: DaypartingApplyItem[];
  totales: {
    franjas: number;
    ahorro_estimado: number;
    pausar: number;
    reducir_puja: number;
  };
  requiresConfirmation: true;
  riskLevel: "medio" | "alto";
  consentLabel: string;
}

export interface DaypartingApplyResult {
  status: DaypartingApplyStatus;
  message: string;
  appliedAt?: string;
  applied: DaypartingApplyItem[];
  rejected: { item: DaypartingApplyItem; reason: string }[];
  receiptId?: string;
}

const CONSENT_TEXT =
  "Mora sugiere ajustes de dayparting, pero la decisión final es tuya. " +
  "Confirmando, aceptás registrar estos cambios de puja/horario en tu cuenta de Google Ads.";

function generarId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function construirPlanDayparting(franjas: DaypartingFranja[]): DaypartingApplyPlan {
  const items: DaypartingApplyItem[] = franjas.map(f => ({
    franja_id: f.id,
    etiqueta: f.etiqueta,
    hora_inicio: f.hora_inicio,
    hora_fin: f.hora_fin,
    accion: f.accion_recomendada,
    gasto_desperdiciado: f.gasto_desperdiciado,
    campanas: f.campanas_top.map(c => c.campana_nombre),
  }));

  const ahorro = items.reduce((acc, i) => acc + i.gasto_desperdiciado, 0);

  return {
    id: generarId("dp"),
    createdAt: new Date().toISOString(),
    items,
    totales: {
      franjas: items.length,
      ahorro_estimado: parseFloat(ahorro.toFixed(2)),
      pausar: items.filter(i => i.accion === "pausar_trafico").length,
      reducir_puja: items.filter(i => i.accion === "reducir_puja").length,
    },
    requiresConfirmation: true,
    riskLevel: items.some(i => i.accion === "pausar_trafico") ? "alto" : "medio",
    consentLabel: CONSENT_TEXT,
  };
}

export function labelAccionDayparting(accion: DaypartingAccionTipo): string {
  return accion === "pausar_trafico" ? "Pausar tráfico" : "Reducir puja";
}
