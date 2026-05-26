import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
} from "@google/generative-ai";
import { NextResponse } from "next/server";
// Importamos tu nuevo cerebro matemático
import { generarEsqueletoAuditoria, DatosAuditoriaInput } from "@/lib/motorMora"; 
// Importamos el extractor de términos de búsqueda simulados
import { extraerTerminosGoogle, extraerDatosHorariosGoogle } from "@/lib/googleAds"; 

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_DELAY_MS = 2000;
/** Límite de hallazgos enviados a Gemini (free tier / pruebas). El reporte completo conserva todos. */
const GEMINI_CAP_HALLAZGOS = { graves_rojo: 3, debiles_amarillo: 3, bien_verde: 2 } as const;
const MENSAJE_GEMINI_NO_DISPONIBLE =
  "El análisis no está disponible en este momento. Intentá de nuevo en unos minutos.";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type HallazgoGemini = {
  id_rastreo: string;
  titulo: string;
  descripcion_tecnica?: string;
  descripcion_simple?: string;
};

function asHallazgoArray(value: unknown): HallazgoGemini[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is HallazgoGemini =>
        !!item && typeof item === "object" && typeof (item as HallazgoGemini).id_rastreo === "string"
    );
  }
  if (value && typeof value === "object" && typeof (value as HallazgoGemini).id_rastreo === "string") {
    return [value as HallazgoGemini];
  }
  return [];
}

/** Evita que Gemini pise un hallazgo con un bloque gigante o desordene el array. */
function pickDescripcionGemini(nueva: unknown, previa: unknown): string {
  const n = typeof nueva === "string" ? nueva.trim() : "";
  const p = typeof previa === "string" ? previa.trim() : "";
  if (!n) return p;
  if (n.length > 400) return p;
  return n;
}

function mergeHallazgosConGemini<T extends HallazgoGemini>(originales: T[], desdeGemini: unknown): T[] {
  const geminiList = asHallazgoArray(desdeGemini);
  const porId = new Map(geminiList.map(g => [g.id_rastreo, g]));
  return originales.map(orig => {
    const g = porId.get(orig.id_rastreo);
    if (!g) return orig;
    return {
      ...orig,
      titulo: orig.titulo,
      id_rastreo: orig.id_rastreo,
      descripcion_tecnica: pickDescripcionGemini(g.descripcion_tecnica, orig.descripcion_tecnica),
      descripcion_simple: pickDescripcionGemini(g.descripcion_simple, orig.descripcion_simple),
    };
  });
}

async function generateContentWithRetry(
  model: GenerativeModel,
  prompt: string
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
      console.warn(`[audit] Gemini intento ${attempt}/${GEMINI_MAX_ATTEMPTS} falló:`, error);
      if (attempt < GEMINI_MAX_ATTEMPTS) {
        await sleep(GEMINI_RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}

// ============================================================================
// SCHEMA LIVIANO PARA GEMINI — Solo redacta hallazgos.
// El resto (destripador, n_gramas, robin_hood, etc.) viaja por fuera y
// se reinyecta tras la respuesta para mantener la estructura completa.
// ============================================================================
const itemHallazgoProperties = {
  id_rastreo: { type: SchemaType.STRING },
  titulo: { type: SchemaType.STRING },
  descripcion_tecnica: { type: SchemaType.STRING },
  descripcion_simple: { type: SchemaType.STRING },
};

const schemaHallazgos = {
  type: SchemaType.OBJECT,
  properties: {
    hallazgos: {
      type: SchemaType.OBJECT,
      properties: {
        graves_rojo: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.OBJECT, properties: itemHallazgoProperties },
        },
        debiles_amarillo: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.OBJECT, properties: itemHallazgoProperties },
        },
        bien_verde: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.OBJECT, properties: itemHallazgoProperties },
        },
      },
    },
  },
  required: ["hallazgos"],
};

