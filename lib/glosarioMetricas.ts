/** Definiciones fijas en lenguaje claro (no IA). */

export interface EntradaGlosario {
  termino: string;
  definicion: string;
}

export const GLOSARIO_METRICAS: Record<string, EntradaGlosario> = {
  CPA: {
    termino: "CPA",
    definicion: "Cuánto te cuesta, en promedio, lograr una venta o un contacto con la publicidad.",
  },
  ROAS: {
    termino: "ROAS",
    definicion: "Cuántos pesos te devuelve la publicidad por cada peso que invertís.",
  },
  CTR: {
    termino: "CTR",
    definicion: "Porcentaje de personas que hacen clic en tu anuncio después de verlo.",
  },
  CPC: {
    termino: "CPC",
    definicion: "Cuánto pagás cada vez que alguien hace clic en tu anuncio.",
  },
  QS: {
    termino: "Quality Score",
    definicion: "Nota de Google sobre la calidad de tu anuncio y tu página. Si es baja, pagás más por clic.",
  },
  CVR: {
    termino: "CVR",
    definicion: "Porcentaje de clics que terminan en una venta o contacto.",
  },
};

export function buscarGlosario(termino: string): EntradaGlosario | null {
  const key = termino.trim().toUpperCase();
  if (GLOSARIO_METRICAS[key]) return GLOSARIO_METRICAS[key];
  if (key.includes("QUALITY")) return GLOSARIO_METRICAS.QS;
  return null;
}
