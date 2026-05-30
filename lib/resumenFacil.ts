import {
  adaptarTextoHistorico,
  prefijarNarrativaHistorica,
  tituloHallazgoHistorico,
  type OpcionesCopyHistorico,
} from "./copyHistorico";

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

export function tituloHumanoHallazgo(
  idRastreo: string,
  tituloOriginal: string,
  opciones?: Pick<OpcionesCopyHistorico, "modoHistorico">
): string {
  if (opciones?.modoHistorico) {
    return tituloHallazgoHistorico(idRastreo, tituloOriginal);
  }
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
  porcentajeDesperdiciado: number,
  opciones?: {
    cuenta_sin_cambios_urgentes?: boolean;
    nivel?: string;
    modoHistorico?: boolean;
    fechaAuditoria?: string;
  }
): string {
  const historico = opciones?.modoHistorico === true;

  if (opciones?.cuenta_sin_cambios_urgentes) {
    const presente =
      opciones.nivel === "optima" || score >= 92
        ? "Tu cuenta no necesita cambios urgentes: está en muy buen estado. Mora no detectó fugas materiales ni correcciones obligatorias."
        : "Tu cuenta está estable y no requiere cambios urgentes ahora. Podés seguir monitoreando con tranquilidad.";
    const pasado =
      opciones.nivel === "optima" || score >= 92
        ? "En esa auditoría, tu cuenta no necesitaba cambios urgentes: estaba en muy buen estado. Mora no había detectado fugas materiales ni correcciones obligatorias."
        : "En esa auditoría, tu cuenta estaba estable y no requería cambios urgentes en ese momento. Podías seguir monitoreando con tranquilidad.";
    const base = historico ? pasado : presente;
    return historico && opciones.fechaAuditoria
      ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
      : historico
        ? adaptarTextoHistorico(base)
        : base;
  }
  if (score >= 75 && gastoDesperdiciado <= 0) {
    const base = historico
      ? "En esa auditoría, tu cuenta estaba en buen estado. No había fugas urgentes detectadas."
      : "Tu cuenta está en buen estado. No hay fugas urgentes detectadas en esta auditoría.";
    return historico && opciones?.fechaAuditoria
      ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
      : base;
  }
  if (score >= 75) {
    const base = historico
      ? "En esa auditoría, tu cuenta estaba en buen estado. Los puntos marcados por Mora servían para afinar aún más el rendimiento de ese momento."
      : "Tu cuenta está en buen estado. Revisá los puntos que Mora marcó solo si querés afinar aún más el rendimiento.";
    return historico && opciones?.fechaAuditoria
      ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
      : base;
  }
  if (score >= 50) {
    const base = historico
      ? `En esa auditoría, tu cuenta tenía cosas para mejorar. Mora estimó que podías estar perdiendo alrededor de $${Math.round(gastoDesperdiciado).toLocaleString()} en inversión poco eficiente.`
      : `Tu cuenta tiene cosas para mejorar. Mora estima que podrías estar perdiendo alrededor de $${Math.round(gastoDesperdiciado).toLocaleString()} en inversión poco eficiente.`;
    return historico && opciones?.fechaAuditoria
      ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
      : base;
  }
  const base = historico
    ? `En esa auditoría, tu cuenta necesitaba atención. Había fugas importantes: cerca del ${Math.round(porcentajeDesperdiciado)}% del gasto podía estar mal usado.`
    : `Tu cuenta necesita atención. Hay fugas importantes: cerca del ${Math.round(porcentajeDesperdiciado)}% del gasto podría estar mal usado.`;
  return historico && opciones?.fechaAuditoria
    ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
    : base;
}

export function textoHallazgoParaUsuario(
  hallazgo: {
    descripcion_simple?: string;
    descripcion_tecnica?: string;
    descripcion?: string;
  },
  lenguajeClaro: boolean,
  opciones?: Pick<OpcionesCopyHistorico, "modoHistorico">
): string {
  const simple = (hallazgo.descripcion_simple || "").trim();
  const tecnica = (hallazgo.descripcion_tecnica || hallazgo.descripcion || "").trim();
  const historico = opciones?.modoHistorico === true;

  let texto: string;
  if (lenguajeClaro) {
    texto =
      simple ||
      tecnica ||
      (historico
        ? "Mora había detectado algo que convenía corregir en tu cuenta en esa fecha."
        : "Mora detectó algo que conviene corregir en tu cuenta.");
  } else {
    texto =
      tecnica ||
      simple ||
      (historico
        ? "Hallazgo priorizado por impacto en la cuenta en esa auditoría."
        : "Hallazgo priorizado por impacto en la cuenta.");
  }

  return historico ? adaptarTextoHistorico(texto) : texto;
}
