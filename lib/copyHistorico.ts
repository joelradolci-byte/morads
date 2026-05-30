/**
 * Ajusta copy generado en presente (auditoría en vivo) para lectura de archivo histórico.
 * No reemplaza el prompt de IA: solo la capa de presentación al ver auditorías pasadas.
 */

export type OpcionesCopyHistorico = {
  modoHistorico?: boolean;
  /** Ej. "12/3/2025" — prefijo opcional en narrativas largas */
  fechaAuditoria?: string;
};

/** JS `\b` no detecta bien fin de palabra con tilde (está, podés…). */
const FIN_PALABRA = "(?=\\s|[.,;:!?¿¡]|$)";

/** Orden: frases compuestas primero, luego palabras sueltas. */
const REEMPLAZOS_PASADO: [RegExp, string][] = [
  [/\bTu cuenta no necesita\b/g, "Tu cuenta no necesitaba"],
  [/\btu cuenta no necesita\b/g, "tu cuenta no necesitaba"],
  [new RegExp(`\\bTu cuenta está${FIN_PALABRA}`, "g"), "Tu cuenta estaba"],
  [new RegExp(`\\btu cuenta está${FIN_PALABRA}`, "g"), "tu cuenta estaba"],
  [/\bTu cuenta tiene\b/g, "Tu cuenta tenía"],
  [/\btu cuenta tiene\b/g, "tu cuenta tenía"],
  [/\bTu cuenta necesita\b/g, "Tu cuenta necesitaba"],
  [/\btu cuenta necesita\b/g, "tu cuenta necesitaba"],
  [/\bno requiere cambios urgentes ahora\b/g, "no requería cambios urgentes en ese momento"],
  [/\bPodés seguir\b/g, "Podías seguir"],
  [/\bpodés seguir\b/g, "podías seguir"],
  [/\bMora estima que podrías estar perdiendo\b/g, "Mora estimó que podías estar perdiendo"],
  [/\bMora estima que podrías\b/g, "Mora estimó que podías"],
  [/\bconviene corregir\b/g, "convenía corregir"],
  [/\bConviene corregir\b/g, "Convenía corregir"],
  [/\bno hay fugas urgentes detectadas en esta auditoría\b/g, "no había fugas urgentes detectadas en esa auditoría"],
  [/\bRevisá los puntos\b/g, "Se habían marcado puntos"],
  [/\brevisá los puntos\b/g, "se habían marcado puntos"],
  [/\bHay fugas importantes\b/g, "Había fugas importantes"],
  [/\bhay fugas importantes\b/g, "había fugas importantes"],
  [/\bpodría estar mal usado\b/g, "podía estar mal usado"],
  [/\bPagás por\b/g, "Pagabas por"],
  [/\bpagás por\b/g, "pagabas por"],
  [/\bque no te traen\b/g, "que no te traían"],
  [/\bHay horarios donde gastás\b/g, "Había horarios donde gastabas"],
  [/\bHay horarios donde\b/g, "Había horarios donde"],
  [/\bHay plata mal puesta\b/g, "Había plata mal puesta"],
  [/\bPodés repartir\b/g, "Podías repartir"],
  [/\bpodés repartir\b/g, "podías repartir"],
  [/\bperdés plata\b/g, "perdías plata"],
  [/\bPerdés plata\b/g, "Perdías plata"],
  [/\bgastás y no vendés\b/g, "gastabas y no vendías"],
  [/\bgastás\b/g, "gastabas"],
  [/\bGastás\b/g, "Gastabas"],
  [/\bno vendés\b/g, "no vendías"],
  [/\bTenés\b/g, "Tenías"],
  [/\btenés\b/g, "tenías"],
  [/\bEstás\b/g, "Estabas"],
  [/\bestás\b/g, "estabas"],
  [/\bTenés un\b/g, "Tenías un"],
  [/\btenés un\b/g, "tenías un"],
  [/\bnecesitás\b/g, "necesitabas"],
  [/\bNecesitás\b/g, "Necesitabas"],
  [/\bdebés\b/g, "debías"],
  [/\bDebés\b/g, "Debías"],
];

const TITULOS_HUMANOS_HISTORICO: Record<string, string> = {
  GENERADOR_NEGATIVOS_URGENTE: "Pagabas por búsquedas que no te traían ventas",
  DAYPARTING_FUGAS_HORARIAS: "Había horarios donde gastabas y no vendías",
  SIMULADOR_PRESUPUESTO: "Podías repartir mejor tu inversión en publicidad",
  OPORTUNIDAD_ROBIN_HOOD: "Había plata mal puesta en campañas que no rendían",
};

export function adaptarTextoHistorico(texto: string): string {
  const trimmed = texto.trim();
  if (!trimmed) return texto;

  let out = trimmed;
  for (const [patron, reemplazo] of REEMPLAZOS_PASADO) {
    out = out.replace(patron, reemplazo);
  }
  return out;
}

export function prefijarNarrativaHistorica(
  texto: string,
  fechaAuditoria?: string
): string {
  const cuerpo = adaptarTextoHistorico(texto);
  if (!fechaAuditoria) return cuerpo;
  if (/^En la auditoría del/i.test(cuerpo)) return cuerpo;
  return `En la auditoría del ${fechaAuditoria}: ${cuerpo}`;
}

export function tituloHallazgoHistorico(
  idRastreo: string,
  tituloOriginal: string
): string {
  const fijo = TITULOS_HUMANOS_HISTORICO[idRastreo];
  if (fijo) return fijo;
  return adaptarTextoHistorico(tituloOriginal);
}

export function esAuditoriaHistorica(
  auditoriaActivaId: string | number | null | undefined,
  ultimaAuditoriaId: string | number | null | undefined
): boolean {
  if (auditoriaActivaId == null || ultimaAuditoriaId == null) return false;
  return String(auditoriaActivaId) !== String(ultimaAuditoriaId);
}
