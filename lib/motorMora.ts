// /lib/motorMora.ts

import {
  construirHallazgosVerdes,
  evaluarSaludCampana,
  evaluarSaludCuenta,
  impactoHallazgoEsMaterial,
  type DiagnosticoSaludReporte,
} from "./saludMora";

// ============================================================================
// INTERFACES (Estructura de Datos de Entrada Estricta)
// ============================================================================
export interface CampanaMora {
  id: string;
  nombre: string;
  estado: string; 
  presupuesto_mensual: number;
  gasto_mensual: number;
  clics: number;
  conversiones: number;
  /** null = sin gasto/clics/conversiones en el período (no usar 9999 como centinela). */
  cpa_actual: number | null;
  cpa_objetivo?: number;
  // LO NUEVO: Campos para el Analizador de Quality Score
  quality_score?: number;
  quality_ctr?: string;
  quality_relevance?: string;
  quality_landing?: string;
  search_lost_is_budget?: number;
  cuota_impresiones_perdida_presupuesto?: number;
  impression_share_lost_budget?: number;
}

export interface TerminoBusqueda {
  termino_exacto: string;
  id_campana_asociada: string;
  gasto: number;
  clics: number;
  conversiones: number;
}

export interface DatosAuditoriaInput {
  tipo_negocio: 'ecommerce' | 'lead_gen' | 'high_ticket';
  cpa_promedio_cuenta: number;
  gasto_total_cuenta: number;
  conversiones_totales: number;
  clics_totales: number;
  campanas: CampanaMora[];
  terminos?: TerminoBusqueda[];
  horarios?: DatoHorarioCampana[];
  // Nombre/s de marca del cliente para proteger términos que la mencionan.
  // Puede ser una palabra ("acme"), varias separadas por coma, o un array.
  marca_cliente?: string | string[];
  /** ISO 4217 desde Google Ads (ej. USD, ARS). */
  currency_code?: string;
}

// ============================================================================
// DESTRIPADOR DE BÚSQUEDAS (N-Gramas)
// ============================================================================
export type CategoriaIntencionId =
  | "gratuita_educativa"
  | "baja_calidad"
  | "competencia"
  | "soporte_empleo"
  | "otro";

export interface DestripadorTermino {
  termino: string;
  gasto: number;
  clics: number;
  conversiones: number;
  campana_id: string;
  campana_nombre: string;
  categoria_intencion: CategoriaIntencionId;
  match_recomendado: "EXACTA" | "FRASE";
  motivo: string;
  protegido: boolean;
  motivo_proteccion?: string;
}

export interface DestripadorToken {
  token: string;
  apariciones: number;
  gasto_total: number;
  ejemplo_termino: string;
  categoria_intencion: CategoriaIntencionId;
  protegido: boolean;
  motivo_proteccion?: string;
}

export interface DestripadorCategoriaResumen {
  id: CategoriaIntencionId;
  label: string;
  cantidad_terminos: number;
  ahorro: number;
}

export interface DestripadorReporte {
  ahorro_estimado: number;
  cantidad_palabras_basura: number;
  total_terminos_analizados: number;
  terminos_protegidos: number;
  terminos: DestripadorTermino[];
  tokens: DestripadorToken[];
  categorias: DestripadorCategoriaResumen[];
  marcas_detectadas: string[];
  tokens_protegidos_por_conversion: string[];
  generado_en: string;
  safe_apply: {
    requiere_confirmacion: boolean;
    undo_disponible: boolean;
    nivel_riesgo: "alto";
  };
}

// ============================================================================
// DAYPARTING — Detector de fugas por franja horaria
// ============================================================================
export interface DatoHorarioCampana {
  campana_id: string;
  campana_nombre: string;
  /** 0 = Lunes … 6 = Domingo */
  dia_semana: number;
  hora: number;
  gasto: number;
  clics: number;
  conversiones: number;
}

export type DaypartingEstadoHora = "fuga" | "bueno" | "sin_datos" | "neutro";

export type DaypartingAccionTipo = "reducir_puja" | "pausar_trafico";

export interface DaypartingHora {
  dia_semana: number;
  hora: number;
  label: string;
  gasto: number;
  clics: number;
  conversiones: number;
  cpa: number | null;
  estado: DaypartingEstadoHora;
  gasto_desperdiciado: number;
  muestra_suficiente: boolean;
}

export interface DaypartingPatronResumen {
  dias: string[];
  hora_inicio: number;
  hora_fin: number;
  ahorro_mensual_estimado: number;
  mensaje: string;
}

export interface DaypartingFranja {
  id: string;
  dia_semana: number;
  dia_fin: number;
  hora_inicio: number;
  hora_fin: number;
  etiqueta: string;
  gasto: number;
  clics: number;
  conversiones: number;
  cpa: number | null;
  gasto_desperdiciado: number;
  accion_recomendada: DaypartingAccionTipo;
  motivo: string;
  campanas_top: { campana_id: string; campana_nombre: string; gasto: number }[];
}

export interface DaypartingReporte {
  ahorro_estimado: number;
  ahorro_mensual_estimado: number;
  franjas_con_fuga: number;
  horas_toxicas: number[];
  horas_estrella: number[];
  ventana_dias_historico: number;
  heatmap: DaypartingHora[];
  franjas_problematicas: DaypartingFranja[];
  patron_principal: DaypartingPatronResumen | null;
  generado_en: string;
  safe_apply: {
    requiere_confirmacion: boolean;
    undo_disponible: boolean;
    nivel_riesgo: "medio" | "alto";
  };
}

const DIAS_LARGO = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

const VENTANA_HISTORICO_DIAS = 60;

function labelHora(hora: number): string {
  return `${String(hora).padStart(2, "0")}:00`;
}

function labelCelda(diaSemana: number, hora: number): string {
  const d = DIAS_LARGO[diaSemana] ?? "Día";
  return `${d} ${labelHora(hora)}`;
}

function labelFranjaDia(diaSemana: number, inicio: number, fin: number): string {
  const d = DIAS_LARGO[diaSemana] ?? "Día";
  return `${d} ${labelHora(inicio)} – ${labelHora(fin)}`;
}

function resolverCpaReferencia(datos: DatosAuditoriaInput, campanas: CampanaMora[]): number {
  const objetivos = campanas
    .map(c => c.cpa_objetivo)
    .filter((v): v is number => v != null && v > 0);
  if (objetivos.length > 0) {
    return objetivos.reduce((a, b) => a + b, 0) / objetivos.length;
  }
  return datos.cpa_promedio_cuenta > 0 ? datos.cpa_promedio_cuenta : 20;
}

