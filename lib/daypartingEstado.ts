export interface DaypartingEstadoPersistido {
  aplicados: Record<string, { at: string; planId?: string }>;
}

const STORAGE_PREFIX = "mora_dayparting_estado_";

function storageKey(auditId: string | number): string {
  return `${STORAGE_PREFIX}${auditId}`;
}

export function loadDaypartingEstado(
  auditId: string | number | null | undefined
): DaypartingEstadoPersistido {
  if (auditId == null || typeof window === "undefined") {
    return { aplicados: {} };
  }
  try {
    const raw = localStorage.getItem(storageKey(auditId));
    if (!raw) return { aplicados: {} };
    const parsed = JSON.parse(raw) as DaypartingEstadoPersistido;
    return { aplicados: parsed.aplicados ?? {} };
  } catch {
    return { aplicados: {} };
  }
}

export function saveDaypartingEstado(
  auditId: string | number,
  estado: DaypartingEstadoPersistido
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(auditId), JSON.stringify(estado));
  } catch {
    // ignore
  }
}

export function marcarFranjasAplicadas(
  auditId: string | number,
  franjaIds: string[],
  planId?: string
): DaypartingEstadoPersistido {
  const prev = loadDaypartingEstado(auditId);
  const at = new Date().toISOString();
  const aplicados = { ...prev.aplicados };
  franjaIds.forEach(id => {
    aplicados[id] = { at, planId };
  });
  const next = { aplicados };
  saveDaypartingEstado(auditId, next);
  return next;
}
