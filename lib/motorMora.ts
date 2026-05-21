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

  // PASO 4 — CALCULO DE HEALTH SCORE
  const porcentajeDesperdiciado = datos.gasto_total_cuenta > 0 ? gastoDesperdiciadoTotal / datos.gasto_total_cuenta : 0;
  const penalizacionBase = porcentajeDesperdiciado * 200;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalizacionBase)));

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