function construirDayparting(
  datos: DatosAuditoriaInput,
  horarios: DatoHorarioCampana[],
  _multConfianza: number
): DaypartingReporte {
  const heatmapVacio: DaypartingHora[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      heatmapVacio.push({
        dia_semana: d,
        hora: h,
        label: labelCelda(d, h),
        gasto: 0,
        clics: 0,
        conversiones: 0,
        cpa: null,
        estado: "sin_datos",
        gasto_desperdiciado: 0,
        muestra_suficiente: false,
      });
    }
  }

  const vacio: DaypartingReporte = {
    ahorro_estimado: 0,
    ahorro_mensual_estimado: 0,
    franjas_con_fuga: 0,
    horas_toxicas: [],
    horas_estrella: [],
    ventana_dias_historico: VENTANA_HISTORICO_DIAS,
    heatmap: heatmapVacio,
    franjas_problematicas: [],
    patron_principal: null,
    generado_en: new Date().toISOString(),
    safe_apply: {
      requiere_confirmacion: true,
      undo_disponible: true,
      nivel_riesgo: "medio",
    },
  };

  if (!horarios.length) return vacio;

  const campanas = datos.campanas || [];
  const cpaRef = resolverCpaReferencia(datos, campanas);
  const umbralFugaCritica = cpaRef * 2;

  type Agg = { gasto: number; clics: number; conversiones: number };
  const matriz: Agg[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ gasto: 0, clics: 0, conversiones: 0 }))
  );

  const gastoPorCampanaCelda = new Map<
    string,
    { nombre: string; celdas: Map<string, number> }
  >();

  const celdaKey = (d: number, h: number) => `${d}-${h}`;

  horarios.forEach(row => {
    const d = row.dia_semana;
    const h = row.hora;
    if (d < 0 || d > 6 || h < 0 || h > 23) return;
    matriz[d][h].gasto += row.gasto;
    matriz[d][h].clics += row.clics;
    matriz[d][h].conversiones += row.conversiones;

    if (!gastoPorCampanaCelda.has(row.campana_id)) {
      gastoPorCampanaCelda.set(row.campana_id, {
        nombre: row.campana_nombre,
        celdas: new Map(),
      });
    }
    const ck = celdaKey(d, h);
    const prev = gastoPorCampanaCelda.get(row.campana_id)!.celdas.get(ck) ?? 0;
    gastoPorCampanaCelda.get(row.campana_id)!.celdas.set(ck, prev + row.gasto);
  });

  const heatmap: DaypartingHora[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const agg = matriz[d][h];
      const cpa = agg.conversiones > 0 ? agg.gasto / agg.conversiones : null;
      const significativo = agg.gasto >= umbralFugaCritica;
      const fugaCritica = significativo && agg.conversiones === 0;
      const bueno =
        significativo &&
        agg.conversiones > 0 &&
        cpa !== null &&
        cpa <= cpaRef * 0.8;

      let estado: DaypartingEstadoHora = "sin_datos";
      let gastoDesperdiciado = 0;

      if (fugaCritica) {
        estado = "fuga";
        gastoDesperdiciado = agg.gasto;
      } else if (bueno) {
        estado = "bueno";
      } else if (agg.gasto > 0 || agg.clics > 0) {
        estado = "neutro";
      }

      heatmap.push({
        dia_semana: d,
        hora: h,
        label: labelCelda(d, h),
        gasto: parseFloat(agg.gasto.toFixed(2)),
        clics: agg.clics,
        conversiones: agg.conversiones,
        cpa: cpa !== null ? parseFloat(cpa.toFixed(2)) : null,
        estado,
        gasto_desperdiciado: parseFloat(gastoDesperdiciado.toFixed(2)),
        muestra_suficiente: significativo,
      });
    }
  }

  const horasToxicas = [...new Set(heatmap.filter(c => c.estado === "fuga").map(c => c.hora))];
  const horasEstrella = [...new Set(heatmap.filter(c => c.estado === "bueno").map(c => c.hora))];

  const franjas: DaypartingFranja[] = [];
  for (let d = 0; d < 7; d++) {
    const fila = heatmap.filter(c => c.dia_semana === d);
    let i = 0;
    while (i < 24) {
      if (fila[i].estado !== "fuga") {
        i++;
        continue;
      }
      let j = i;
      while (j < 23 && fila[j + 1].estado === "fuga") j++;

      const slice = fila.slice(i, j + 1);
      const gasto = slice.reduce((acc, c) => acc + c.gasto, 0);
      const clics = slice.reduce((acc, c) => acc + c.clics, 0);
      const conversiones = slice.reduce((acc, c) => acc + c.conversiones, 0);
      const gastoDesperdiciado = slice.reduce((acc, c) => acc + c.gasto_desperdiciado, 0);

      const campanasTop: { campana_id: string; campana_nombre: string; gasto: number }[] = [];
      gastoPorCampanaCelda.forEach((val, campanaId) => {
        let g = 0;
        for (let hh = i; hh <= j; hh++) {
          g += val.celdas.get(celdaKey(d, hh)) ?? 0;
        }
        if (g > 0) campanasTop.push({ campana_id: campanaId, campana_nombre: val.nombre, gasto: g });
      });
      campanasTop.sort((a, b) => b.gasto - a.gasto);

      franjas.push({
        id: `franja-d${d}-h${i}-${j}`,
        dia_semana: d,
        dia_fin: d,
        hora_inicio: i,
        hora_fin: j,
        etiqueta: labelFranjaDia(d, i, j),
        gasto: parseFloat(gasto.toFixed(2)),
        clics,
        conversiones,
        cpa: null,
        gasto_desperdiciado: parseFloat(gastoDesperdiciado.toFixed(2)),
        accion_recomendada: "pausar_trafico",
        motivo: `Patrón histórico (${VENTANA_HISTORICO_DIAS}d): $${Math.round(gasto)} gastados sin conversiones (umbral CPA ref. ×2).`,
        campanas_top: campanasTop.slice(0, 4),
      });

      i = j + 1;
    }
  }

  const ahorro = franjas.reduce((acc, f) => acc + f.gasto_desperdiciado, 0);
  const semanasHistorico = VENTANA_HISTORICO_DIAS / 7;
  const ahorroMensual = parseFloat(((ahorro / semanasHistorico) * 4.33).toFixed(2));

  let patronPrincipal: DaypartingPatronResumen | null = null;
  if (franjas.length > 0) {
    const top = [...franjas].sort((a, b) => b.gasto_desperdiciado - a.gasto_desperdiciado)[0];
    const mismoRango = franjas.filter(
      f => f.hora_inicio === top.hora_inicio && f.hora_fin === top.hora_fin
    );
    const diasUnicos = [...new Set(mismoRango.map(f => f.dia_semana))].sort((a, b) => a - b);
    const diasLabels = diasUnicos.map(d => DIAS_LARGO[d]);
    const diasTexto =
      diasLabels.length === 1
        ? diasLabels[0]
        : diasLabels.length === 2
          ? `${diasLabels[0]} y ${diasLabels[1]}`
          : `${diasLabels.slice(0, -1).join(", ")} y ${diasLabels[diasLabels.length - 1]}`;

    patronPrincipal = {
      dias: diasLabels,
      hora_inicio: top.hora_inicio,
      hora_fin: top.hora_fin,
      ahorro_mensual_estimado: ahorroMensual,
      mensaje: `Patrón crítico detectado: Estás quemando presupuesto los ${diasTexto} de ${labelHora(top.hora_inicio)} a ${labelHora(top.hora_fin)}. Ahorro estimado: $${Math.round(ahorroMensual).toLocaleString()}/mes.`,
    };
  }

  return {
    ahorro_estimado: parseFloat(ahorro.toFixed(2)),
    ahorro_mensual_estimado: ahorroMensual,
    franjas_con_fuga: franjas.length,
    horas_toxicas: horasToxicas,
    horas_estrella: horasEstrella,
    ventana_dias_historico: VENTANA_HISTORICO_DIAS,
    heatmap,
    franjas_problematicas: franjas,
    patron_principal: patronPrincipal,
    generado_en: new Date().toISOString(),
    safe_apply: {
      requiere_confirmacion: true,
      undo_disponible: true,
      nivel_riesgo: ahorro >= datos.gasto_total_cuenta * 0.08 ? "alto" : "medio",
    },
  };
}

// ============================================================================
// FASE 1: LA ASPIRADORA
// ============================================================================
export function filtrarCampanasBasura(campanas: CampanaMora[]): CampanaMora[] {
  return campanas.filter(campana => {
    const tieneGasto = campana.gasto_mensual > 0;
    const tieneClics = campana.clics > 0;
    const estaActiva = campana.estado.toLowerCase() === "activa" || campana.estado.toLowerCase() === "enabled";
    return (estaActiva || tieneGasto) && tieneClics;
  });
}

function clamp(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valor));
}

/** Sin señal en el período (p. ej. campaña pausada / seed sin tráfico). */
export function campanaSinMetricas(camp: CampanaMora): boolean {
  if ((camp.gasto_mensual ?? 0) > 0 || (camp.clics ?? 0) > 0 || (camp.conversiones ?? 0) > 0) {
    return false;
  }
  if (camp.cpa_actual === 9999) return true;
  return camp.cpa_actual == null;
}

function resolverCpaCampana(
  gasto: number,
  clics: number,
  conversiones: number
): number | null {
  if (gasto <= 0 && clics <= 0 && conversiones <= 0) return null;
  if (conversiones > 0) return parseFloat((gasto / conversiones).toFixed(2));
  if (gasto > 0) return 9999;
  return null;
}

function campanasActivasConGasto(campanas: CampanaMora[]): CampanaMora[] {
  return campanas.filter(c => {
    const activa = c.estado.toLowerCase() === "enabled" || c.estado.toLowerCase() === "activa";
    return activa && c.gasto_mensual > 0;
  });
}

function cpaObjetivoCampana(camp: CampanaMora, cpaPromedioCuenta: number): number {
  return camp.cpa_objetivo ?? cpaPromedioCuenta;
}

function ratioCpaCampana(camp: CampanaMora, cpaPromedioCuenta: number): number {
  if (campanaSinMetricas(camp)) return 1;
  const objetivo = cpaObjetivoCampana(camp, cpaPromedioCuenta);
  if (objetivo <= 0) return 1;
  if (camp.conversiones === 0 && camp.gasto_mensual > objetivo * 1.5) return 3;
  const cpa = camp.cpa_actual;
  if (cpa == null || cpa <= 0) return 1;
  return cpa / objetivo;
}

function severidadRatioCpa(ratio: number): number {
  if (ratio <= 1) return 0;
  if (ratio <= 1.2) return 0.15;
  if (ratio <= 1.5) return 0.35;
  if (ratio <= 2) return 0.6;
  if (ratio <= 3) return 0.85;
  return 1;
}

export interface ScoreCampanaResult {
  score: number | null;
  tag: "ESTRELLA" | "BASURA" | "POTENCIAL" | "DUDOSO" | "EVALUANDO" | "SIN_DATOS";
  penalizacion: string;
  cpaActual: number | null;
  gasto: number;
  presupuesto: number;
  conversiones: number;
}

export interface RobinHoodOrigen {
  campana_id: string;
  nombre: string;
  presupuesto_actual: number;
  presupuesto_propuesto: number;
  monto_recortado: number;
  cpa_actual: number;
  cpa_objetivo: number;
  motivo: string;
}

export interface RobinHoodDestino {
  campana_id: string;
  nombre: string;
  presupuesto_actual: number;
  presupuesto_propuesto: number;
  monto_incrementado: number;
  cpa_actual: number;
  cpa_objetivo: number;
  margen_escalabilidad: number;
  score_escalabilidad: number;
  conversiones_extra_estimadas: number;
  motivo: string;
}

export interface RobinHoodPlan {
  aplica: boolean;
  estado: "aplicable" | "observacion" | "bloqueado" | "sin_oportunidad";
  confianza: "alta" | "media" | "baja";
  campanas_origen: string[];
  campanas_destino: string[];
  presupuesto_rescatable: number;
  total_reasignado: number;
  justificacion: string;
  origenes: RobinHoodOrigen[];
  destino: RobinHoodDestino | null;
  destinos_backup: RobinHoodDestino[];
  proyeccion: {
    conversiones_extra_mensuales: number;
    cpa_global_actual: number;
    cpa_global_estimado: number;
    reduccion_cpa_global_pct: number;
    supuesto: string;
  };
  bloqueos: string[];
  safe_apply: {
    requiere_confirmacion: boolean;
    undo_disponible: boolean;
    rollback_compensatorio: boolean;
  };
}

interface FugaCritica {
  termino: string;
  gasto: number;
  conversiones: number;
  justificacion: string;
  accion: string;
}

