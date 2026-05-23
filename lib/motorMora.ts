// /lib/motorMora.ts

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
  cpa_actual: number;
  cpa_objetivo?: number;
  // LO NUEVO: Campos para el Analizador de Quality Score
  quality_score?: number;
  quality_ctr?: string;
  quality_relevance?: string;
  quality_landing?: string;
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
  const objetivo = cpaObjetivoCampana(camp, cpaPromedioCuenta);
  if (objetivo <= 0) return 1;
  if (camp.conversiones === 0 && camp.gasto_mensual > objetivo * 1.5) return 3;
  return camp.cpa_actual / objetivo;
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
  score: number;
  tag: "ESTRELLA" | "BASURA" | "POTENCIAL" | "DUDOSO" | "EVALUANDO";
  penalizacion: string;
  cpaActual: number;
  gasto: number;
  presupuesto: number;
  conversiones: number;
}

export function calcularScoreCampana(camp: CampanaMora, cpaPromedioCuenta = 20): ScoreCampanaResult {
  const gasto = camp.gasto_mensual || 0;
  const presupuesto = camp.presupuesto_mensual || 0;
  const conversiones = camp.conversiones || 0;
  const cpaObjetivo = cpaObjetivoCampana(camp, cpaPromedioCuenta);
  const cpaActual = camp.cpa_actual ?? (conversiones > 0 ? gasto / conversiones : gasto > 0 ? 9999 : 0);

  const hoy = new Date();
  const diaActual = hoy.getDate();
  const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const fraccionMes = diaActual / diasMes;

  let cpaPenalty = 0;
  if (conversiones === 0 && gasto > cpaObjetivo * 1.5) {
    cpaPenalty = 45;
  } else if (conversiones > 0) {
    cpaPenalty = severidadRatioCpa(cpaActual / cpaObjetivo) * 45;
  } else if (gasto > 0) {
    cpaPenalty = 8;
  }

  let wastePenalty = 0;
  if (conversiones === 0 && gasto > cpaObjetivo * 1.5) {
    wastePenalty = clamp((gasto / Math.max(presupuesto, cpaObjetivo * 3, 1)) * 25, 10, 25);
  } else if (conversiones > 0 && cpaActual > cpaObjetivo * 1.2) {
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
  } else if (score >= 80 && conversiones >= 3 && cpaActual <= cpaObjetivo) {
    tag = "ESTRELLA";
    penalizacion = "CPA por debajo del objetivo. Oportunidad de escalar.";
  } else if (conversiones < 3 && score >= 55 && gasto <= presupuesto * 0.5) {
    tag = "POTENCIAL";
    penalizacion = "Poca data estadística. Monitorear evolución.";
  } else if (score < 40 || (conversiones >= 3 && cpaActual > cpaObjetivo * 1.3)) {
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
    const esMala =
      (camp.conversiones >= 3 && camp.cpa_actual > objetivo * 1.2) ||
      (camp.conversiones === 0 && camp.gasto_mensual > objetivo * 1.5);
    const esBuena = camp.conversiones >= 3 && camp.cpa_actual <= objetivo * 0.9;

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
  let multGasto = 1.5, multRobinOrigen = 1.25, multRobinDestino = 0.80, multFugaParcial = 1.80;
  
  if (datos.tipo_negocio === "lead_gen") {
    multGasto = 2.0; multRobinOrigen = 1.35; multRobinDestino = 0.82; multFugaParcial = 2.00;
  } else if (datos.tipo_negocio === "high_ticket") {
    multGasto = 3.0; multRobinOrigen = 1.50; multRobinDestino = 0.75; multFugaParcial = 2.50;
  }

  const cvrPromedioCuenta = datos.clics_totales > 0 ? datos.conversiones_totales / datos.clics_totales : null;
  const umbralGastoKeyword = (datos.cpa_promedio_cuenta * multGasto) * multConfianza;
  let umbralClicsKeyword = 100;
  
  if (cvrPromedioCuenta !== null && cvrPromedioCuenta > 0) {
    umbralClicsKeyword = Math.min(250, Math.max(40, (1 / cvrPromedioCuenta) * 2.5) * multConfianza);
  }

  const cpaLimiteSuperior = datos.cpa_promedio_cuenta * multRobinOrigen;
  const cpaLimiteInferior = datos.cpa_promedio_cuenta * multRobinDestino;
  const umbralEjecucionPresupuesto = 0.85;

  // Variables de recolección
  let gastoDesperdiciadoTotal = 0;
  let fugasCriticas: any[] = [];
  let fugasParciales: any[] = [];
  let tokensToxicos: string[] = [];
  let hallazgosRojos: any[] = [];
  let hallazgosAmarillos: any[] = [];

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

      const palabras = term.termino_exacto.toLowerCase().split(" ");
      const disparadoresToxicos = ["gratis", "pdf", "barata", "barato", "descargar"];
      palabras.forEach(palabra => {
        if (disparadoresToxicos.includes(palabra) && !tokensToxicos.includes(palabra)) {
          tokensToxicos.push(palabra);
        }
      });
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

  if (fugasCriticas.length > 0) {
    hallazgosRojos.push({
      id_rastreo: "GENERADOR_NEGATIVOS_URGENTE",
      titulo: `Generador de Negativos: ${fugasCriticas.length} Fugas Críticas`,
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
      
      // Identificamos dinámicamente cuál es el talón de Aquiles para guiar a Gemini
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
  let campanasOrigen: string[] = [];
  let campanasDestino: string[] = [];
  let presupuestoRescatable = 0;

  campanasLimpias.forEach(camp => {
    const ejecucion = camp.presupuesto_mensual > 0 ? camp.gasto_mensual / camp.presupuesto_mensual : 0;
    
    if (camp.cpa_actual > cpaLimiteSuperior && ejecucion > 0.20) {
      campanasOrigen.push(camp.nombre);
      presupuestoRescatable += (camp.gasto_mensual * 0.30);
    } else if (camp.conversiones > 0 && camp.cpa_actual < cpaLimiteInferior && ejecucion > umbralEjecucionPresupuesto) {
      campanasDestino.push(camp.nombre);
    }
  });

  const aplicaRobinHood = campanasOrigen.length > 0 && campanasDestino.length > 0;
  if (aplicaRobinHood) {
    hallazgosAmarillos.push({
      id_rastreo: "OPORTUNIDAD_ROBIN_HOOD",
      titulo: "Estrategia Robin Hood: Optimización Presupuestaria",
      descripcion_tecnica: "", 
      descripcion_simple: ""   
    });
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

  return {
    health_score: healthScore,
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
    robin_hood: {
      aplica: aplicaRobinHood,
      campanas_origen: campanasOrigen,
      campanas_destino: campanasDestino,
      justificacion: aplicaRobinHood ? `Se detectaron $${presupuestoRescatable.toFixed(2)} reasignables desde campañas ineficientes.` : "Condiciones no cumplidas."
    },
    ngramas: { tokens_toxicos: tokensToxicos, tokens_estrella: [] },
    dayparting: { horas_toxicas: [], horas_estrella: [] },
    canibalizacion: [],
    hallazgos: {
      graves_rojo: hallazgosRojos,
      debiles_amarillo: hallazgosAmarillos,
      bien_verde: []
    },
    checklist: [],
    advertencias: []
  };
}