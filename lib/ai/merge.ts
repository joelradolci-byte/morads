import type { HallazgoRedactor, HallazgosBuckets, PriorizacionItem } from "./types";

const MAX_CAMPO = 400;

export function pickTextoIA(nueva: unknown, previa: unknown, maxLen = MAX_CAMPO): string {
  const n = typeof nueva === "string" ? nueva.trim() : "";
  const p = typeof previa === "string" ? previa.trim() : "";
  if (!n) return p;
  if (n.length > maxLen) return p;
  return n;
}

export function asHallazgoArray(value: unknown): HallazgoRedactor[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is HallazgoRedactor =>
        !!item &&
        typeof item === "object" &&
        typeof (item as HallazgoRedactor).id_rastreo === "string"
    );
  }
  if (value && typeof value === "object" && typeof (value as HallazgoRedactor).id_rastreo === "string") {
    return [value as HallazgoRedactor];
  }
  return [];
}

export type HallazgoConCamposExtra = HallazgoRedactor & {
  sugerencia?: string;
  razonamiento?: string;
  resultado_esperado?: string;
};

export function mergeHallazgosRedactor<T extends HallazgoConCamposExtra>(
  originales: T[],
  desdeIA: unknown
): T[] {
  const lista = asHallazgoArray(desdeIA);
  const porId = new Map(lista.map(g => [g.id_rastreo, g]));
  return originales.map(orig => {
    const g = porId.get(orig.id_rastreo);
    if (!g) return orig;
    const tituloNuevo = typeof g.titulo === "string" ? g.titulo.trim() : "";
    return {
      ...orig,
      id_rastreo: orig.id_rastreo,
      titulo: tituloNuevo && tituloNuevo.length <= 120 ? tituloNuevo : orig.titulo,
      descripcion_tecnica: pickTextoIA(g.descripcion_tecnica, orig.descripcion_tecnica),
      descripcion_simple: pickTextoIA(g.descripcion_simple, orig.descripcion_simple),
      sugerencia: pickTextoIA(g.sugerencia, orig.sugerencia, 200),
      razonamiento: pickTextoIA(g.razonamiento, orig.razonamiento, 300),
      resultado_esperado: pickTextoIA(g.resultado_esperado, orig.resultado_esperado, 200),
    };
  });
}

export function mergeBucketsHallazgos<T extends HallazgoConCamposExtra>(
  originales: HallazgosBuckets,
  desdeIA: Partial<HallazgosBuckets> | undefined
): HallazgosBuckets {
  return {
    graves_rojo: mergeHallazgosRedactor(originales.graves_rojo, desdeIA?.graves_rojo),
    debiles_amarillo: mergeHallazgosRedactor(originales.debiles_amarillo, desdeIA?.debiles_amarillo),
    bien_verde: mergeHallazgosRedactor(originales.bien_verde, desdeIA?.bien_verde),
  };
}

/** Reordena un bucket según priorización consultiva (solo ids presentes). */
export function reordenarBucket<T extends { id_rastreo: string }>(
  items: T[],
  priorizacion: PriorizacionItem[]
): T[] {
  if (!priorizacion.length || !items.length) return items;
  const ordenPorId = new Map(
    priorizacion
      .filter(p => typeof p.orden === "number")
      .map(p => [p.id_rastreo, p.orden])
  );
  if (ordenPorId.size === 0) return items;
  return [...items].sort((a, b) => {
    const oa = ordenPorId.get(a.id_rastreo) ?? 999;
    const ob = ordenPorId.get(b.id_rastreo) ?? 999;
    return oa - ob;
  });
}
