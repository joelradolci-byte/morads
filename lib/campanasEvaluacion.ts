import {
  calcularScoreCampana,
  type CampanaMora,
  type ScoreCampanaResult,
} from "./motorMora";
import {
  evaluarSaludCampana,
  type DiagnosticoSaludReporte,
  type NivelSalud,
} from "./saludMora";

export type PacingCampanaResult = {
  gasto: number;
  presupuesto: number;
  porcentajeGasto: number;
  presupuestoRestante: number;
  ajusteDiarioRecomendado: number;
  estado: string;
  descripcion: string;
  color: string;
  bg: string;
  border: string;
  bar: string;
};

export type PacingAccionDef = {
  action: "REDUCE_BUDGET" | "INCREASE_BUDGET" | "SET_BUDGET";
  valorAnterior: number;
  valorPropuesto: number;
  motivo: string;
  impacto: string;
  labelBoton: string;
};

export type MatrizBucketId = "escalar" | "testear" | "observar" | "apagar";

export type MatrizItemEval = {
  campana: CampanaMora & { id: string; nombre: string };
  evaluacion: ScoreCampanaResult;
  cpaObjetivo: number;
};

export type CampanaEvaluada = MatrizItemEval & {
  pacing: PacingCampanaResult;
  nivelSalud: NivelSalud;
  requiereAccion: boolean;
};

export type FiltroCampanaEstado = "todas" | "activas" | "pausadas";
export type FiltroCampanaTag = "todos" | ScoreCampanaResult["tag"];
export type FiltroCampanaSalud = "todas" | "accion" | "bien";
export type OrdenCampanas = "score_desc" | "gasto_desc" | "cpa_asc";
export type CampanasSubVista = "lista" | "matriz" | "pacing";

export type CampanasQueryInicial = {
  subVista?: CampanasSubVista;
  q?: string;
  tag?: string;
  campanaId?: string;
};

export function cpaPromedioDesdeCampanas(
  campanas: { gasto_mensual?: number; conversiones?: number; estado?: string }[]
): number {
  const activas = campanas.filter(c => c.estado === "ENABLED" || c.estado === undefined);
  const gastoTotal = activas.reduce((acc, c) => acc + (c.gasto_mensual || 0), 0);
  const convTotales = activas.reduce((acc, c) => acc + (c.conversiones || 0), 0);
  return convTotales > 0 ? gastoTotal / convTotales : 50;
}

export function calcularPacingCampana(campana: {
  gasto_mensual?: number;
  presupuesto_mensual?: number;
}): PacingCampanaResult {
  const gasto = campana.gasto_mensual || 0;
  const presupuesto = campana.presupuesto_mensual || 0;
  const hoy = new Date();
  const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const diaActual = hoy.getDate();
  const diasRestantes = Math.max(1, diasMes - diaActual);
  const porcentajeMes = (diaActual / diasMes) * 100;
  const porcentajeGasto = presupuesto > 0 ? (gasto / presupuesto) * 100 : 0;
  const desvio = porcentajeGasto - porcentajeMes;
  const presupuestoRestante = presupuesto - gasto;
  const ajusteDiarioRecomendado = Math.max(0, presupuestoRestante / diasRestantes);

  if (presupuesto <= 0) {
    return {
      gasto,
      presupuesto,
      porcentajeGasto,
      presupuestoRestante,
      ajusteDiarioRecomendado,
      estado: "Sin presupuesto",
      descripcion: "Definí un presupuesto mensual para calcular ritmo.",
      color: "text-[#A8A29E]",
      bg: "bg-[#A8A29E]/10",
      border: "border-[#44403C]",
      bar: "bg-[#A8A29E]",
    };
  }

  if (desvio > 10) {
    return {
      gasto,
      presupuesto,
      porcentajeGasto,
      presupuestoRestante,
      ajusteDiarioRecomendado,
      estado: "Sobreinvirtiendo",
      descripcion: "El gasto avanza más rápido que el mes.",
      color: "text-[#E07070]",
      bg: "bg-[#E07070]/10",
      border: "border-[#E07070]/30",
      bar: "bg-[#E07070]",
    };
  }

  if (desvio < -10) {
    return {
      gasto,
      presupuesto,
      porcentajeGasto,
      presupuestoRestante,
      ajusteDiarioRecomendado,
      estado: "Subinvirtiendo",
      descripcion: "El gasto está por debajo del ritmo esperado.",
      color: "text-[#EAB308]",
      bg: "bg-[#EAB308]/10",
      border: "border-[#EAB308]/30",
      bar: "bg-[#EAB308]",
    };
  }

  return {
    gasto,
    presupuesto,
    porcentajeGasto,
    presupuestoRestante,
    ajusteDiarioRecomendado,
    estado: "En ritmo",
    descripcion: "Consumo alineado con el avance del mes.",
    color: "text-[#10B981]",
    bg: "bg-[#10B981]/10",
    border: "border-[#10B981]/30",
    bar: "bg-[#10B981]",
  };
}