interface FugaParcial extends FugaCritica {
  cpa_termino: number;
}

interface HallazgoMora {
  id_rastreo: string;
  titulo: string;
  descripcion_tecnica: string;
  descripcion_simple: string;
}

export function calcularScoreCampana(camp: CampanaMora, cpaPromedioCuenta = 20): ScoreCampanaResult {
  const gasto = camp.gasto_mensual || 0;
  const presupuesto = camp.presupuesto_mensual || 0;
  const conversiones = camp.conversiones || 0;
  const cpaObjetivo = cpaObjetivoCampana(camp, cpaPromedioCuenta);

  if (campanaSinMetricas(camp)) {
    return {
      score: null,
      tag: "SIN_DATOS",
      penalizacion: "Sin datos suficientes en los últimos 30 días.",
      cpaActual: null,
      gasto,
      presupuesto,
      conversiones,
    };
  }

  const cpaActual =
    camp.cpa_actual ??
    resolverCpaCampana(gasto, camp.clics ?? 0, conversiones) ??
    0;

  const hoy = new Date();
  const diaActual = hoy.getDate();
  const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const fraccionMes = diaActual / diasMes;

  let cpaPenalty = 0;
  if (conversiones === 0 && gasto > cpaObjetivo * 1.5) {
    cpaPenalty = 45;
  } else if (conversiones > 0 && cpaActual != null) {
    cpaPenalty = severidadRatioCpa(cpaActual / cpaObjetivo) * 45;
  } else if (gasto > 0) {
    cpaPenalty = 8;
  }

  let wastePenalty = 0;
  if (conversiones === 0 && gasto > cpaObjetivo * 1.5) {
    wastePenalty = clamp((gasto / Math.max(presupuesto, cpaObjetivo * 3, 1)) * 25, 10, 25);
  } else if (conversiones > 0 && cpaActual != null && cpaActual > cpaObjetivo * 1.2) {
    const gastoEsperado = conversiones * cpaObjetivo * 1.2;
    wastePenalty = clamp(((gasto - gastoEsperado) / Math.max(gasto, 1)) * 25, 0, 25);
  }

  let pacingPenalty = 0;
  if (presupuesto > 0 && fraccionMes > 0) {
    const proyeccion = gasto / fraccionMes;
    pacingPenalty = clamp((Math.abs(proyeccion - presupuesto) / presupuesto) * 5, 0, 10);
  }

  let qsPenalty = 0;
  if (camp.quality_score !== undefined && camp.quality_score > 0 && camp.quality_score < 5) {
    qsPenalty = clamp((5 - camp.quality_score) * 2, 0, 10);
  }

  let confPenalty = 0;
  if (conversiones < 3 && gasto > 0) confPenalty += conversiones === 0 ? 6 : 3;
  if (camp.clics < 50) confPenalty += 2;
  confPenalty = Math.min(confPenalty, 10);

  const score = Math.round(clamp(100 - cpaPenalty - wastePenalty - pacingPenalty - qsPenalty - confPenalty, 0, 100));

  let tag: ScoreCampanaResult["tag"] = "EVALUANDO";
  let penalizacion = "Rendimiento dentro del rango esperado.";

  if (conversiones === 0 && gasto > cpaObjetivo * 1.5) {
    tag = "BASURA";
    penalizacion = "Gasto significativo sin conversiones.";
  } else if (score >= 80 && conversiones >= 3 && cpaActual != null && cpaActual <= cpaObjetivo) {
    tag = "ESTRELLA";
    penalizacion = "CPA por debajo del objetivo. Oportunidad de escalar.";
  } else if (conversiones < 3 && score >= 55 && gasto <= presupuesto * 0.5) {
    tag = "POTENCIAL";
    penalizacion = "Poca data estadística. Monitorear evolución.";
  } else if (
    score < 40 ||
    (conversiones >= 3 && cpaActual != null && cpaActual > cpaObjetivo * 1.3)
  ) {
    tag = "BASURA";
    penalizacion = "CPA insostenible respecto al objetivo.";
  } else if (score < 65) {
    tag = "DUDOSO";
    penalizacion = "Rendimiento mejorable. Revisar términos y puja.";
  } else {
    tag = "DUDOSO";
    penalizacion = "Rendimiento aceptable con margen de optimización.";
  }

  return { score, tag, penalizacion, cpaActual, gasto, presupuesto, conversiones };
}

function calcularPenalizacionCpa(
  campanas: CampanaMora[],
  gastoTotal: number,
  cpaPromedioCuenta: number
): number {
  if (gastoTotal <= 0) return 35;
  let penalizacionPonderada = 0;
  campanas.forEach(camp => {
    if (camp.gasto_mensual <= 0) return;
    const peso = camp.gasto_mensual / gastoTotal;
    penalizacionPonderada += peso * severidadRatioCpa(ratioCpaCampana(camp, cpaPromedioCuenta));
  });
  return penalizacionPonderada * 35;
}

function calcularPenalizacionSearchWaste(
  terminos: TerminoBusqueda[],
  campanas: CampanaMora[],
  gastoTotal: number,
  cpaPromedioCuenta: number,
  multFugaParcial: number
): number {
  if (gastoTotal <= 0 || terminos.length === 0) return 0;
  const campanasMap = new Map(campanas.map(c => [c.id, c]));
  let desperdicioScore = 0;

  terminos.forEach(term => {
    const camp = campanasMap.get(term.id_campana_asociada);
    const cpaObjetivo = camp ? cpaObjetivoCampana(camp, cpaPromedioCuenta) : cpaPromedioCuenta;
    const umbralMinimo = Math.max(cpaObjetivo * 1.5, 10);

    if (term.conversiones === 0 && term.gasto > umbralMinimo) {
      desperdicioScore += term.gasto - umbralMinimo * 0.5;
    } else if (term.conversiones >= 1) {
      const limite = cpaObjetivo * multFugaParcial;
      const cpaTermino = term.gasto / term.conversiones;
      if (cpaTermino > limite) {
        desperdicioScore += term.gasto - term.conversiones * limite;
      }
    }
  });

  return clamp(desperdicioScore / gastoTotal, 0, 1) * 25;
}

function calcularPenalizacionPacing(campanas: CampanaMora[]): number {
  const activas = campanasActivasConGasto(campanas);
  if (activas.length === 0) return 0;

  const hoy = new Date();
  const fraccionMes = hoy.getDate() / new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  if (fraccionMes <= 0) return 0;

  let desviacionPonderada = 0;
  let gastoPonderado = 0;

  activas.forEach(camp => {
    if (camp.presupuesto_mensual <= 0) return;
    const proyeccion = camp.gasto_mensual / fraccionMes;
    const desviacion = Math.abs(proyeccion - camp.presupuesto_mensual) / camp.presupuesto_mensual;
    desviacionPonderada += desviacion * camp.gasto_mensual;
    gastoPonderado += camp.gasto_mensual;
  });

  const desviacionPromedio = gastoPonderado > 0 ? desviacionPonderada / gastoPonderado : 0;
  return clamp(desviacionPromedio, 0, 1) * 15;
}

function calcularPenalizacionQualityScore(campanas: CampanaMora[], gastoTotal: number): number {
  if (gastoTotal <= 0) return 0;
  const gastoQsBajo = campanas.reduce((acc, camp) => {
    if (camp.quality_score !== undefined && camp.quality_score > 0 && camp.quality_score < 5) {
      return acc + camp.gasto_mensual;
    }
    return acc;
  }, 0);
  return clamp((gastoQsBajo / gastoTotal) * 2, 0, 1) * 10;
}

function calcularPenalizacionAsignacion(
  campanas: CampanaMora[],
  gastoTotal: number,
  cpaPromedioCuenta: number
): number {
  if (gastoTotal <= 0) return 10;

  let gastoMalo = 0;
  let gastoBueno = 0;

  campanasActivasConGasto(campanas).forEach(camp => {
    const objetivo = cpaObjetivoCampana(camp, cpaPromedioCuenta);
    const cpa = camp.cpa_actual;
    const esMala =
      (camp.conversiones >= 3 && cpa != null && cpa > objetivo * 1.2) ||
      (camp.conversiones === 0 && camp.gasto_mensual > objetivo * 1.5);
    const esBuena = camp.conversiones >= 3 && cpa != null && cpa <= objetivo * 0.9;

    if (esMala) gastoMalo += camp.gasto_mensual;
    if (esBuena) gastoBueno += camp.gasto_mensual;
  });

  const ratioMalo = gastoMalo / gastoTotal;
  const deficitBueno = Math.max(0, 0.35 - gastoBueno / gastoTotal);
  return clamp(ratioMalo * 0.7 + deficitBueno, 0, 1) * 10;
}

function calcularPenalizacionConfianza(
  datos: DatosAuditoriaInput,
  nivelConfianza: string
): number {
  let penalizacion = nivelConfianza === "bajo" ? 4 : nivelConfianza === "medio" ? 2 : 0;
  if (datos.conversiones_totales === 0 && datos.gasto_total_cuenta > 500) {
    penalizacion = 5;
  }
  return penalizacion;
}

function calcularHealthScoreCompuesto(
  datos: DatosAuditoriaInput,
  campanas: CampanaMora[],
  terminos: TerminoBusqueda[],
  nivelConfianza: string,
  multFugaParcial: number
): number {
  const gastoTotal = datos.gasto_total_cuenta;
  const campanasScore = campanasActivasConGasto(campanas);

  const penalizaciones = [
    calcularPenalizacionCpa(campanasScore, gastoTotal, datos.cpa_promedio_cuenta),
    calcularPenalizacionSearchWaste(terminos, campanas, gastoTotal, datos.cpa_promedio_cuenta, multFugaParcial),
    calcularPenalizacionPacing(campanas),
    calcularPenalizacionQualityScore(campanasScore, gastoTotal),
    calcularPenalizacionAsignacion(campanas, gastoTotal, datos.cpa_promedio_cuenta),
    calcularPenalizacionConfianza(datos, nivelConfianza),
  ];

  const score = 100 - penalizaciones.reduce((acc, p) => acc + p, 0);
  return Math.round(clamp(score, 0, 100));
}

