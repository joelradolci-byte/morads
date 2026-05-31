/**
 * Evaluación determinística de salud (cuenta y campaña).
 * El motor decide si hay acción obligatoria; la IA solo redacta.
 */

import {
  calcularScoreCampana,
  type CampanaMora,
  type ScoreCampanaResult,
} from "./motorMora";

export type NivelSalud = "optima" | "estable" | "mejorable" | "critica";
export type IntensidadOpcional = "ninguna" | "baja" | "media";

/** Badge / chip corto en UI (cuenta o campaña saludable) */
export function etiquetaBadgeSalud(nivel: NivelSalud): string {
  switch (nivel) {
    case "optima":
      return "En excelente estado";
    case "estable":
      return "En buen estado";
    case "mejorable":
      return "Mejorable";
    case "critica":
      return "Crítico";
  }
}

/** Chip del resumen fácil según score de cuenta */
export function etiquetaChipCuenta(score: number, nivel?: NivelSalud): string {
  if (nivel === "optima" || score >= 92) return "Excelente";
  if (nivel === "estable" || score >= 75) return "Estable";
  if (score >= 50) return "Atención";
  return "Crítico";
}

export function tituloCampanaSaludable(nombre: string, nivel: NivelSalud): string {
  if (nivel === "optima") return `Campaña en excelente estado: ${nombre}`;
  return `Campaña en buen estado: ${nombre}`;
}

export function tituloSeccionSaludable(nivel: NivelSalud): string {
  return nivel === "optima" ? "Por qué está excelente" : "Por qué está bien";
}

/** % del gasto de cuenta para considerar desperdicio material */
export const UMBRAL_DESPERDICIO_PCT = 3;
/** Monto mínimo en USD para desperdicio material */
export const UMBRAL_DESPERDICIO_USD = 25;
/** % del gasto para impacto mínimo de hallazgos amarillos opcionales */
export const UMBRAL_IMPACTO_HALLAZGO_PCT = 0.03;

export type DiagnosticoSaludCuenta = {
  nivel: NivelSalud;
  health_score: number;
  requiere_accion: boolean;
  cuenta_sin_cambios_urgentes: boolean;
  gasto_desperdiciado: number;
  porcentaje_desperdiciado: number;
  hallazgos_accionables: number;
  razones: string[];
  mensaje_plantilla_id: string;
};

export type DiagnosticoSaludCampana = {
  campana_id: string;
  nombre: string;
  score: number;
  tag: ScoreCampanaResult["tag"];
  nivel: NivelSalud;
  requiere_accion: boolean;
  intensidad_escala_opcional: IntensidadOpcional;
  razones: string[];
  sugerencia_principal: string | null;
  nota_escala_opcional: string | null;
  titulo_detalle: string;
  problema_detalle: string;
  razonamiento: string;
  resultado_esperado: string;
};

export type DiagnosticoSaludReporte = {
  cuenta: DiagnosticoSaludCuenta;
  campanas: Record<string, DiagnosticoSaludCampana>;
};

function cpaObjetivo(camp: CampanaMora, cpaPromedioCuenta: number): number {
  return camp.cpa_objetivo != null && camp.cpa_objetivo > 0
    ? camp.cpa_objetivo
    : cpaPromedioCuenta;
}

function margenEscalabilidad(camp: CampanaMora): number {
  const valor =
    camp.search_lost_is_budget ??
    camp.cuota_impresiones_perdida_presupuesto ??
    camp.impression_share_lost_budget;
  if (valor !== undefined && !Number.isNaN(valor)) {
    const n = valor > 1 ? valor / 100 : valor;
    return Math.max(0, Math.min(1, n));
  }
  if (camp.presupuesto_mensual <= 0) return 0;
  const ejecucion = camp.gasto_mensual / camp.presupuesto_mensual;
  if (ejecucion >= 0.95) return 0.35;
  if (ejecucion >= 0.85) return 0.22;
  if (ejecucion >= 0.75) return 0.12;
  return 0;
}

