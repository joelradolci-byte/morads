import type { DestripadorTermino } from "./motorMora";

/** Clave única por término + campaña (evita colisiones entre campañas). */
export function terminoKey(t: Pick<DestripadorTermino, "campana_id" | "termino">): string {
  return `${t.campana_id}::${t.termino}`;
}

export interface DestripadorEstadoPersistido {
  mitigados: Record<string, { at: string; planId?: string }>;
  copiados: Record<string, { at: string }>;
}

const STORAGE_PREFIX = "mora_destripador_estado_";

function storageKey(auditId: string | number): string {
  return `${STORAGE_PREFIX}${auditId}`;
}

export function loadDestripadorEstado(auditId: string | number | null | undefined): DestripadorEstadoPersistido {
  if (auditId == null || typeof window === "undefined") {
    return { mitigados: {}, copiados: {} };
  }
  try {
    const raw = localStorage.getItem(storageKey(auditId));
    if (!raw) return { mitigados: {}, copiados: {} };
    const parsed = JSON.parse(raw) as DestripadorEstadoPersistido;
    return {
      mitigados: parsed.mitigados ?? {},
      copiados: parsed.copiados ?? {},
    };
  } catch {
    return { mitigados: {}, copiados: {} };
  }
}

export function saveDestripadorEstado(
  auditId: string | number,
  estado: DestripadorEstadoPersistido
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(auditId), JSON.stringify(estado));
  } catch {
    // Cuota llena u otro error: no bloqueamos la UI.
  }
}

export function marcarTerminosMitigados(
  auditId: string | number,
  keys: string[],
  planId?: string
): DestripadorEstadoPersistido {
  const prev = loadDestripadorEstado(auditId);
  const at = new Date().toISOString();
  const mitigados = { ...prev.mitigados };
  keys.forEach(k => {
    mitigados[k] = { at, planId };
  });
  const next = { mitigados, copiados: prev.copiados };
  saveDestripadorEstado(auditId, next);
  return next;
}

export function marcarTerminosCopiados(
  auditId: string | number,
  keys: string[]
): DestripadorEstadoPersistido {
  const prev = loadDestripadorEstado(auditId);
  const at = new Date().toISOString();
  const copiados = { ...prev.copiados };
  keys.forEach(k => {
    copiados[k] = { at };
  });
  const next = { mitigados: prev.mitigados, copiados };
  saveDestripadorEstado(auditId, next);
  return next;
}