function perdidaCuotaPorPresupuesto(camp: CampanaMora): number | null {
  const valor =
    camp.search_lost_is_budget ??
    camp.cuota_impresiones_perdida_presupuesto ??
    camp.impression_share_lost_budget;
  if (valor === undefined || Number.isNaN(valor)) return null;
  return clamp(valor > 1 ? valor / 100 : valor, 0, 1);
}

function margenEscalabilidad(camp: CampanaMora): number {
  const perdidaPorPresupuesto = perdidaCuotaPorPresupuesto(camp);
  if (perdidaPorPresupuesto !== null) return perdidaPorPresupuesto;

  if (camp.presupuesto_mensual <= 0) return 0;
  const ejecucion = camp.gasto_mensual / camp.presupuesto_mensual;

  if (ejecucion >= 0.95) return 0.35;
  if (ejecucion >= 0.85) return 0.22;
  if (ejecucion >= 0.75) return 0.12;
  return 0;
}

function calcularConfianzaRobin(campanas: CampanaMora[]): RobinHoodPlan["confianza"] {
  const conversiones = campanas.reduce((acc, camp) => acc + camp.conversiones, 0);
  const clics = campanas.reduce((acc, camp) => acc + camp.clics, 0);
  if (conversiones >= 50 && clics >= 1500) return "alta";
  if (conversiones >= 15 && clics >= 500) return "media";
  return "baja";
}

/** Reparte el monto final aplicado entre donantes; la suma de recortes = totalAplicar. */
function prorratearOrigenesRobin(origenes: RobinHoodOrigen[], totalAplicar: number): RobinHoodOrigen[] {
  if (origenes.length === 0 || totalAplicar <= 0) return [];

  const bruto = origenes.reduce((acc, o) => acc + o.monto_recortado, 0);
  if (bruto <= 0) return [];

  if (totalAplicar >= bruto) {
    return origenes.map(o => ({
      ...o,
      presupuesto_propuesto: o.presupuesto_actual - o.monto_recortado,
    }));
  }

  const floors = origenes.map(o => Math.floor((o.monto_recortado / bruto) * totalAplicar));
  let asignado = floors.reduce((acc, n) => acc + n, 0);
  let restante = totalAplicar - asignado;

  const porResto = origenes
    .map((o, i) => ({
      i,
      resto: (o.monto_recortado / bruto) * totalAplicar - floors[i],
    }))
    .sort((a, b) => b.resto - a.resto);

  const montos = [...floors];
  for (let k = 0; k < restante && k < porResto.length; k++) {
    montos[porResto[k].i]++;
  }

  return origenes
    .map((o, i) => ({
      ...o,
      monto_recortado: montos[i],
      presupuesto_propuesto: o.presupuesto_actual - montos[i],
    }))
    .filter(o => o.monto_recortado > 0);
}

export function calcularPlanRobinHood(
  campanas: CampanaMora[],
  cpaPromedioCuenta: number,
  tipoNegocio: DatosAuditoriaInput["tipo_negocio"] = "ecommerce",
  gastoTotalCuenta = 0,
  conversionesTotales = 0
): RobinHoodPlan {
  let multRobinOrigen = 1.25;
  let multRobinDestino = 0.80;
  if (tipoNegocio === "lead_gen") {
    multRobinOrigen = 1.35;
    multRobinDestino = 0.82;
  } else if (tipoNegocio === "high_ticket") {
    multRobinOrigen = 1.50;
    multRobinDestino = 0.75;
  }

  const activas = campanas.filter(c => c.estado.toLowerCase() === "enabled" || c.estado.toLowerCase() === "activa");
  const confianza = calcularConfianzaRobin(activas);
  const cpaSuperior = cpaPromedioCuenta * multRobinOrigen;
  const cpaInferior = cpaPromedioCuenta * multRobinDestino;
  const bloqueos: string[] = [];

  const origenes = activas
    .map((camp): RobinHoodOrigen | null => {
      const cpaObjetivo = cpaObjetivoCampana(camp, cpaPromedioCuenta);
      const ejecucion = camp.presupuesto_mensual > 0 ? camp.gasto_mensual / camp.presupuesto_mensual : 0;
      if (campanaSinMetricas(camp)) return null;
      const cpaMalo = camp.conversiones === 0
        ? camp.gasto_mensual > cpaObjetivo * 1.5
        : (camp.cpa_actual ?? 0) > Math.max(cpaSuperior, cpaObjetivo * 1.2);
      if (!cpaMalo || ejecucion <= 0.2 || camp.presupuesto_mensual <= 0) return null;

      const techoRecorte = Math.max(0, camp.presupuesto_mensual - camp.gasto_mensual);
      const recorteConservador = Math.min(camp.presupuesto_mensual * 0.2, camp.gasto_mensual * 0.3, techoRecorte);
      const montoRecortado = Math.round(recorteConservador);
      if (montoRecortado <= 0) {
        bloqueos.push(`${camp.nombre}: sin margen para bajar presupuesto sin quedar debajo del gasto ya consumido.`);
        return null;
      }

      return {
        campana_id: camp.id,
        nombre: camp.nombre,
        presupuesto_actual: Math.round(camp.presupuesto_mensual),
        presupuesto_propuesto: Math.round(camp.presupuesto_mensual - montoRecortado),
        monto_recortado: montoRecortado,
        cpa_actual: parseFloat((camp.cpa_actual ?? 0).toFixed(2)),
        cpa_objetivo: parseFloat(cpaObjetivo.toFixed(2)),
        motivo: camp.conversiones === 0
          ? "Gasto relevante sin conversiones y margen seguro de recorte."
          : "CPA por encima del límite rentable y margen seguro de recorte.",
      };
    })
    .filter((origen): origen is RobinHoodOrigen => origen !== null);

  const destinos = activas
    .map(camp => {
      const cpaObjetivo = cpaObjetivoCampana(camp, cpaPromedioCuenta);
      const margen = margenEscalabilidad(camp);
      const score = calcularScoreCampana(camp, cpaPromedioCuenta);
      if (score.tag === "SIN_DATOS") return null;
      const cpaVal = camp.cpa_actual;
      const cpaEficiente =
        camp.conversiones >= 3 &&
        cpaVal != null &&
        cpaVal > 0 &&
        cpaVal <= Math.min(cpaInferior, cpaObjetivo);
      if (!cpaEficiente) return null;

      const eficiencia = clamp(cpaObjetivo / Math.max(cpaVal, 1), 0, 2) / 2;
      const confianzaData = clamp(camp.conversiones / 20, 0, 1);
      const scoreEscalabilidad = Math.round(
        clamp(margen, 0, 1) * 40 +
        eficiencia * 35 +
        confianzaData * 15 +
        ((score.score ?? 0) / 100) * 10
      );

      if (margen < 0.1) {
        bloqueos.push(`${camp.nombre}: CPA eficiente, pero sin senal suficiente de demanda incremental.`);
        return null;
      }

      return {
        campana: camp,
        cpaObjetivo,
        margen,
        scoreEscalabilidad,
      };
    })
    .filter((destino): destino is { campana: CampanaMora; cpaObjetivo: number; margen: number; scoreEscalabilidad: number } => destino !== null)
    .sort((a, b) => b.scoreEscalabilidad - a.scoreEscalabilidad);

  const presupuestoRescatable = origenes.reduce((acc, origen) => acc + origen.monto_recortado, 0);
  const destinoPrincipal = destinos[0];

  if (origenes.length === 0 && destinos.length === 0) {
    return {
      aplica: false,
      estado: "sin_oportunidad",
      confianza,
      campanas_origen: [],
      campanas_destino: [],
      presupuesto_rescatable: 0,
      total_reasignado: 0,
      justificacion: "No se detectaron campanas donantes ni receptoras con suficiente evidencia.",
      origenes: [],
      destino: null,
      destinos_backup: [],
      proyeccion: {
        conversiones_extra_mensuales: 0,
        cpa_global_actual: parseFloat(cpaPromedioCuenta.toFixed(2)),
        cpa_global_estimado: parseFloat(cpaPromedioCuenta.toFixed(2)),
        reduccion_cpa_global_pct: 0,
        supuesto: "Sin reasignacion recomendada.",
      },
      bloqueos,
      safe_apply: { requiere_confirmacion: true, undo_disponible: true, rollback_compensatorio: true },
    };
  }

  if (origenes.length === 0 || !destinoPrincipal || presupuestoRescatable <= 0) {
    return {
      aplica: false,
      estado: "bloqueado",
      confianza,
      campanas_origen: origenes.map(o => o.nombre),
      campanas_destino: destinos.map(d => d.campana.nombre),
      presupuesto_rescatable: presupuestoRescatable,
      total_reasignado: 0,
      justificacion: origenes.length === 0
        ? "Hay posibles receptoras, pero Mora no encontro presupuesto seguro para rescatar."
        : "Hay presupuesto rescatable, pero Mora no encontro una campana estrella con margen suficiente para absorberlo.",
      origenes,
      destino: null,
      destinos_backup: [],
      proyeccion: {
        conversiones_extra_mensuales: 0,
        cpa_global_actual: parseFloat(cpaPromedioCuenta.toFixed(2)),
        cpa_global_estimado: parseFloat(cpaPromedioCuenta.toFixed(2)),
        reduccion_cpa_global_pct: 0,
        supuesto: "Operacion bloqueada por seguridad.",
      },
      bloqueos,
      safe_apply: { requiere_confirmacion: true, undo_disponible: true, rollback_compensatorio: true },
    };
  }

  const capPorConfianza = confianza === "alta" ? 0.2 : confianza === "media" ? 0.15 : 0.1;
  const incrementoMaximoDestino = Math.round(destinoPrincipal.campana.presupuesto_mensual * capPorConfianza);
  const totalReasignado = Math.max(0, Math.min(presupuestoRescatable, incrementoMaximoDestino));
  const origenesAplicados = prorratearOrigenesRobin(origenes, totalReasignado);

  if (totalReasignado <= 0) {
    bloqueos.push(`${destinoPrincipal.campana.nombre}: el incremento seguro calculado es cero.`);
  } else if (presupuestoRescatable > totalReasignado) {
    bloqueos.push(
      `Potencial detectado: $${Math.round(presupuestoRescatable)}. Por seguridad, Mora aplica $${Math.round(totalReasignado)} ahora.`
    );
  }

  const cpaDestinoRobin = destinoPrincipal.campana.cpa_actual ?? cpaPromedioCuenta;
  const conversionesExtra =
    totalReasignado > 0 ? totalReasignado / Math.max(cpaDestinoRobin, 1) : 0;
  const cpaGlobalActual = cpaPromedioCuenta;
  const gastoBase = gastoTotalCuenta > 0 ? gastoTotalCuenta : campanas.reduce((acc, camp) => acc + camp.gasto_mensual, 0);
  const convBase = conversionesTotales > 0 ? conversionesTotales : campanas.reduce((acc, camp) => acc + camp.conversiones, 0);
  const cpaGlobalEstimado = convBase + conversionesExtra > 0 ? gastoBase / (convBase + conversionesExtra) : cpaGlobalActual;
  const reduccionCpa = cpaGlobalActual > 0 ? ((cpaGlobalActual - cpaGlobalEstimado) / cpaGlobalActual) * 100 : 0;

  const destino: RobinHoodDestino = {
    campana_id: destinoPrincipal.campana.id,
    nombre: destinoPrincipal.campana.nombre,
    presupuesto_actual: Math.round(destinoPrincipal.campana.presupuesto_mensual),
    presupuesto_propuesto: Math.round(destinoPrincipal.campana.presupuesto_mensual + totalReasignado),
    monto_incrementado: Math.round(totalReasignado),
    cpa_actual: parseFloat(cpaDestinoRobin.toFixed(2)),
    cpa_objetivo: parseFloat(destinoPrincipal.cpaObjetivo.toFixed(2)),
    margen_escalabilidad: parseFloat((destinoPrincipal.margen * 100).toFixed(1)),
    score_escalabilidad: destinoPrincipal.scoreEscalabilidad,
    conversiones_extra_estimadas: parseFloat(conversionesExtra.toFixed(1)),
    motivo: "CPA bajo objetivo, data suficiente y margen de crecimiento detectado.",
  };

  const destinosBackup = destinos.slice(1, 3).map(item => ({
    campana_id: item.campana.id,
    nombre: item.campana.nombre,
    presupuesto_actual: Math.round(item.campana.presupuesto_mensual),
    presupuesto_propuesto: Math.round(item.campana.presupuesto_mensual),
    monto_incrementado: 0,
    cpa_actual: parseFloat((item.campana.cpa_actual ?? cpaPromedioCuenta).toFixed(2)),
    cpa_objetivo: parseFloat(item.cpaObjetivo.toFixed(2)),
    margen_escalabilidad: parseFloat((item.margen * 100).toFixed(1)),
    score_escalabilidad: item.scoreEscalabilidad,
    conversiones_extra_estimadas: 0,
    motivo: "Backup si el heroe principal queda sin margen o falla la verificacion.",
  }));

  return {
    aplica: totalReasignado > 0,
    estado: totalReasignado > 0 ? "aplicable" : "bloqueado",
    confianza,
    campanas_origen: origenesAplicados.map(o => o.nombre),
    campanas_destino: [destino.nombre, ...destinosBackup.map(d => d.nombre)],
    presupuesto_rescatable: Math.round(presupuestoRescatable),
    total_reasignado: Math.round(totalReasignado),
    justificacion: totalReasignado > 0
      ? `Mora donará $${Math.round(totalReasignado)}/mes desde ${origenesAplicados.length} campaña${origenesAplicados.length !== 1 ? "s" : ""} hacia ${destino.nombre}.`
      : "Operacion bloqueada por limites de seguridad.",
    origenes: origenesAplicados,
    destino,
    destinos_backup: destinosBackup,
    proyeccion: {
      conversiones_extra_mensuales: parseFloat(conversionesExtra.toFixed(1)),
      cpa_global_actual: parseFloat(cpaGlobalActual.toFixed(2)),
      cpa_global_estimado: parseFloat(cpaGlobalEstimado.toFixed(2)),
      reduccion_cpa_global_pct: parseFloat(Math.max(0, reduccionCpa).toFixed(1)),
      supuesto: `Estimacion conservadora usando el CPA actual de ${destino.nombre}.`,
    },
    bloqueos,
    safe_apply: { requiere_confirmacion: true, undo_disponible: true, rollback_compensatorio: true },
  };
}

