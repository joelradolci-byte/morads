import {
  adaptarTextoHistorico,
  prefijarNarrativaHistorica,
  tituloHallazgoHistorico,
  type OpcionesCopyHistorico,
} from "./copyHistorico";
import { formatMonto } from "./formatoMoneda";
import type { Locale } from "./i18n/types";

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

const TITULOS_HUMANOS_ES: Record<string, string> = {
  GENERADOR_NEGATIVOS_URGENTE: "Pagás por búsquedas que no te traen ventas",
  DAYPARTING_FUGAS_HORARIAS: "Hay horarios donde gastás y no vendés",
  SIMULADOR_PRESUPUESTO: "Podés repartir mejor tu inversión en publicidad",
  OPORTUNIDAD_ROBIN_HOOD: "Hay plata mal puesta en campañas que no rinden",
};

const TITULOS_HUMANOS_EN: Record<string, string> = {
  GENERADOR_NEGATIVOS_URGENTE: "You're paying for searches that don't drive sales",
  DAYPARTING_FUGAS_HORARIAS: "There are time slots where you spend but don't convert",
  SIMULADOR_PRESUPUESTO: "You can allocate ad spend more efficiently",
  OPORTUNIDAD_ROBIN_HOOD: "Budget is stuck in campaigns that underperform",
};

export function tituloHumanoHallazgo(
  idRastreo: string,
  tituloOriginal: string,
  opciones?: Pick<OpcionesCopyHistorico, "modoHistorico"> & { locale?: Locale }
): string {
  if (opciones?.modoHistorico) {
    return tituloHallazgoHistorico(idRastreo, tituloOriginal);
  }
  const map = opciones?.locale === "en" ? TITULOS_HUMANOS_EN : TITULOS_HUMANOS_ES;
  return map[idRastreo] ?? tituloOriginal;
}

