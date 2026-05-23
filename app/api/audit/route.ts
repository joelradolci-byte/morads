import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";
// Importamos tu nuevo cerebro matemático
import { generarEsqueletoAuditoria, DatosAuditoriaInput } from "@/lib/motorMora"; 
// Importamos el extractor de términos de búsqueda simulados
import { extraerTerminosGoogle } from "@/lib/googleAds"; 

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// El esquema JSON se mantiene intacto para garantizar que la app gráfica no se rompa
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
        campanas_origen: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        campanas_destino: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        justificacion: { type: SchemaType.STRING }
      }
    },
    ngramas: {
      type: SchemaType.OBJECT,
      properties: {
        tokens_toxicos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        tokens_estrella: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      }
    },
    dayparting: {
      type: SchemaType.OBJECT,
      properties: {
        horas_toxicas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        horas_estrella: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
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
    const { datos, idioma_ui } = await req.json();

    // ========================================================================
    // ADAPTADOR AUTOMÁTICO REFORZADO (Campos de Campaña + Quality Score)
    // ========================================================================
    let datosEstructurados: DatosAuditoriaInput;
    const terminosSimulados = await extraerTerminosGoogle();

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
        quality_landing: c.quality_landing ? String(c.quality_landing) : undefined
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
        terminos: terminosSimulados
      };
    } else {
      datosEstructurados = {
        ...datos,
        terminos: datos.terminos || terminosSimulados
      };
    }

    // ========================================================================
    // MAGIA DETERMINISTA: El motor matemático evalúa Quality Scores bajos
    // ========================================================================
    const esqueletoJSON = generarEsqueletoAuditoria(datosEstructurados);

    // ========================================================================
    // GEMINI COMO REDACTOR EXCLUSIVO
    // ========================================================================
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview", 
      systemInstruction: `[Eres la redactora experta de una agencia de marketing digital.
Tu ÚNICA tarea es recibir un JSON pre-calculado por nuestro sistema, leer los arrays dentro de "hallazgos" (graves_rojo, debiles_amarillo, bien_verde) y rellenar los campos vacíos de "descripcion_tecnica" y "descripcion_simple".

REGLAS ESTRICTAS:
1. NO modifiques ningún número (health_score, resumen, gastos).
2. NO alteres ni inventes los "id_rastreo".
3. "descripcion_tecnica": Redactada para un Media Buyer usando la jerga analítica correspondiente al problema evidenciado en el título.
4. "descripcion_simple": Redactada para el dueño del negocio. En criollo, sin siglas, usando analogías claras sobre dinero ganado, perdido, o potencial desaprovechado.

Devuelve EXACTAMENTE la misma estructura JSON que recibiste, pero con las descripciones completas.]`,
      generationConfig: {
        temperature: 0.1, 
        responseMimeType: "application/json",
        responseSchema: schemaMora as any,
      }
    });

    const prompt = `Rellena las descripciones vacías de este JSON en idioma ${idioma_ui}:\n\n${JSON.stringify(esqueletoJSON, null, 2)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return NextResponse.json(JSON.parse(responseText));

  } catch (error: any) {
    console.error("Error crítico en la API de Auditoría:", error);
    return NextResponse.json({ error: "Error en el análisis determinista o generación de IA" }, { status: 500 });
  }
}