// ============================================================================
// DESTRIPADOR — Helpers deterministas
// ============================================================================

const STOPWORDS_ES = new Set([
  "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas",
  "en", "con", "para", "por", "y", "o", "u", "a", "al", "su", "sus",
  "es", "son", "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
  "mi", "mis", "me", "te", "se", "lo", "que", "mas", "más", "muy", "sin",
  "como", "cómo", "qué", "cuál", "cuales", "cuáles", "donde", "dónde",
]);

const LEXICO_INTENCION: Record<CategoriaIntencionId, string[]> = {
  gratuita_educativa: [
    "gratis", "free", "pdf", "descargar", "descarga", "download",
    "manual", "manuales", "tutorial", "tutoriales", "ejemplo", "ejemplos",
    "casero", "casera", "diy", "hazlo", "hazla", "wikipedia",
    "ejercicio", "ejercicios", "apk", "registro",
  ],
  baja_calidad: [
    "barato", "barata", "baratos", "baratas",
    "economico", "económico", "economica", "económica",
    "lowcost", "ganga", "gangas", "regalado", "regalada",
    "usado", "usados", "usada", "usadas",
    "segunda", "mano", "oferta", "ofertas", "descuento", "descuentos",
  ],
  competencia: [
    "alternativa", "alternativas", "competidor", "competidores",
    "competencia", "comparativa", "comparativas", "ranking", "vs", "versus",
  ],
  soporte_empleo: [
    "trabajo", "trabajos", "empleo", "empleos", "vacante", "vacantes",
    "curriculum", "cv", "carrera",
    "telefono", "teléfono", "contacto", "horario", "horarios",
    "queja", "quejas", "reclamo", "reclamos",
    "devolucion", "devolución", "cancelar", "cancelación", "cancelacion",
    "anular", "reembolso", "suscripcion", "suscripción",
    "opinion", "opiniones", "opinión", "negativa", "negativas",
    "problema", "problemas", "error", "fallo", "soporte",
  ],
  otro: [],
};

const ETIQUETAS_INTENCION: Record<CategoriaIntencionId, string> = {
  gratuita_educativa: "Intención gratuita / educativa",
  baja_calidad: "Intención de baja calidad",
  competencia: "Intención de competencia",
  soporte_empleo: "Soporte / empleo / quejas",
  otro: "Otros",
};

function tokenizarTermino(termino: string): string[] {
  return termino
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);
}

function clasificarIntencionPorTokens(tokens: string[]): CategoriaIntencionId {
  const setTokens = new Set(tokens);
  const orden: CategoriaIntencionId[] = [
    "gratuita_educativa", "baja_calidad", "competencia", "soporte_empleo",
  ];
  for (const cat of orden) {
    if (LEXICO_INTENCION[cat].some(palabra => setTokens.has(palabra))) {
      return cat;
    }
  }
  return "otro";
}

function clasificarIntencionToken(token: string): CategoriaIntencionId {
  const orden: CategoriaIntencionId[] = [
    "gratuita_educativa", "baja_calidad", "competencia", "soporte_empleo",
  ];
  for (const cat of orden) {
    if (LEXICO_INTENCION[cat].includes(token)) return cat;
  }
  return "otro";
}

function normalizarMarcas(marca?: string | string[]): string[] {
  if (!marca) return [];
  const lista = Array.isArray(marca) ? marca : marca.split(",");
  const resultado = new Set<string>();
  lista.forEach(entrada => {
    tokenizarTermino(entrada).forEach(t => {
      if (t.length >= 2) resultado.add(t);
    });
  });
  return Array.from(resultado);
}

function decidirMatchRecomendado(termino: string, gasto: number): "EXACTA" | "FRASE" {
  const cantidadPalabras = tokenizarTermino(termino).length;
  if (cantidadPalabras <= 2) return "EXACTA";
  if (gasto >= 200) return "EXACTA";
  return "FRASE";
}

interface ContextoDestripador {
  terminosConConversion: TerminoBusqueda[];
  marcasTokens: string[];
  campanasMap: Map<string, CampanaMora>;
}

function construirContextoDestripador(
  datos: DatosAuditoriaInput,
  campanasLimpias: CampanaMora[],
  terminos: TerminoBusqueda[]
): ContextoDestripador {
  return {
    terminosConConversion: terminos.filter(t => t.conversiones > 0),
    marcasTokens: normalizarMarcas(datos.marca_cliente),
    campanasMap: new Map(campanasLimpias.map(c => [c.id, c])),
  };
}