export function obtenerAccionPacing(
  campana: CampanaMora,
  pacing: PacingCampanaResult,
  evaluacion: ScoreCampanaResult,
  cpaObjetivo: number
): PacingAccionDef | null {
  const presupuesto = campana.presupuesto_mensual || 0;
  const gasto = campana.gasto_mensual || 0;

  if (pacing.estado === "Sin presupuesto" && gasto > 0) {
    const hoy = new Date();
    const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const propuesto = Math.round((gasto / Math.max(hoy.getDate(), 1)) * diasMes);
    return {
      action: "SET_BUDGET",
      valorAnterior: 0,
      valorPropuesto: propuesto,
      motivo: "La campaña no tiene presupuesto mensual definido para medir ritmo.",
      impacto: "Permite calcular pacing y evitar sobre o subinversión.",
      labelBoton: "Definir presupuesto",
    };
  }

  if (presupuesto <= 0) return null;

  if (evaluacion.tag === "SIN_DATOS" || evaluacion.cpaActual == null) return null;

  if (
    pacing.estado === "Sobreinvirtiendo" &&
    ((evaluacion.cpaActual ?? 0) > cpaObjetivo * 1.2 || evaluacion.tag === "BASURA")
  ) {
    const propuesto = Math.max(Math.round(presupuesto * 0.85), Math.round(gasto));
    return {
      action: "REDUCE_BUDGET",
      valorAnterior: presupuesto,
      valorPropuesto: propuesto,
      motivo: "La campaña gasta más rápido de lo esperado y su CPA supera el objetivo.",
      impacto: "Frena el ritmo de inversión para no agotar presupuesto antes de fin de mes.",
      labelBoton: "Reducir presupuesto",
    };
  }

  if (pacing.estado === "Subinvirtiendo" && evaluacion.tag === "ESTRELLA") {
    return {
      action: "INCREASE_BUDGET",
      valorAnterior: presupuesto,
      valorPropuesto: Math.round(presupuesto * 1.1),
      motivo: "La campaña está por debajo del ritmo esperado y tiene CPA eficiente.",
      impacto: "Acelera la inversión para capturar demanda disponible.",
      labelBoton: "Acelerar inversión",
    };
  }

  return null;
}

export function agruparMatriz(evaluaciones: MatrizItemEval[]) {
  const sinDatos = evaluaciones.filter(e => e.evaluacion.tag === "SIN_DATOS");
  return {
    escalar: evaluaciones.filter(e => e.evaluacion.tag === "ESTRELLA"),
    testear: evaluaciones.filter(e => e.evaluacion.tag === "POTENCIAL"),
    observar: evaluaciones.filter(
      e => e.evaluacion.tag === "DUDOSO" || e.evaluacion.tag === "SIN_DATOS"
    ),
    apagar: evaluaciones.filter(e => e.evaluacion.tag === "BASURA"),
    sin_datos: sinDatos,
  };
}