function notaEscalarOpcional(
  intensidad: IntensidadOpcional,
  camp: CampanaMora,
  cpaActual: number,
  cpaObj: number
): string | null {
  if (intensidad === "ninguna") return null;
  const margen = margenEscalabilidad(camp);
  const tieneMargen = margen >= 0.1;
  if (intensidad === "baja") {
    if (!tieneMargen) {
      return "Si en el futuro buscás más volumen, podés revisar el presupuesto; hoy no es necesario para mantener el rendimiento.";
    }
    return `Opcional: podrías escalar presupuesto solo si querés más volumen (CPA $${cpaActual.toFixed(2)} vs objetivo $${cpaObj.toFixed(2)}). No es un arreglo urgente.`;
  }
  if (!tieneMargen) {
    return "Podés considerar un leve aumento de presupuesto si querés crecer, pero la campaña ya rinde bien sin tocarla.";
  }
  return `Opcional: hay margen para escalar inversión (CPA $${cpaActual.toFixed(2)} vs objetivo $${cpaObj.toFixed(2)}). No es obligatorio: la campaña ya rinde bien sin tocarla.`;
}

function nivelDesdeScoreCampana(
  score: number | null,
  tag: ScoreCampanaResult["tag"],
  requiere_accion: boolean
): NivelSalud {
  if (tag === "SIN_DATOS") return "estable";
  const s = score ?? 0;
  if (requiere_accion) {
    if (tag === "BASURA" || s < 55) return "critica";
    return "mejorable";
  }
  if (s >= 92 && tag === "ESTRELLA") return "optima";
  if (s >= 75) return "estable";
  return "mejorable";
}

export function evaluarSaludCampana(
  camp: CampanaMora,
  cpaPromedioCuenta: number
): DiagnosticoSaludCampana {
  const ev = calcularScoreCampana(camp, cpaPromedioCuenta);
  const cpaObj = cpaObjetivo(camp, cpaPromedioCuenta);
  const { score, tag, penalizacion, cpaActual, gasto, presupuesto, conversiones } = ev;

  if (tag === "SIN_DATOS") {
    return {
      campana_id: camp.id,
      nombre: camp.nombre,
      score: 0,
      tag,
      nivel: "estable",
      requiere_accion: false,
      intensidad_escala_opcional: "ninguna",
      razones: [
        penalizacion,
        "Sin clics, gasto ni conversiones en los últimos 30 días.",
        `Presupuesto mensual $${Math.round(presupuesto).toLocaleString()}.`,
      ],
      sugerencia_principal: null,
      nota_escala_opcional: null,
      titulo_detalle: `${camp.nombre}: sin datos suficientes`,
      problema_detalle: penalizacion,
      razonamiento:
        "No hay señal de rendimiento en el período. Activá la campaña o esperá tráfico antes de evaluar CPA y score.",
      resultado_esperado:
        "Acumular impresiones y clics para poder auditar con confianza.",
    };
  }

  const razones: string[] = [
    `Score de salud ${score ?? "—"}/100 (${tag}).`,
    penalizacion,
    cpaActual != null
      ? `CPA actual $${cpaActual.toFixed(2)} vs objetivo $${cpaObj.toFixed(2)}.`
      : `CPA sin calcular; objetivo $${cpaObj.toFixed(2)}.`,
    `Conversiones: ${conversiones}; gasto mensual $${Math.round(gasto).toLocaleString()} de presupuesto $${Math.round(presupuesto).toLocaleString()}.`,
  ];

  let requiere_accion = false;
  let sugerencia_principal: string | null = null;
  let intensidad_escala_opcional: IntensidadOpcional = "ninguna";
  let resultado_esperado =
    "Mantener el rendimiento actual sin cambios obligatorios en la plataforma.";

  if (tag === "BASURA" || (score != null && score < 55)) {
    requiere_accion = true;
    sugerencia_principal =
      tag === "BASURA" && conversiones === 0
        ? "Pausar temporalmente o reducir gasto hasta validar intención de búsqueda."
        : "Reducir gasto o pausar y revisar términos de búsqueda y puja.";
    resultado_esperado = "Cortar gasto ineficiente y recuperar eficiencia de CPA.";
  } else if (tag === "DUDOSO" || (score != null && score >= 55 && score < 80)) {
    requiere_accion = true;
    sugerencia_principal = "Revisar términos de búsqueda, anuncios y puja antes de escalar.";
    resultado_esperado = "Mejorar CPA y estabilizar conversiones.";
  } else if (tag === "POTENCIAL" || tag === "EVALUANDO") {
    requiere_accion = false;
    sugerencia_principal = null;
    razones.push("Poca data estadística: conviene monitorear antes de cambios fuertes.");
    resultado_esperado = "Acumular conversiones para decidir con confianza.";
  } else if (tag === "ESTRELLA") {
    requiere_accion = false;
    sugerencia_principal = null;
    if (score != null && score >= 92) {
      intensidad_escala_opcional = "baja";
      resultado_esperado =
        "Mantener configuración actual; el rendimiento está alineado con el objetivo.";
    } else if (score != null && score >= 80) {
      intensidad_escala_opcional = "media";
      resultado_esperado =
        "Seguir monitoreando; el rendimiento es bueno y no exige correcciones urgentes.";
    } else {
      intensidad_escala_opcional = "ninguna";
    }
  } else {
    requiere_accion = score != null && score < 65;
    sugerencia_principal = requiere_accion
      ? "Revisar configuración de la campaña en Google Ads."
      : null;
  }

  const nivel = nivelDesdeScoreCampana(score, tag, requiere_accion);
  const nota_escala_opcional =
    cpaActual != null
      ? notaEscalarOpcional(intensidad_escala_opcional, camp, cpaActual, cpaObj)
      : null;

  const titulo_detalle =
    !requiere_accion && (nivel === "optima" || nivel === "estable")
      ? tituloCampanaSaludable(camp.nombre, nivel)
      : `Campaña ${tag}: ${camp.nombre}`;

  const problema_detalle = requiere_accion
    ? penalizacion
    : nivel === "optima"
      ? `No necesitás cambios urgentes: la campaña está en excelente estado. ${penalizacion}`
      : `No necesitás cambios urgentes en esta campaña. ${penalizacion}`;

  const razonamiento = requiere_accion
    ? cpaActual != null
      ? `El CPA de esta campaña es de $${cpaActual.toFixed(2)}, mientras que el objetivo es $${cpaObj.toFixed(2)}.`
      : `La campaña no cumple el objetivo de eficiencia (objetivo $${cpaObj.toFixed(2)}).`
    : cpaActual != null
      ? `Rinde dentro del objetivo (CPA $${cpaActual.toFixed(2)} vs $${cpaObj.toFixed(2)}) con score ${score ?? "—"}/100.`
      : `Score ${score ?? "—"}/100; revisar métricas cuando haya más tráfico.`;

  return {
    campana_id: camp.id,
    nombre: camp.nombre,
    score: score ?? 0,
    tag,
    nivel,
    requiere_accion,
    intensidad_escala_opcional,
    razones,
    sugerencia_principal,
    nota_escala_opcional,
    titulo_detalle,
    problema_detalle,
    razonamiento,
    resultado_esperado,
  };
}