// El esquema JSON completo se mantiene como referencia legacy (no se manda a Gemini).
const schemaMora = {
  type: SchemaType.OBJECT,
  properties: {
    health_score: { type: SchemaType.NUMBER },
    perfil_aplicado: { 
      type: SchemaType.OBJECT,
      properties: {
        nivel_confianza: { type: SchemaType.STRING },
        tipo_negocio: { type: SchemaType.STRING },
        UMBRAL_GASTO_KEYWORD: { type: SchemaType.NUMBER },
        UMBRAL_CLICS_KEYWORD: { type: SchemaType.NUMBER }
      }
    },
    resumen: {
      type: SchemaType.OBJECT,
      properties: {
        gasto_desperdiciado: { type: SchemaType.NUMBER },
        porcentaje_desperdiciado: { type: SchemaType.NUMBER },
        fugas_criticas_count: { type: SchemaType.NUMBER },
        fugas_parciales_count: { type: SchemaType.NUMBER },
        cases_canibalizacion: { type: SchemaType.NUMBER }
      }
    },
    fugas_criticas: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          termino: { type: SchemaType.STRING },
          gasto: { type: SchemaType.NUMBER },
          conversiones: { type: SchemaType.NUMBER },
          justificacion: { type: SchemaType.STRING },
          accion: { type: SchemaType.STRING }
        }
      }
    },
    fugas_parciales: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          termino: { type: SchemaType.STRING },
          gasto: { type: SchemaType.NUMBER },
          conversiones: { type: SchemaType.NUMBER },
          cpa_termino: { type: SchemaType.NUMBER },
          justificacion: { type: SchemaType.STRING },
          accion: { type: SchemaType.STRING }
        }
      }
    },
    robin_hood: {
      type: SchemaType.OBJECT,
      properties: {
        aplica: { type: SchemaType.BOOLEAN },
        estado: { type: SchemaType.STRING },
        confianza: { type: SchemaType.STRING },
        campanas_origen: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        campanas_destino: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        presupuesto_rescatable: { type: SchemaType.NUMBER },
        total_reasignado: { type: SchemaType.NUMBER },
        justificacion: { type: SchemaType.STRING },
        origenes: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              campana_id: { type: SchemaType.STRING },
              nombre: { type: SchemaType.STRING },
              presupuesto_actual: { type: SchemaType.NUMBER },
              presupuesto_propuesto: { type: SchemaType.NUMBER },
              monto_recortado: { type: SchemaType.NUMBER },
              cpa_actual: { type: SchemaType.NUMBER },
              cpa_objetivo: { type: SchemaType.NUMBER },
              motivo: { type: SchemaType.STRING }
            }
          }
        },
        destino: {
          type: SchemaType.OBJECT,
          properties: {
            campana_id: { type: SchemaType.STRING },
            nombre: { type: SchemaType.STRING },
            presupuesto_actual: { type: SchemaType.NUMBER },
            presupuesto_propuesto: { type: SchemaType.NUMBER },
            monto_incrementado: { type: SchemaType.NUMBER },
            cpa_actual: { type: SchemaType.NUMBER },
            cpa_objetivo: { type: SchemaType.NUMBER },
            margen_escalabilidad: { type: SchemaType.NUMBER },
            score_escalabilidad: { type: SchemaType.NUMBER },
            conversiones_extra_estimadas: { type: SchemaType.NUMBER },
            motivo: { type: SchemaType.STRING }
          }
        },
        destinos_backup: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              campana_id: { type: SchemaType.STRING },
              nombre: { type: SchemaType.STRING },
              presupuesto_actual: { type: SchemaType.NUMBER },
              presupuesto_propuesto: { type: SchemaType.NUMBER },
              monto_incrementado: { type: SchemaType.NUMBER },
              cpa_actual: { type: SchemaType.NUMBER },
              cpa_objetivo: { type: SchemaType.NUMBER },
              margen_escalabilidad: { type: SchemaType.NUMBER },
              score_escalabilidad: { type: SchemaType.NUMBER },
              conversiones_extra_estimadas: { type: SchemaType.NUMBER },
              motivo: { type: SchemaType.STRING }
            }
          }
        },
        proyeccion: {
          type: SchemaType.OBJECT,
          properties: {
            conversiones_extra_mensuales: { type: SchemaType.NUMBER },
            cpa_global_actual: { type: SchemaType.NUMBER },
            cpa_global_estimado: { type: SchemaType.NUMBER },
            reduccion_cpa_global_pct: { type: SchemaType.NUMBER },
            supuesto: { type: SchemaType.STRING }
          }
        },
        bloqueos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        safe_apply: {
          type: SchemaType.OBJECT,
          properties: {
            requiere_confirmacion: { type: SchemaType.BOOLEAN },
            undo_disponible: { type: SchemaType.BOOLEAN },
            rollback_compensatorio: { type: SchemaType.BOOLEAN }
          }
        }
      }
    },
    ngramas: {
      type: SchemaType.OBJECT,
      properties: {
        tokens_toxicos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        tokens_estrella: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      }
    },
    n_gramas: {
      type: SchemaType.OBJECT,
      properties: {
        ahorro_estimado: { type: SchemaType.NUMBER },
        cantidad_palabras: { type: SchemaType.NUMBER },
        palabras: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      }
    },
    destripador: {
      type: SchemaType.OBJECT,
      properties: {
        ahorro_estimado: { type: SchemaType.NUMBER },
        cantidad_palabras_basura: { type: SchemaType.NUMBER },
        total_terminos_analizados: { type: SchemaType.NUMBER },
        terminos_protegidos: { type: SchemaType.NUMBER },
        marcas_detectadas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        tokens_protegidos_por_conversion: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        generado_en: { type: SchemaType.STRING },
        safe_apply: {
          type: SchemaType.OBJECT,
          properties: {
            requiere_confirmacion: { type: SchemaType.BOOLEAN },
            undo_disponible: { type: SchemaType.BOOLEAN },
            nivel_riesgo: { type: SchemaType.STRING }
          }
        },
        categorias: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              label: { type: SchemaType.STRING },
              cantidad_terminos: { type: SchemaType.NUMBER },
              ahorro: { type: SchemaType.NUMBER }
            }
          }
        },
        terminos: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              termino: { type: SchemaType.STRING },
              gasto: { type: SchemaType.NUMBER },
              clics: { type: SchemaType.NUMBER },
              conversiones: { type: SchemaType.NUMBER },
              campana_id: { type: SchemaType.STRING },
              campana_nombre: { type: SchemaType.STRING },
              categoria_intencion: { type: SchemaType.STRING },
              match_recomendado: { type: SchemaType.STRING },
              motivo: { type: SchemaType.STRING },
              protegido: { type: SchemaType.BOOLEAN },
              motivo_proteccion: { type: SchemaType.STRING }
            }
          }
        },
        tokens: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              token: { type: SchemaType.STRING },
              apariciones: { type: SchemaType.NUMBER },
              gasto_total: { type: SchemaType.NUMBER },
              ejemplo_termino: { type: SchemaType.STRING },
              categoria_intencion: { type: SchemaType.STRING },
              protegido: { type: SchemaType.BOOLEAN },
              motivo_proteccion: { type: SchemaType.STRING }
            }
          }
        }
      }
    },
    dayparting: {
      type: SchemaType.OBJECT,
      properties: {
        ahorro_estimado: { type: SchemaType.NUMBER },
        ahorro_mensual_estimado: { type: SchemaType.NUMBER },
        franjas_con_fuga: { type: SchemaType.NUMBER },
        horas_toxicas: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } },
        horas_estrella: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } },
        ventana_dias_historico: { type: SchemaType.NUMBER },
        generado_en: { type: SchemaType.STRING },
        patron_principal: {
          type: SchemaType.OBJECT,
          properties: {
            dias: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            hora_inicio: { type: SchemaType.NUMBER },
            hora_fin: { type: SchemaType.NUMBER },
            ahorro_mensual_estimado: { type: SchemaType.NUMBER },
            mensaje: { type: SchemaType.STRING },
          },
        },
        safe_apply: {
          type: SchemaType.OBJECT,
          properties: {
            requiere_confirmacion: { type: SchemaType.BOOLEAN },
            undo_disponible: { type: SchemaType.BOOLEAN },
            nivel_riesgo: { type: SchemaType.STRING }
          }
        },
        heatmap: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              dia_semana: { type: SchemaType.NUMBER },
              hora: { type: SchemaType.NUMBER },
              label: { type: SchemaType.STRING },
              gasto: { type: SchemaType.NUMBER },
              clics: { type: SchemaType.NUMBER },
              conversiones: { type: SchemaType.NUMBER },
              cpa: { type: SchemaType.NUMBER },
              estado: { type: SchemaType.STRING },
              gasto_desperdiciado: { type: SchemaType.NUMBER },
              muestra_suficiente: { type: SchemaType.BOOLEAN }
            }
          }
        },
        franjas_problematicas: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              dia_semana: { type: SchemaType.NUMBER },
              dia_fin: { type: SchemaType.NUMBER },
              hora_inicio: { type: SchemaType.NUMBER },
              hora_fin: { type: SchemaType.NUMBER },
              etiqueta: { type: SchemaType.STRING },
              gasto: { type: SchemaType.NUMBER },
              clics: { type: SchemaType.NUMBER },
              conversiones: { type: SchemaType.NUMBER },
              cpa: { type: SchemaType.NUMBER },
              gasto_desperdiciado: { type: SchemaType.NUMBER },
              accion_recomendada: { type: SchemaType.STRING },
              motivo: { type: SchemaType.STRING },
              campanas_top: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    campana_id: { type: SchemaType.STRING },
                    campana_nombre: { type: SchemaType.STRING },
                    gasto: { type: SchemaType.NUMBER }
                  }
                }
              }
            }
          }
        }
      }
    },
    canibalizacion: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    hallazgos: {
      type: SchemaType.OBJECT,
      properties: {
        graves_rojo: { 
          type: SchemaType.ARRAY, 
          items: { 
            type: SchemaType.OBJECT, 
            properties: { 
              id_rastreo: { type: SchemaType.STRING }, 
              titulo: { type: SchemaType.STRING }, 
              descripcion_tecnica: { type: SchemaType.STRING },
              descripcion_simple: { type: SchemaType.STRING }
            } 
          } 
        },
        debiles_amarillo: { 
          type: SchemaType.ARRAY, 
          items: { 
            type: SchemaType.OBJECT, 
            properties: { 
              id_rastreo: { type: SchemaType.STRING }, 
              titulo: { type: SchemaType.STRING }, 
              descripcion_tecnica: { type: SchemaType.STRING },
              descripcion_simple: { type: SchemaType.STRING }
            } 
          } 
        },
        bien_verde: { 
          type: SchemaType.ARRAY, 
          items: { 
            type: SchemaType.OBJECT, 
            properties: { 
              id_rastreo: { type: SchemaType.STRING }, 
              titulo: { type: SchemaType.STRING }, 
              descripcion_tecnica: { type: SchemaType.STRING },
              descripcion_simple: { type: SchemaType.STRING }
            } 
          } 
        }
      }
    },
    checklist: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { tarea: { type: SchemaType.STRING }, impacto: { type: SchemaType.STRING }, color: { type: SchemaType.STRING } } } },
    advertencias: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
  },
  required: ["health_score", "resumen", "hallazgos"]
};

