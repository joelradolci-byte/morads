/** Mapeo hallazgos → acciones y copy en lenguaje claro. */

export type AccionResumenPanel =
  | "destripador"
  | "dayparting"
  | "simulador"
  | "robin_hood"
  | "detalle_hallazgo";

export function resolverAccionHallazgo(idRastreo: string): AccionResumenPanel {
  switch (idRastreo) {
    case "GENERADOR_NEGATIVOS_URGENTE":
      return "destripador";
    case "DAYPARTING_FUGAS_HORARIAS":
      return "dayparting";
    case "SIMULADOR_PRESUPUESTO":
      return "simulador";
    case "OPORTUNIDAD_ROBIN_HOOD":
      return "robin_hood";
    default:
      return "detalle_hallazgo";
  }
}

const TITULOS_HUMANOS: Record<string, string> = {
  GENERADOR_NEGATIVOS_URGENTE: "Pagás por búsquedas que no te traen ventas",
  DAYPARTING_FUGAS_HORARIAS: "Hay horarios donde gastás y no vendés",
  SIMULADOR_PRESUPUESTO: "Podés repartir mejor tu inversión en publicidad",
  OPORTUNIDAD_ROBIN_HOOD: "Hay plata mal puesta en campañas que no rinden",
};

export function tituloHumanoHallazgo(idRastreo: string, tituloOriginal: string): string {
  return TITULOS_HUMANOS[idRastreo] ?? tituloOriginal;
}

export const INTRO_PANEL_DESDE_RESUMEN: Record<AccionResumenPanel, string> = {
  destripador:
    "Estas son las palabras de búsqueda que te gastan plata sin traer ventas. Marcá las que quieras bloquear y tocá Aplicar o Copiar.",
  dayparting:
    "El mapa muestra en qué días y horas perdés plata. Elegí las franjas rojas y reprogramá o aplicá los cambios sugeridos.",
  simulador:
    "Acá ves qué pasaría si movés presupuesto desde campañas flojas hacia las que sí venden. Es una simulación, no cambia tu cuenta sola.",
  robin_hood:
    "Mora detectó campañas que gastan de más y otras con margen para crecer. Revisá el plan y confirmá si querés aplicarlo.",
  detalle_hallazgo:
    "Revisá el detalle de esta oportunidad y seguí la acción recomendada en Google Ads.",
};

export function fraseSaludCuenta(
  score: number,
  gastoDesperdiciado: number,
  porcentajeDesperdiciado: number
): string {
  if (score >= 75) {
    return "Tu cuenta está en buen estado. Igual hay margen para recuperar plata si corregís los puntos que Mora marcó.";
  }
  if (score >= 50) {
    return `Tu cuenta tiene cosas para mejorar. Mora estima que podrías estar perdiendo alrededor de $${Math.round(gastoDesperdiciado).toLocaleString()} en inversión poco eficiente.`;
  }
  return `Tu cuenta necesita atención. Hay fugas importantes: cerca del ${Math.round(porcentajeDesperdiciado)}% del gasto podría estar mal usado.`;
}

export function textoHallazgoParaUsuario(
  hallazgo: {
    descripcion_simple?: string;
    descripcion_tecnica?: string;
    descripcion?: string;
  },
  lenguajeClaro: boolean
): string {
  const simple = (hallazgo.descripcion_simple || "").trim();
  const tecnica = (hallazgo.descripcion_tecnica || hallazgo.descripcion || "").trim();
  if (lenguajeClaro) {
    return simple || tecnica || "Mora detectó algo que conviene corregir en tu cuenta.";
  }
  return tecnica || simple || "Hallazgo priorizado por impacto en la cuenta.";
}