export function gastoDesperdiciadoEsMaterial(
  gastoDesperdiciado: number,
  gastoTotalCuenta: number
): boolean {
  if (gastoDesperdiciado < UMBRAL_DESPERDICIO_USD) return false;
  if (gastoTotalCuenta <= 0) return gastoDesperdiciado >= UMBRAL_DESPERDICIO_USD;
  const pct = (gastoDesperdiciado / gastoTotalCuenta) * 100;
  return pct >= UMBRAL_DESPERDICIO_PCT;
}

export function impactoHallazgoEsMaterial(
  impactoEstimado: number,
  gastoTotalCuenta: number
): boolean {
  if (impactoEstimado < UMBRAL_DESPERDICIO_USD) return false;
  if (gastoTotalCuenta <= 0) return impactoEstimado >= UMBRAL_DESPERDICIO_USD;
  return impactoEstimado / gastoTotalCuenta >= UMBRAL_IMPACTO_HALLAZGO_PCT;
}

type HallazgoMinimo = {
  id_rastreo: string;
  titulo: string;
  descripcion_tecnica?: string;
  descripcion_simple?: string;
};

export function construirHallazgosVerdes(
  campanas: CampanaMora[],
  cpaPromedioCuenta: number,
  diagnosticoCuenta: DiagnosticoSaludCuenta
): HallazgoMinimo[] {
  const verdes: HallazgoMinimo[] = [];

  if (diagnosticoCuenta.cuenta_sin_cambios_urgentes) {
    verdes.push({
      id_rastreo: "CUENTA_SALUDABLE",
      titulo:
        diagnosticoCuenta.nivel === "optima"
          ? "Cuenta en excelente estado"
          : "Cuenta estable sin cambios urgentes",
      descripcion_tecnica: diagnosticoCuenta.razones.join(" "),
      descripcion_simple:
        diagnosticoCuenta.nivel === "optima"
          ? "No hace falta corregir nada urgente. Tu cuenta está muy bien."
          : "No hay urgencias. Seguí monitoreando con calma.",
    });
  }

  campanas.forEach(camp => {
    const d = evaluarSaludCampana(camp, cpaPromedioCuenta);
    if (!d.requiere_accion && (d.nivel === "optima" || d.nivel === "estable")) {
      verdes.push({
        id_rastreo: `CAMPANA_SALUDABLE_${camp.id}`,
        titulo: `Buen rendimiento: ${camp.nombre}`,
        descripcion_tecnica: d.razones.join(" "),
        descripcion_simple: d.problema_detalle,
      });
    }
  });

  return verdes;
}