export async function POST(req: Request) {
  try {
    const { datos, idioma_ui, marca_cliente } = await req.json();

    // ========================================================================
    // ADAPTADOR AUTOMÁTICO REFORZADO (Campos de Campaña + Quality Score)
    // ========================================================================
    let datosEstructurados: DatosAuditoriaInput;
    const [terminosSimulados, horariosSimulados] = await Promise.all([
      extraerTerminosGoogle(),
      extraerDatosHorariosGoogle(),
    ]);

    if (Array.isArray(datos)) {
      const campanasNormalizadas = datos.map((c: any) => ({
        id: String(c.id || c.ID || Math.random().toString()),
        nombre: String(c.nombre || c.Nombre || "Campaña Sin Nombre"),
        estado: String(c.estado || c.Estado || "ENABLED"),
        presupuesto_mensual: Number(c.presupuesto_mensual || c.presupuesto || c.Presupuesto_Mensual || 0),
        gasto_mensual: Number(c.gasto_mensual || c.gasto || c.Gasto_Mensual || 0),
        clics: Number(c.clics || c.Clics || 0),
        conversiones: Number(c.conversiones || c.Conversiones || 0),
        cpa_actual: Number(c.cpa_actual || c.cpa || c.CPA_Actual || 0),
        cpa_objetivo: c.cpa_objetivo !== undefined ? Number(c.cpa_objetivo) : undefined,
        quality_score: c.quality_score !== undefined ? Number(c.quality_score) : undefined,
        quality_ctr: c.quality_ctr ? String(c.quality_ctr) : undefined,
        quality_relevance: c.quality_relevance ? String(c.quality_relevance) : undefined,
        quality_landing: c.quality_landing ? String(c.quality_landing) : undefined,
        search_lost_is_budget: c.search_lost_is_budget !== undefined ? Number(c.search_lost_is_budget) : undefined,
        cuota_impresiones_perdida_presupuesto: c.cuota_impresiones_perdida_presupuesto !== undefined ? Number(c.cuota_impresiones_perdida_presupuesto) : undefined,
        impression_share_lost_budget: c.impression_share_lost_budget !== undefined ? Number(c.impression_share_lost_budget) : undefined
      }));

      const gastoTotal = campanasNormalizadas.reduce((sum, c) => sum + c.gasto_mensual, 0);
      const convTotales = campanasNormalizadas.reduce((sum, c) => sum + c.conversiones, 0);
      const clicsTotales = campanasNormalizadas.reduce((sum, c) => sum + c.clics, 0);
      const cpaPromedio = convTotales > 0 ? gastoTotal / convTotales : 0;

      datosEstructurados = {
        tipo_negocio: 'ecommerce',
        cpa_promedio_cuenta: cpaPromedio,
        gasto_total_cuenta: gastoTotal,
        conversiones_totales: convTotales,
        clics_totales: clicsTotales,
        campanas: campanasNormalizadas,
        terminos: terminosSimulados,
        horarios: horariosSimulados,
        marca_cliente
      };
    } else {
      datosEstructurados = {
        ...datos,
        terminos: datos.terminos || terminosSimulados,
        horarios: datos.horarios || horariosSimulados,
        marca_cliente: datos.marca_cliente || marca_cliente
      };
    }

    // ========================================================================
    // MAGIA DETERMINISTA: El motor matemático evalúa Quality Scores bajos
    // ========================================================================
    const esqueletoJSON = generarEsqueletoAuditoria(datosEstructurados);

    // ========================================================================
    // GEMINI COMO REDACTOR EXCLUSIVO
    // Solo le mandamos los hallazgos (estructura mínima). Todo el resto
    // del reporte (destripador, n_gramas, robin_hood, etc.) lo conservamos
    // en el backend y lo reinyectamos al final.
    // ========================================================================
    const stripHallazgo = (h: any) => ({
      id_rastreo: h.id_rastreo,
      titulo: h.titulo,
      descripcion_tecnica: h.descripcion_tecnica || "",
      descripcion_simple: h.descripcion_simple || "",
    });

    const payloadGemini = {
      hallazgos: {
        graves_rojo: (esqueletoJSON.hallazgos?.graves_rojo || [])
          .slice(0, GEMINI_CAP_HALLAZGOS.graves_rojo)
          .map(stripHallazgo),
        debiles_amarillo: (esqueletoJSON.hallazgos?.debiles_amarillo || [])
          .slice(0, GEMINI_CAP_HALLAZGOS.debiles_amarillo)
          .map(stripHallazgo),
        bien_verde: (esqueletoJSON.hallazgos?.bien_verde || [])
          .slice(0, GEMINI_CAP_HALLAZGOS.bien_verde)
          .map(stripHallazgo),
      },
    };

    const hayHallazgos =
      payloadGemini.hallazgos.graves_rojo.length +
        payloadGemini.hallazgos.debiles_amarillo.length +
        payloadGemini.hallazgos.bien_verde.length > 0;

    let hallazgosFinales = esqueletoJSON.hallazgos;

    if (hayHallazgos) {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: `[Eres la redactora experta de una agencia de marketing digital.
Tu ÚNICA tarea es recibir un JSON con la clave "hallazgos" (arrays graves_rojo, debiles_amarillo, bien_verde) y rellenar SOLO los campos "descripcion_tecnica" y "descripcion_simple" de cada item.

REGLAS ESTRICTAS:
1. No agregues, quites ni reordenes items.
2. No alteres "id_rastreo" ni "titulo".
3. "descripcion_tecnica": Redactada para un Media Buyer, 1-2 oraciones, jerga analítica precisa.
4. "descripcion_simple": Para alguien que NO maneja Google Ads. Máximo 2 oraciones cortas (máx. 20 palabras cada una). Voseo argentino, tono directo y cercano. PROHIBIDO: CPA, ROAS, CTR, CPC, QS, "optimización", "performance", "métrica", "campaña" si hay alternativa más simple. OBLIGATORIO: consecuencia en plata o ventas ("Estás perdiendo $X", "Podés recuperar contactos"). Sin tono de informe corporativo.

Devuelve un JSON con exactamente la misma forma {"hallazgos": {...}}.]`,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: schemaHallazgos as any,
        },
      });

      const prompt = `Rellena descripciones en idioma ${idioma_ui}.\n\n${JSON.stringify(payloadGemini)}`;
      try {
        const responseText = await generateContentWithRetry(model, prompt);
        const parsed = JSON.parse(responseText);
        if (parsed?.hallazgos) {
          hallazgosFinales = {
            graves_rojo: mergeHallazgosConGemini(
              esqueletoJSON.hallazgos.graves_rojo || [],
              parsed.hallazgos.graves_rojo
            ),
            debiles_amarillo: mergeHallazgosConGemini(
              esqueletoJSON.hallazgos.debiles_amarillo || [],
              parsed.hallazgos.debiles_amarillo
            ),
            bien_verde: mergeHallazgosConGemini(
              esqueletoJSON.hallazgos.bien_verde || [],
              parsed.hallazgos.bien_verde
            ),
          };
        }
      } catch (geminiError) {
        console.error("[audit] Gemini no disponible tras reintentos:", geminiError);
        return NextResponse.json(
          {
            error: "gemini_unavailable",
            message: MENSAJE_GEMINI_NO_DISPONIBLE,
          },
          { status: 503 }
        );
      }
    }

    const reporteFinal = {
      ...esqueletoJSON,
      hallazgos: hallazgosFinales,
    };

    return NextResponse.json(reporteFinal);

  } catch (error: any) {
    console.error("Error crítico en la API de Auditoría:", error);
    return NextResponse.json({ error: "Error en el análisis determinista o generación de IA" }, { status: 500 });
  }
}

// El schemaMora completo queda referenciado para evitar tree-shaking del tipo;
// no se envía a Gemini pero documenta la forma del reporte completo.
void schemaMora;