function construirDestripador(
  terminosFuga: TerminoBusqueda[],
  contexto: ContextoDestripador
): DestripadorReporte {
  const { terminosConConversion, marcasTokens, campanasMap } = contexto;

  const tokensConConversion = new Set<string>();
  terminosConConversion.forEach(t => {
    tokenizarTermino(t.termino_exacto).forEach(tk => tokensConConversion.add(tk));
  });

  const terminos: DestripadorTermino[] = terminosFuga.map(term => {
    const tokens = tokenizarTermino(term.termino_exacto);
    const tocaMarca = tokens.some(tk => marcasTokens.includes(tk));
    const camp = campanasMap.get(term.id_campana_asociada);

    return {
      termino: term.termino_exacto,
      gasto: parseFloat(term.gasto.toFixed(2)),
      clics: term.clics,
      conversiones: term.conversiones,
      campana_id: term.id_campana_asociada,
      campana_nombre: camp?.nombre || "Campaña sin nombre",
      categoria_intencion: clasificarIntencionPorTokens(tokens),
      match_recomendado: decidirMatchRecomendado(term.termino_exacto, term.gasto),
      motivo: "Gasto sin conversión por encima del umbral seguro de la cuenta.",
      protegido: tocaMarca,
      motivo_proteccion: tocaMarca
        ? "Contiene una palabra de la marca declarada por el cliente."
        : undefined,
    };
  });

  // Agregación de tokens (1-gramas) sobre términos fuga.
  type AccToken = {
    apariciones: number;
    gasto_total: number;
    ejemplo: string;
  };
  const acumulador = new Map<string, AccToken>();

  terminosFuga.forEach(term => {
    const tokens = tokenizarTermino(term.termino_exacto);
    const tokensUnicos = Array.from(new Set(tokens));
    tokensUnicos.forEach(tk => {
      if (tk.length < 3) return;
      if (STOPWORDS_ES.has(tk)) return;
      const actual = acumulador.get(tk);
      if (actual) {
        actual.apariciones += 1;
        actual.gasto_total += term.gasto;
      } else {
        acumulador.set(tk, {
          apariciones: 1,
          gasto_total: term.gasto,
          ejemplo: term.termino_exacto,
        });
      }
    });
  });

  const tokens: DestripadorToken[] = Array.from(acumulador.entries())
    .map(([token, info]) => {
      const tocaMarca = marcasTokens.includes(token);
      const tocaConversion = tokensConConversion.has(token);
      const protegido = tocaMarca || tocaConversion;
      const motivo = tocaMarca
        ? "Forma parte del nombre de la marca declarada."
        : tocaConversion
          ? "Aparece en términos que sí convirtieron en la ventana analizada."
          : undefined;
      return {
        token,
        apariciones: info.apariciones,
        gasto_total: parseFloat(info.gasto_total.toFixed(2)),
        ejemplo_termino: info.ejemplo,
        categoria_intencion: clasificarIntencionToken(token),
        protegido,
        motivo_proteccion: motivo,
      };
    })
    .filter(t => t.apariciones >= 2 || t.gasto_total >= 50)
    .sort((a, b) => b.gasto_total - a.gasto_total);

  const ahorroEstimado = terminos
    .filter(t => !t.protegido)
    .reduce((acc, t) => acc + t.gasto, 0);

  const cantidadPalabrasBasura = tokens.filter(t => !t.protegido).length;

  const categoriasIds: CategoriaIntencionId[] = [
    "gratuita_educativa", "baja_calidad", "competencia", "soporte_empleo", "otro",
  ];

  const categorias: DestripadorCategoriaResumen[] = categoriasIds
    .map(id => {
      const items = terminos.filter(t => t.categoria_intencion === id && !t.protegido);
      return {
        id,
        label: ETIQUETAS_INTENCION[id],
        cantidad_terminos: items.length,
        ahorro: parseFloat(items.reduce((acc, t) => acc + t.gasto, 0).toFixed(2)),
      };
    })
    .filter(c => c.cantidad_terminos > 0);

  return {
    ahorro_estimado: parseFloat(ahorroEstimado.toFixed(2)),
    cantidad_palabras_basura: cantidadPalabrasBasura,
    total_terminos_analizados: terminos.length,
    terminos_protegidos: terminos.filter(t => t.protegido).length,
    terminos,
    tokens,
    categorias,
    marcas_detectadas: marcasTokens,
    tokens_protegidos_por_conversion: tokens
      .filter(t => t.protegido && !marcasTokens.includes(t.token))
      .map(t => t.token),
    generado_en: new Date().toISOString(),
    safe_apply: {
      requiere_confirmacion: true,
      undo_disponible: false,
      nivel_riesgo: "alto",
    },
  };
}

// ============================================================================
// SIMULADOR DE PRESUPUESTO — Proyección matemática con escenarios
// ============================================================================
export type SimuladorRolCampana = "origen" | "destino" | "mantener" | "observar" | "bloqueada";
export type SimuladorConfianza = "alta" | "media" | "baja";
export type SimuladorSaludPresupuesto = "eficiente" | "mejorable" | "ineficiente";
export type SimuladorEscenarioId = "conservador" | "esperado" | "agresivo";

export interface SimuladorCampana {
  campana_id: string;
  nombre: string;
  rol: SimuladorRolCampana;
  presupuesto_actual: number;
  presupuesto_propuesto: number | null;
  gasto_mensual: number;
  conversiones: number;
  cpa_actual: number;
  cpa_objetivo: number;
  score: number;
  tag: ScoreCampanaResult["tag"];
  margen_escalabilidad: number;
  confianza: SimuladorConfianza;
  monto_movimiento: number;
  motivo: string;
}

export interface SimuladorEscenario {
  id: SimuladorEscenarioId;
  label: string;
  presupuesto_reasignable: number;
  inversion_total_estimada: number;
  conversiones_actuales: number;
  conversiones_extra: { pesimista: number; esperado: number; optimista: number };
  cpa_estimado: number;
  confianza: SimuladorConfianza;
  supuestos: string[];
  riesgos: string[];
}

export interface SimuladorPresupuestoReporte {
  version_modelo: string;
  generado_en: string;
  inversion_actual: number;
  conversiones_actuales: number;
  cpa_actual: number;
  salud_presupuesto: SimuladorSaludPresupuesto;
  escenario_recomendado_id: SimuladorEscenarioId;
  escenarios: SimuladorEscenario[];
  campanas: SimuladorCampana[];
  diagnostico: {
    presupuesto_mal_asignado: number;
    presupuesto_escalable: number;
    principal_cuello_botella: string;
  };
  tiene_senal_suficiente: boolean;
  mensaje_resumen: string;
}

const SIMULADOR_VERSION = "1.0.0";

function confianzaCampanaSim(camp: CampanaMora): SimuladorConfianza {
  if (camp.conversiones >= 20 && camp.clics >= 400) return "alta";
  if (camp.conversiones >= 5 && camp.clics >= 100) return "media";
  return "baja";
}

function proyeccionConversionesExtra(
  monto: number,
  cpaDestino: number,
  factorCpa: number
): number {
  if (monto <= 0 || cpaDestino <= 0) return 0;
  const cpaAjustado = cpaDestino * factorCpa;
  return parseFloat((monto / Math.max(cpaAjustado, 0.01)).toFixed(1));
}