const INTRO_ES: Record<AccionResumenPanel, string> = {
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

const INTRO_EN: Record<AccionResumenPanel, string> = {
  destripador:
    "These search terms spend budget without driving sales. Select what to block, then Apply or Copy.",
  dayparting:
    "The heatmap shows when you lose budget. Pick red slots and apply the suggested schedule changes.",
  simulador:
    "See what happens if you shift budget from weak campaigns to winners. Simulation only — nothing changes automatically.",
  robin_hood:
    "Mora found overspending campaigns and room to grow winners. Review the plan and confirm if you want to apply it.",
  detalle_hallazgo:
    "Review this finding and follow the recommended action in Google Ads.",
};

export function introPanelDesdeResumen(
  accion: AccionResumenPanel,
  locale: Locale = "es"
): string {
  return locale === "en" ? INTRO_EN[accion] : INTRO_ES[accion];
}

/** @deprecated Usar introPanelDesdeResumen(locale) */
export const INTRO_PANEL_DESDE_RESUMEN = INTRO_ES;

export function fraseSaludCuenta(
  score: number,
  gastoDesperdiciado: number,
  porcentajeDesperdiciado: number,
  opciones?: {
    cuenta_sin_cambios_urgentes?: boolean;
    nivel?: string;
    modoHistorico?: boolean;
    fechaAuditoria?: string;
    currencyCode?: string;
    locale?: Locale;
  }
): string {
  const historico = opciones?.modoHistorico === true;
  const locale = opciones?.locale ?? "es";
  const en = locale === "en";
  const monto = formatMonto(
    gastoDesperdiciado,
    opciones?.currencyCode,
    locale
  );

  if (opciones?.cuenta_sin_cambios_urgentes) {
    const presente = en
      ? opciones.nivel === "optima" || score >= 92
        ? "Your account doesn't need urgent changes: it's in great shape. Mora found no material leaks or mandatory fixes."
        : "Your account is stable and doesn't need urgent changes right now. You can keep monitoring calmly."
      : opciones.nivel === "optima" || score >= 92
        ? "Tu cuenta no necesita cambios urgentes: está en muy buen estado. Mora no detectó fugas materiales ni correcciones obligatorias."
        : "Tu cuenta está estable y no requiere cambios urgentes ahora. Podés seguir monitoreando con tranquilidad.";
    const pasado = en
      ? opciones.nivel === "optima" || score >= 92
        ? "In that audit, your account didn't need urgent changes: it was in great shape."
        : "In that audit, your account was stable and didn't need urgent changes at that time."
      : opciones.nivel === "optima" || score >= 92
        ? "En esa auditoría, tu cuenta no necesitaba cambios urgentes: estaba en muy buen estado."
        : "En esa auditoría, tu cuenta estaba estable y no requería cambios urgentes en ese momento.";
    const base = historico ? pasado : presente;
    return historico && opciones.fechaAuditoria
      ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
      : historico
        ? adaptarTextoHistorico(base)
        : base;
  }
  if (score >= 75 && gastoDesperdiciado <= 0) {
    const base = en
      ? historico
        ? "In that audit, your account was in good shape. No urgent leaks were detected."
        : "Your account is in good shape. No urgent leaks in this audit."
      : historico
        ? "En esa auditoría, tu cuenta estaba en buen estado. No había fugas urgentes detectadas."
        : "Tu cuenta está en buen estado. No hay fugas urgentes detectadas en esta auditoría.";
    return historico && opciones?.fechaAuditoria
      ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
      : base;
  }
  if (score >= 75) {
    const base = en
      ? historico
        ? "In that audit, your account was in good shape. Mora's notes were optional fine-tuning."
        : "Your account is in good shape. Review Mora's notes only if you want to fine-tune further."
      : historico
        ? "En esa auditoría, tu cuenta estaba en buen estado. Los puntos marcados servían para afinar aún más."
        : "Tu cuenta está en buen estado. Revisá los puntos que Mora marcó solo si querés afinar aún más.";
    return historico && opciones?.fechaAuditoria
      ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
      : base;
  }
  if (score >= 50) {
    const base = en
      ? historico
        ? `In that audit, there was room to improve. Mora estimated about ${monto} in inefficient spend.`
        : `There's room to improve. Mora estimates about ${monto} in inefficient spend.`
      : historico
        ? `En esa auditoría, tu cuenta tenía cosas para mejorar. Mora estimó que podías estar perdiendo alrededor de ${monto} en inversión poco eficiente.`
        : `Tu cuenta tiene cosas para mejorar. Mora estima que podrías estar perdiendo alrededor de ${monto} en inversión poco eficiente.`;
    return historico && opciones?.fechaAuditoria
      ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
      : base;
  }
  const base = en
    ? historico
      ? `In that audit, your account needed attention. Major leaks: about ${Math.round(porcentajeDesperdiciado)}% of spend may have been misused.`
      : `Your account needs attention. Major leaks: about ${Math.round(porcentajeDesperdiciado)}% of spend may be misused.`
    : historico
      ? `En esa auditoría, tu cuenta necesitaba atención. Había fugas importantes: cerca del ${Math.round(porcentajeDesperdiciado)}% del gasto podía estar mal usado.`
      : `Tu cuenta necesita atención. Hay fugas importantes: cerca del ${Math.round(porcentajeDesperdiciado)}% del gasto podría estar mal usado.`;
  return historico && opciones?.fechaAuditoria
    ? prefijarNarrativaHistorica(base, opciones.fechaAuditoria)
    : base;
}

/** Resumen y cards: siempre descripción simple. Detalle: usar `lenguajeClaro === false` para técnico. */
export function textoHallazgoParaUsuario(
  hallazgo: {
    descripcion_simple?: string;
    descripcion_tecnica?: string;
    descripcion?: string;
  },
  lenguajeClaro: boolean,
  opciones?: Pick<OpcionesCopyHistorico, "modoHistorico"> & { locale?: Locale }
): string {
  const simple = (hallazgo.descripcion_simple || "").trim();
  const tecnica = (hallazgo.descripcion_tecnica || hallazgo.descripcion || "").trim();
  const historico = opciones?.modoHistorico === true;
  const en = opciones?.locale === "en";

  let texto: string;
  if (lenguajeClaro) {
    texto =
      simple ||
      tecnica ||
      (historico
        ? en
          ? "Mora had flagged something worth fixing on that date."
          : "Mora había detectado algo que convenía corregir en tu cuenta en esa fecha."
        : en
          ? "Mora found something worth fixing in your account."
          : "Mora detectó algo que conviene corregir en tu cuenta.");
  } else {
    texto =
      tecnica ||
      simple ||
      (historico
        ? en
          ? "Finding prioritized by impact in that audit."
          : "Hallazgo priorizado por impacto en la cuenta en esa auditoría."
        : en
          ? "Finding prioritized by account impact."
          : "Hallazgo priorizado por impacto en la cuenta.");
  }

  return historico ? adaptarTextoHistorico(texto) : texto;
}
