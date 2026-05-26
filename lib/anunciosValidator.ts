/** Validación local post-IA para copies de Google Ads (RSA). */

export const MAX_HEADLINE = 30;
export const MAX_DESCRIPTION = 90;

const CLAIMS_PELIGROSOS = [
  /\bgarantizad[oa]s?\b/i,
  /\b100\s*%\b/i,
  /\bel\s+mejor\b/i,
  /\bla\s+mejor\b/i,
  /\bsin\s+riesgo\b/i,
  /\bgratis\s+para\s+siempre\b/i,
];

export interface LineaCopy {
  texto: string;
  chars: number;
  valid: boolean;
  motivo?: string;
}

export interface AnuncioGeneradoValidado {
  enfoque: string;
  objetivo: "escalar" | "filtrar" | "recuperar_relevancia" | "test_ab";
  headlines: LineaCopy[];
  descriptions: LineaCopy[];
  keywords_usadas: string[];
  terminos_evitar: string[];
  advertencias: string[];
  score_calidad: number;
  razonamiento: string;
}

function validarLinea(texto: string, max: number): LineaCopy {
  const t = (texto || "").trim();
  const chars = t.length;
  if (!t) return { texto: t, chars: 0, valid: false, motivo: "Vacío" };
  if (chars > max) {
    return { texto: t, chars, valid: false, motivo: `Excede ${max} caracteres` };
  }
  for (const re of CLAIMS_PELIGROSOS) {
    if (re.test(t)) {
      return { texto: t, chars, valid: false, motivo: "Claim potencialmente riesgoso" };
    }
  }
  return { texto: t, chars, valid: true };
}

export function validarAnuncioGenerado(
  raw: {
    enfoque?: string;
    objetivo?: string;
    headlines?: string[];
    descriptions?: string[];
    keywords_usadas?: string[];
    terminos_evitar?: string[];
    advertencias?: string[];
    razonamiento?: string;
  },
  keywordsRequeridas: string[] = [],
  terminosEvitar: string[] = []
): AnuncioGeneradoValidado {
  const headlines = (raw.headlines || []).map(h => validarLinea(h, MAX_HEADLINE));
  const descriptions = (raw.descriptions || []).map(d =>
    validarLinea(d, MAX_DESCRIPTION)
  );

  const advertencias = [...(raw.advertencias || [])];
  const kwLower = keywordsRequeridas.map(k => k.toLowerCase());
  const evitarLower = [...terminosEvitar, ...(raw.terminos_evitar || [])].map(t =>
    t.toLowerCase()
  );

  const textoCompleto = [...headlines, ...descriptions]
    .map(l => l.texto.toLowerCase())
    .join(" ");

  if (kwLower.length > 0 && !kwLower.some(k => textoCompleto.includes(k))) {
    advertencias.push("Ninguna keyword prioritaria aparece en el copy.");
  }

  evitarLower.forEach(term => {
    if (term.length >= 3 && textoCompleto.includes(term)) {
      advertencias.push(`Incluye término a evitar: "${term}"`);
    }
  });

  const validHeadlines = headlines.filter(h => h.valid).length;
  const validDesc = descriptions.filter(d => d.valid).length;
  const totalLines = headlines.length + descriptions.length;
  const validLines = validHeadlines + validDesc;

  let score = totalLines > 0 ? Math.round((validLines / totalLines) * 70) : 0;
  if (validHeadlines >= 3) score += 10;
  if (validDesc >= 2) score += 10;
  if (advertencias.length === 0) score += 10;
  score = Math.min(100, Math.max(0, score));

  const objetivoRaw = raw.objetivo || "escalar";
  const objetivo =
    objetivoRaw === "filtrar" ||
    objetivoRaw === "recuperar_relevancia" ||
    objetivoRaw === "test_ab"
      ? objetivoRaw
      : "escalar";

  return {
    enfoque: raw.enfoque || "Variante generada desde diagnóstico Mora",
    objetivo,
    headlines,
    descriptions,
    keywords_usadas: raw.keywords_usadas || keywordsRequeridas.slice(0, 8),
    terminos_evitar: [...new Set([...terminosEvitar, ...(raw.terminos_evitar || [])])],
    advertencias,
    score_calidad: score,
    razonamiento:
      raw.razonamiento ||
      "Copy alineado al hallazgo detectado en la auditoría.",
  };
}

export function formatearAnuncioParaCopiar(ad: AnuncioGeneradoValidado): string {
  const h = ad.headlines.filter(x => x.texto).map(x => `• ${x.texto}`).join("\n");
  const d = ad.descriptions.filter(x => x.texto).map(x => `• ${x.texto}`).join("\n");
  return `ENFOQUE: ${ad.enfoque}\n\nTÍTULOS:\n${h}\n\nDESCRIPCIONES:\n${d}`;
}