export function construirSimuladorPresupuesto(
  datos: DatosAuditoriaInput,
  campanas: CampanaMora[],
  planRobin: RobinHoodPlan
): SimuladorPresupuestoReporte {
  const gastoTotal = datos.gasto_total_cuenta;
  const convTotales = datos.conversiones_totales;
  const cpaActual =
    convTotales > 0 ? gastoTotal / convTotales : datos.cpa_promedio_cuenta;

  const activas = campanasActivasConGasto(campanas);
  const confianzaCuenta = calcularConfianzaRobin(activas);
  const tieneSenal =
    convTotales >= 10 && datos.clics_totales >= 300 && activas.length >= 2;

  const origenIds = new Set(planRobin.origenes.map(o => o.campana_id));
  const destinoId = planRobin.destino?.campana_id ?? null;

  let gastoBasura = 0;
  let gastoEstrella = 0;
  activas.forEach(c => {
    const ev = calcularScoreCampana(c, datos.cpa_promedio_cuenta);
    if (ev.tag === "BASURA") gastoBasura += c.gasto_mensual;
    if (ev.tag === "ESTRELLA") gastoEstrella += c.gasto_mensual;
  });

  let salud: SimuladorSaludPresupuesto = "mejorable";
  if (gastoTotal > 0) {
    const ratioBasura = gastoBasura / gastoTotal;
    const ratioEstrella = gastoEstrella / gastoTotal;
    if (ratioBasura >= 0.3) salud = "ineficiente";
    else if (ratioEstrella >= 0.35) salud = "eficiente";
  }

  const presupuestoMalAsignado = planRobin.presupuesto_rescatable;
  const presupuestoEscalable = planRobin.destino
    ? Math.round(
        planRobin.destino.presupuesto_actual *
          (planRobin.destino.margen_escalabilidad / 100) *
          0.25
      )
    : 0;

  const campanasSim: SimuladorCampana[] = activas.map(camp => {
    const ev = calcularScoreCampana(camp, datos.cpa_promedio_cuenta);
    const margen = margenEscalabilidad(camp);
    const conf = confianzaCampanaSim(camp);
    const cpaObj = cpaObjetivoCampana(camp, datos.cpa_promedio_cuenta);

    let rol: SimuladorRolCampana = "mantener";
    let montoMov = 0;
    let propuesto: number | null = null;
    let motivo = "Rendimiento dentro del rango esperado.";

    if (origenIds.has(camp.id)) {
      const orig = planRobin.origenes.find(o => o.campana_id === camp.id);
      rol = "origen";
      montoMov = -(orig?.monto_recortado ?? 0);
      propuesto = orig?.presupuesto_propuesto ?? camp.presupuesto_mensual;
      motivo = orig?.motivo ?? "Presupuesto recortable por baja eficiencia.";
    } else if (camp.id === destinoId && planRobin.destino) {
      rol = "destino";
      montoMov = planRobin.destino.monto_incrementado;
      propuesto = planRobin.destino.presupuesto_propuesto;
      motivo = planRobin.destino.motivo;
    } else if (ev.tag === "BASURA" && conf !== "baja") {
      rol = "observar";
      motivo = "CPA elevado; conviene monitorear antes de mover presupuesto.";
    } else if (ev.tag === "ESTRELLA" && margen >= 0.15) {
      rol = "observar";
      motivo = "Campaña eficiente con margen de escala detectado.";
    } else if (ev.conversiones < 3 && camp.gasto_mensual > 0) {
      rol = "bloqueada";
      motivo = "Poca data estadística; Mora no proyecta cambios fuertes.";
    }

    return {
      campana_id: camp.id,
      nombre: camp.nombre,
      rol,
      presupuesto_actual: Math.round(camp.presupuesto_mensual),
      presupuesto_propuesto: propuesto,
      gasto_mensual: Math.round(camp.gasto_mensual),
      conversiones: camp.conversiones,
      cpa_actual: ev.cpaActual != null ? parseFloat(ev.cpaActual.toFixed(2)) : 0,
      cpa_objetivo: parseFloat(cpaObj.toFixed(2)),
      score: ev.score ?? 0,
      tag: ev.tag,
      margen_escalabilidad: parseFloat((margen * 100).toFixed(1)),
      confianza: conf,
      monto_movimiento: montoMov,
      motivo,
    };
  });

  const cpaDestino = planRobin.destino?.cpa_actual ?? cpaActual;
  const baseReasignar = planRobin.total_reasignado;

  const factoresEscenario: Record<
    SimuladorEscenarioId,
    { mult: number; label: string; factorCpaPes: number; factorCpaEsp: number; factorCpaOpt: number }
  > = {
    conservador: {
      mult: 0.5,
      label: "Conservador",
      factorCpaPes: 1.25,
      factorCpaEsp: 1.1,
      factorCpaOpt: 1.02,
    },
    esperado: {
      mult: 1,
      label: "Esperado",
      factorCpaPes: 1.15,
      factorCpaEsp: 1,
      factorCpaOpt: 0.95,
    },
    agresivo: {
      mult: 1.2,
      label: "Agresivo",
      factorCpaPes: 1.2,
      factorCpaEsp: 1.05,
      factorCpaOpt: 0.9,
    },
  };

  const escenarios: SimuladorEscenario[] = (
    Object.keys(factoresEscenario) as SimuladorEscenarioId[]
  ).map(id => {
    const cfg = factoresEscenario[id];
    const reasignar = Math.round(
      Math.min(baseReasignar * cfg.mult, planRobin.presupuesto_rescatable)
    );
    const extraPes = proyeccionConversionesExtra(
      reasignar,
      cpaDestino,
      cfg.factorCpaPes
    );
    const extraEsp = proyeccionConversionesExtra(
      reasignar,
      cpaDestino,
      cfg.factorCpaEsp
    );
    const extraOpt = proyeccionConversionesExtra(
      reasignar,
      cpaDestino,
      cfg.factorCpaOpt
    );
    const convEst = convTotales + extraEsp;
    const cpaEst = convEst > 0 ? gastoTotal / convEst : cpaActual;

    const supuestos: string[] = [
      `Proyección basada en CPA histórico de campaña destino (${cpaDestino.toFixed(2)}).`,
      `Reasignación de $${reasignar}/mes desde campañas con baja eficiencia.`,
      `Confianza de cuenta: ${confianzaCuenta}.`,
    ];
    if (!tieneSenal) {
      supuestos.push("Volumen de conversiones/clics limitado; rangos más amplios.");
    }

    const riesgos: string[] = [];
    if (confianzaCuenta === "baja") {
      riesgos.push("Poca data: el CPA real puede variar más de lo estimado.");
    }
    if (reasignar < planRobin.presupuesto_rescatable * 0.5) {
      riesgos.push("Por seguridad, Mora no aplica todo el presupuesto rescatable detectado.");
    }
    if (!planRobin.destino) {
      riesgos.push("No hay campaña destino clara con margen de absorción.");
    }

    return {
      id,
      label: cfg.label,
      presupuesto_reasignable: reasignar,
      inversion_total_estimada: Math.round(gastoTotal),
      conversiones_actuales: convTotales,
      conversiones_extra: {
        pesimista: extraPes,
        esperado: extraEsp,
        optimista: extraOpt,
      },
      cpa_estimado: parseFloat(cpaEst.toFixed(2)),
      confianza: confianzaCuenta,
      supuestos,
      riesgos,
    };
  });

  let escenarioRecomendado: SimuladorEscenarioId = "esperado";
  if (confianzaCuenta === "baja" || !planRobin.aplica) escenarioRecomendado = "conservador";
  else if (salud === "eficiente" && planRobin.aplica) escenarioRecomendado = "agresivo";

  const escRec = escenarios.find(e => e.id === escenarioRecomendado) ?? escenarios[1];
  const extra = escRec.conversiones_extra;

  let cuello = "Distribución de presupuesto entre campañas.";
  if (presupuestoMalAsignado > gastoTotal * 0.15) {
    cuello = "Demasiado gasto en campañas ineficientes.";
  } else if (presupuestoEscalable > 0 && planRobin.destino) {
    cuello = `Capacidad de escala limitada en ${planRobin.destino.nombre}.`;
  } else if (!tieneSenal) {
    cuello = "Falta volumen de conversiones para proyecciones firmes.";
  }

  const mensaje =
    planRobin.aplica && tieneSenal
      ? `Mora estima entre +${extra.pesimista} y +${extra.optimista} conversiones/mes reasignando $${escRec.presupuesto_reasignable}.`
      : tieneSenal
        ? "Hay señal suficiente, pero no se detectó reasignación segura en este ciclo."
        : "Corré más conversiones o ampliá la ventana antes de confiar en proyecciones fuertes.";

  return {
    version_modelo: SIMULADOR_VERSION,
    generado_en: new Date().toISOString(),
    inversion_actual: Math.round(gastoTotal),
    conversiones_actuales: convTotales,
    cpa_actual: parseFloat(cpaActual.toFixed(2)),
    salud_presupuesto: salud,
    escenario_recomendado_id: escenarioRecomendado,
    escenarios,
    campanas: campanasSim,
    diagnostico: {
      presupuesto_mal_asignado: Math.round(presupuestoMalAsignado),
      presupuesto_escalable: presupuestoEscalable,
      principal_cuello_botella: cuello,
    },
    tiene_senal_suficiente: tieneSenal,
    mensaje_resumen: mensaje,
  };
}

