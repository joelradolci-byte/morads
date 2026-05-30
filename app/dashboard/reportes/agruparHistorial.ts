export const HISTORIAL_PAGE_SIZE = 20;

export type HistorialItemBase = {
  id: number | string;
  nombre_cuenta?: string | null;
  created_at?: string;
  score: number;
};

export function nombreCuentaHistorial(nombre?: string | null): string {
  return nombre?.trim() || "Cuenta sin nombre";
}

export function agruparHistorialPorCuenta<T extends HistorialItemBase>(
  items: T[]
): { cuenta: string; items: T[] }[] {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const cuenta = nombreCuentaHistorial(item.nombre_cuenta);
    const list = map.get(cuenta) ?? [];
    list.push(item);
    map.set(cuenta, list);
  }

  return Array.from(map.entries())
    .map(([cuenta, grupoItems]) => ({ cuenta, items: grupoItems }))
    .sort((a, b) => {
      const tA = new Date(a.items[0]?.created_at ?? 0).getTime();
      const tB = new Date(b.items[0]?.created_at ?? 0).getTime();
      return tB - tA;
    });
}