export function formatearCpaCampana(cpa: number | null): string {
  if (cpa == null) return "—";
  return `$${cpa.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function etiquetaScoreCampana(ev: ScoreCampanaResult): string {
  if (ev.tag === "SIN_DATOS" || ev.score == null) return "—";
  return String(ev.score);
}

function scoreOrden(ev: ScoreCampanaResult): number {
  if (ev.tag === "SIN_DATOS" || ev.score == null) return -1;
  return ev.score;
}

function cpaOrden(ev: ScoreCampanaResult): number {
  if (ev.cpaActual == null) return Number.POSITIVE_INFINITY;
  return ev.cpaActual;
}

export function impactoFinancieroApagar(items: MatrizItemEval[]): number {
  return items.reduce((acc, { campana, cpaObjetivo }) => {
    const gasto = campana.gasto_mensual || 0;
    const conv = campana.conversiones || 0;
    if (conv === 0) return acc + gasto * 0.5;
    const limite = conv * cpaObjetivo * 1.2;
    return acc + Math.max(gasto * 0.3, Math.max(0, gasto - limite));
  }, 0);
}

export function impactoFinancieroEscalar(items: MatrizItemEval[]): number {
  return items.reduce((acc, { campana }) => acc + (campana.gasto_mensual || 0) * 0.15, 0);
}

export function gastoEnBucket(items: MatrizItemEval[]): number {
  return items.reduce((acc, { campana }) => acc + (campana.gasto_mensual || 0), 0);
}

export function evaluarCampanas(
  campanas: (CampanaMora & { id: string; nombre: string })[],
  cpaPromedio?: number,
  diagnosticoSalud?: DiagnosticoSaludReporte | null
): { cpaPromedio: number; evaluadas: CampanaEvaluada[] } {
  const cpa = cpaPromedio ?? cpaPromedioDesdeCampanas(campanas);
  const evaluadas: CampanaEvaluada[] = campanas.map(campana => {
    const evaluacion = calcularScoreCampana(campana, cpa);
    const diag = diagnosticoSalud?.campanas?.[String(campana.id)];
    const saludLocal = evaluarSaludCampana(campana, cpa);
    return {
      campana,
      evaluacion,
      cpaObjetivo: campana.cpa_objetivo ?? cpa,
      pacing: calcularPacingCampana(campana),
      nivelSalud: diag?.nivel ?? saludLocal.nivel,
      requiereAccion: diag?.requiere_accion ?? saludLocal.requiere_accion,
    };
  });
  return { cpaPromedio: cpa, evaluadas };
}

export function filtrarYOrdenarCampanas(
  evaluadas: CampanaEvaluada[],
  opts: {
    busqueda: string;
    estado: FiltroCampanaEstado;
    tag: FiltroCampanaTag;
    salud: FiltroCampanaSalud;
    orden: OrdenCampanas;
  }
): CampanaEvaluada[] {
  const q = opts.busqueda.trim().toLowerCase();
  let out = evaluadas.filter(item => {
    if (q && !item.campana.nombre.toLowerCase().includes(q)) return false;
    if (opts.estado === "activas" && item.campana.estado !== "ENABLED") return false;
    if (opts.estado === "pausadas" && item.campana.estado === "ENABLED") return false;
    if (opts.tag !== "todos" && item.evaluacion.tag !== opts.tag) return false;
    if (opts.salud === "accion" && !item.requiereAccion) return false;
    if (opts.salud === "bien" && item.requiereAccion) return false;
    return true;
  });

  return [...out].sort((a, b) => {
    switch (opts.orden) {
      case "gasto_desc":
        return (b.campana.gasto_mensual || 0) - (a.campana.gasto_mensual || 0);
      case "cpa_asc":
        return cpaOrden(a.evaluacion) - cpaOrden(b.evaluacion);
      default:
        return scoreOrden(b.evaluacion) - scoreOrden(a.evaluacion);
    }
  });
}

export function campanasPacingAlerta(evaluadas: CampanaEvaluada[]): CampanaEvaluada[] {
  return evaluadas.filter(item => {
    if (item.campana.estado !== "ENABLED") return false;
    if (item.evaluacion.tag === "SIN_DATOS") return false;
    const cpa = item.evaluacion.cpaActual;
    const cpaCritico =
      (cpa != null && cpa > item.cpaObjetivo * 1.2) || item.evaluacion.tag === "BASURA";
    return (
      item.pacing.estado === "Sobreinvirtiendo" ||
      (cpaCritico && item.pacing.estado !== "Sin presupuesto") ||
      (item.pacing.estado === "Subinvirtiendo" && item.evaluacion.tag === "ESTRELLA")
    );
  });
}

export function colorClassesPorTag(tag: string) {
  switch (tag) {
    case "ESTRELLA":
      return { border: "hover:border-[#10B981]", text: "text-[#10B981]", bg: "bg-[#10B981]/10", bar: "bg-[#10B981]" };
    case "BASURA":
      return { border: "hover:border-[#E07070]", text: "text-[#E07070]", bg: "bg-[#E07070]/10", bar: "bg-[#E07070]" };
    case "POTENCIAL":
      return { border: "hover:border-blue-400", text: "text-blue-400", bg: "bg-blue-400/10", bar: "bg-blue-400" };
    case "DUDOSO":
      return { border: "hover:border-[#EAB308]", text: "text-[#EAB308]", bg: "bg-[#EAB308]/10", bar: "bg-[#EAB308]" };
    case "SIN_DATOS":
      return { border: "border-[#44403C]", text: "text-[#78716C]", bg: "bg-[#44403C]/30", bar: "bg-[#57534E]" };
    default:
      return { border: "border-[#44403C]", text: "text-[#A8A29E]", bg: "bg-[#A8A29E]/10", bar: "bg-[#A8A29E]" };
  }
}