// ============================================================================
// FASE 2: EL CEREBRO MATEMÁTICO DETERMINISTA
// ============================================================================
export function generarEsqueletoAuditoria(datos: DatosAuditoriaInput) {
  if (datos.gasto_total_cuenta < 0 || datos.clics_totales < 0 || datos.conversiones_totales < 0) {
    throw new Error("invalid_input_data");
  }

  const campanasLimpias = filtrarCampanasBasura(datos.campanas);
  const terminosCrudos = datos.terminos || [];

  // PASO 0 — MADUREZ ESTADÍSTICA
  let nivelConfianza = "alto";
  let multConfianza = 1.0;
  
  if (datos.conversiones_totales < 15 || datos.clics_totales < 500) {
    nivelConfianza = "bajo";
    multConfianza = 2.0;
  } else if ((datos.conversiones_totales >= 15 && datos.conversiones_totales < 50) || (datos.clics_totales >= 500 && datos.clics_totales < 1500)) {
    nivelConfianza = "medio";
    multConfianza = 1.5;
  }

  // PASO 1 — PERFIL DINÁMICO
  let multGasto = 1.5, multFugaParcial = 1.80;
  
  if (datos.tipo_negocio === "lead_gen") {
    multGasto = 2.0; multFugaParcial = 2.00;
  } else if (datos.tipo_negocio === "high_ticket") {
    multGasto = 3.0; multFugaParcial = 2.50;
  }

  const cvrPromedioCuenta = datos.clics_totales > 0 ? datos.conversiones_totales / datos.clics_totales : null;
  const umbralGastoKeyword = (datos.cpa_promedio_cuenta * multGasto) * multConfianza;
  let umbralClicsKeyword = 100;
  
  if (cvrPromedioCuenta !== null && cvrPromedioCuenta > 0) {
    umbralClicsKeyword = Math.min(250, Math.max(40, (1 / cvrPromedioCuenta) * 2.5) * multConfianza);
  }

  // Variables de recolección
  let gastoDesperdiciadoTotal = 0;
  const fugasCriticas: FugaCritica[] = [];
  const fugasParciales: FugaParcial[] = [];
  const terminosFugaCriticaCrudos: TerminoBusqueda[] = [];
  const hallazgosRojos: HallazgoMora[] = [];
  const hallazgosAmarillos: HallazgoMora[] = [];

  const presupuestoCampanasMap = new Map(campanasLimpias.map(c => [c.id, c.presupuesto_mensual]));

  // Procesamiento de Términos (Generador de Negativos)
  terminosCrudos.forEach(term => {
    const presupuestoCampaña = presupuestoCampanasMap.get(term.id_campana_asociada) || 1000;
    const cumpleReglaA = term.gasto > umbralGastoKeyword;
    const cumpleReglaB = term.clics > umbralClicsKeyword;
    const cumpleReglaC = (term.gasto > umbralGastoKeyword * 0.5) && (term.gasto / presupuestoCampaña > 0.08);

    if (term.conversiones === 0 && (cumpleReglaA || cumpleReglaB || cumpleReglaC)) {
      gastoDesperdiciadoTotal += term.gasto;
      fugasCriticas.push({ termino: term.termino_exacto, gasto: term.gasto, conversiones: 0, justificacion: "Superó límite dinámico de inversión sin retorno.", accion: "Negativizar" });
      terminosFugaCriticaCrudos.push(term);
    }
    else if (term.conversiones >= 1 && term.clics > 20) {
      const cpaTermino = term.gasto / term.conversiones;
      const limiteRentabilidad = datos.cpa_promedio_cuenta * multFugaParcial;

      if (cpaTermino > limiteRentabilidad) {
        const gastoExtra = term.gasto - (term.conversiones * limiteRentabilidad);
        if (gastoExtra > 0) gastoDesperdiciadoTotal += gastoExtra;

        fugasParciales.push({
          termino: term.termino_exacto,
          gasto: term.gasto,
          conversiones: term.conversiones,
          cpa_termino: parseFloat(cpaTermino.toFixed(2)),
          justificacion: `Generó conversiones, pero a un costo inaceptable de $${cpaTermino.toFixed(2)} (límite $${limiteRentabilidad.toFixed(2)}).`,
          accion: "Reducir puja / Revisar"
        });
      }
    }
  });

  // Construcción del Destripador de Búsquedas (objeto enriquecido)
  const destripador = construirDestripador(
    terminosFugaCriticaCrudos,
    construirContextoDestripador(datos, campanasLimpias, terminosCrudos)
  );

  if (fugasCriticas.length > 0) {
    hallazgosRojos.push({
      id_rastreo: "GENERADOR_NEGATIVOS_URGENTE",
      titulo: `Destripador de Búsquedas: ${destripador.terminos.filter(t => !t.protegido).length} términos drenando presupuesto`,
      descripcion_tecnica: "",
      descripcion_simple: ""
    });
  }

  // ========================================================================
  // IMPLEMENTACIÓN DE LA FUNCIÓN 2: ANALIZADOR DE QUALITY SCORE
  // ========================================================================
  campanasLimpias.forEach(camp => {
    // Si Google califica la campaña por debajo de 5, hay un problema grave oculto
    if (camp.quality_score !== undefined && camp.quality_score > 0 && camp.quality_score < 5) {
      const idRastreo = `QS_PENALIZADO_CAMPANA_${camp.id}`;
      
      // Identificamos dinámicamente cuál es el talón de Aquiles para la redacción IA
      let factorFalla = "Rendimiento general";
      if (camp.quality_landing === "BELOW_AVERAGE") factorFalla = "Experiencia de la Página de Destino (Landing Page)";
      else if (camp.quality_relevance === "BELOW_AVERAGE") factorFalla = "Relevancia del Anuncio";
      else if (camp.quality_ctr === "BELOW_AVERAGE") factorFalla = "CTR Esperado inferior a la media";

      hallazgosAmarillos.push({
        id_rastreo: idRastreo,
        titulo: `Quality Score Crítico (${camp.quality_score}/10) en: ${camp.nombre}`,
        descripcion_tecnica: `Falla crítica detectada en componente: ${factorFalla}. El Quality Score de ${camp.quality_score} está inflando el CPC real por penalización de ranking de subasta.`, 
        descripcion_simple: `Google te está cobrando multas ocultas en la campaña ${camp.nombre} porque detectó problemas en: ${factorFalla}.` 
      });
    }
  });

  // PASO 5 — ESTRATEGIA ROBIN HOOD
  const planRobinHood = calcularPlanRobinHood(
    campanasLimpias,
    datos.cpa_promedio_cuenta,
    datos.tipo_negocio,
    datos.gasto_total_cuenta,
    datos.conversiones_totales
  );

  if (
    planRobinHood.estado === "aplicable" &&
    impactoHallazgoEsMaterial(planRobinHood.total_reasignado, datos.gasto_total_cuenta)
  ) {
    hallazgosAmarillos.push({
      id_rastreo: "OPORTUNIDAD_ROBIN_HOOD",
      titulo: "Estrategia Robin Hood: Optimización Presupuestaria",
      descripcion_tecnica: "",
      descripcion_simple: ""
    });
  }

  const simuladorPresupuesto = construirSimuladorPresupuesto(
    datos,
    campanasLimpias,
    planRobinHood
  );

  const impactoSimulador = simuladorPresupuesto.diagnostico.presupuesto_mal_asignado;
  if (
    simuladorPresupuesto.tiene_senal_suficiente &&
    (simuladorPresupuesto.diagnostico.presupuesto_mal_asignado > 0 ||
      simuladorPresupuesto.escenarios.some(e => e.conversiones_extra.esperado > 0)) &&
    impactoHallazgoEsMaterial(impactoSimulador, datos.gasto_total_cuenta)
  ) {
    hallazgosAmarillos.push({
      id_rastreo: "SIMULADOR_PRESUPUESTO",
      titulo: "Simulador de presupuesto: proyección de reasignación",
      descripcion_tecnica: "",
      descripcion_simple: "",
    });
  }

  const dayparting = construirDayparting(
    datos,
    datos.horarios || [],
    multConfianza
  );

  if (
    dayparting.franjas_con_fuga > 0 &&
    impactoHallazgoEsMaterial(dayparting.ahorro_estimado, datos.gasto_total_cuenta)
  ) {
    const tituloDayparting = `Dayparting: ${dayparting.franjas_con_fuga} franja${dayparting.franjas_con_fuga > 1 ? "s" : ""} con fuga horaria`;
    const hallazgoDayparting: HallazgoMora = {
      id_rastreo: "DAYPARTING_FUGAS_HORARIAS",
      titulo: tituloDayparting,
      descripcion_tecnica: "",
      descripcion_simple: "",
    };
    if (dayparting.ahorro_estimado >= datos.gasto_total_cuenta * 0.08) {
      hallazgosRojos.push(hallazgoDayparting);
    } else {
      hallazgosAmarillos.push(hallazgoDayparting);
    }
  }

  // PASO 4 — CALCULO DE HEALTH SCORE (modelo compuesto)
  const porcentajeDesperdiciado = datos.gasto_total_cuenta > 0 ? gastoDesperdiciadoTotal / datos.gasto_total_cuenta : 0;
  const healthScore = calcularHealthScoreCompuesto(
    datos,
    campanasLimpias,
    terminosCrudos,
    nivelConfianza,
    multFugaParcial
  );

  const diagnosticoCuenta = evaluarSaludCuenta({
    health_score: healthScore,
    gasto_desperdiciado: gastoDesperdiciadoTotal,
    gasto_total_cuenta: datos.gasto_total_cuenta,
    porcentaje_desperdiciado: porcentajeDesperdiciado * 100,
    graves_rojo: hallazgosRojos,
    debiles_amarillo: hallazgosAmarillos,
  });

  const campanasSalud: DiagnosticoSaludReporte["campanas"] = {};
  campanasLimpias.forEach(c => {
    campanasSalud[c.id] = evaluarSaludCampana(c, datos.cpa_promedio_cuenta);
  });

  const hallazgosVerdes = construirHallazgosVerdes(
    campanasLimpias,
    datos.cpa_promedio_cuenta,
    diagnosticoCuenta
  );

  return {
    health_score: healthScore,
    cuenta_sin_cambios_urgentes: diagnosticoCuenta.cuenta_sin_cambios_urgentes,
    diagnostico_salud: {
      cuenta: diagnosticoCuenta,
      campanas: campanasSalud,
    } satisfies DiagnosticoSaludReporte,
    perfil_aplicado: {
      nivel_confianza: nivelConfianza,
      tipo_negocio: datos.tipo_negocio,
      UMBRAL_GASTO_KEYWORD: parseFloat(umbralGastoKeyword.toFixed(2)),
      UMBRAL_CLICS_KEYWORD: Math.round(umbralClicsKeyword)
    },
    resumen: {
      gasto_desperdiciado: parseFloat(gastoDesperdiciadoTotal.toFixed(2)),
      porcentaje_desperdiciado: parseFloat((porcentajeDesperdiciado * 100).toFixed(1)),
      fugas_criticas_count: fugasCriticas.length,
      fugas_parciales_count: fugasParciales.length,
      casos_canibalizacion: 0
    },
    fugas_criticas: fugasCriticas,
    fugas_parciales: fugasParciales,
    robin_hood: planRobinHood,
    simulador_presupuesto: simuladorPresupuesto,
    destripador,
    n_gramas: {
      ahorro_estimado: destripador.ahorro_estimado,
      cantidad_palabras: destripador.cantidad_palabras_basura,
      palabras: destripador.tokens
        .filter(t => !t.protegido)
        .slice(0, 12)
        .map(t => t.token),
    },
    ngramas: {
      tokens_toxicos: destripador.tokens.filter(t => !t.protegido).map(t => t.token),
      tokens_estrella: [],
    },
    dayparting,
    canibalizacion: [],
    hallazgos: {
      graves_rojo: hallazgosRojos,
      debiles_amarillo: hallazgosAmarillos,
      bien_verde: hallazgosVerdes,
    },
    checklist: [],
    advertencias: []
  };
}