export function evaluarSaludCuenta(params: {
  health_score: number;
  gasto_desperdiciado: number;
  gasto_total_cuenta: number;
  porcentaje_desperdiciado: number;
  graves_rojo: unknown[];
  debiles_amarillo: unknown[];
}): DiagnosticoSaludCuenta {
  const {
    health_score,
    gasto_desperdiciado,
    gasto_total_cuenta,
    porcentaje_desperdiciado,
    graves_rojo,
    debiles_amarillo,
  } = params;

  const hallazgos_accionables = graves_rojo.length + debiles_amarillo.length;
  const desperdicioMaterial = gastoDesperdiciadoEsMaterial(
    gasto_desperdiciado,
    gasto_total_cuenta
  );
  const requiere_accion =
    graves_rojo.length > 0 || desperdicioMaterial || health_score < 65;

  const cuenta_sin_cambios_urgentes =
    !requiere_accion && hallazgos_accionables === 0 && health_score >= 75;

  let nivel: NivelSalud = "mejorable";
  if (requiere_accion) {
    nivel = health_score < 50 || graves_rojo.length > 0 ? "critica" : "mejorable";
  } else if (health_score >= 92 && !desperdicioMaterial) {
    nivel = "optima";
  } else if (health_score >= 75) {
    nivel = "estable";
  }

  const razones: string[] = [
    `Health score de cuenta: ${health_score}/100.`,
    `Gasto con señal de desperdicio: $${Math.round(gasto_desperdiciado).toLocaleString()} (${porcentaje_desperdiciado.toFixed(1)}% del gasto).`,
    `Hallazgos accionables: ${hallazgos_accionables} (${graves_rojo.length} críticos, ${debiles_amarillo.length} mejoras).`,
  ];

  if (cuenta_sin_cambios_urgentes) {
    razones.push(
      nivel === "optima"
        ? "No se detectaron fugas materiales ni hallazgos urgentes."
        : "La cuenta está en buen estado; no hay correcciones obligatorias ahora."
    );
  } else if (requiere_accion) {
    razones.push("Hay señales que conviene atender en Google Ads.");
  }

  const mensaje_plantilla_id = cuenta_sin_cambios_urgentes
    ? nivel === "optima"
      ? "cuenta_optima"
      : "cuenta_estable"
    : requiere_accion
      ? "cuenta_requiere_accion"
      : "cuenta_mejorable";

  return {
    nivel,
    health_score,
    requiere_accion,
    cuenta_sin_cambios_urgentes,
    gasto_desperdiciado,
    porcentaje_desperdiciado,
    hallazgos_accionables,
    razones,
    mensaje_plantilla_id,
  };
}

/** Arma payload de detalle para abrir desde el gestor de campañas */
export function detalleHallazgoDesdeCampana(
  camp: CampanaMora,
  cpaPromedioCuenta: number
): {
  id_rastreo: string;
  titulo: string;
  tipo: "critico" | "mejora" | "saludable";
  problema_detalle: string;
  sugerencia: string;
  razonamiento: string;
  resultado_esperado: string;
  nota_escala_opcional: string | null;
  sin_accion_requerida: boolean;
  nivel_salud: NivelSalud;
} {
  const d = evaluarSaludCampana(camp, cpaPromedioCuenta);
  return {
    id_rastreo: `campana_${camp.id}`,
    titulo: d.titulo_detalle,
    tipo: d.requiere_accion ? (d.tag === "BASURA" ? "critico" : "mejora") : "saludable",
    nivel_salud: d.nivel,
    problema_detalle: d.problema_detalle,
    sugerencia: d.sugerencia_principal ?? "No hace falta cambiar nada por ahora.",
    razonamiento: d.razonamiento,
    resultado_esperado: d.resultado_esperado,
    nota_escala_opcional: d.nota_escala_opcional,
    sin_accion_requerida: !d.requiere_accion,
  };
}
