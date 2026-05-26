import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import { validarAnuncioGenerado, type AnuncioGeneradoValidado } from "@/lib/anunciosValidator";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      if (attempt < GEMINI_MAX_ATTEMPTS) await sleep(GEMINI_RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

const schemaAnuncios = {
  type: SchemaType.OBJECT,
  properties: {
    variantes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          enfoque: { type: SchemaType.STRING },
          objetivo: { type: SchemaType.STRING },
          headlines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          descriptions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          keywords_usadas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          terminos_evitar: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          advertencias: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          razonamiento: { type: SchemaType.STRING },
        },
      },
    },
  },
  required: ["variantes"],
};

export type AnunciosGenerarContexto = {
  tipo_negocio: "ecommerce" | "lead_gen" | "high_ticket";
  tono: "directo" | "premium" | "urgente" | "educativo";
  objetivo: "escalar" | "filtrar" | "recuperar_relevancia" | "test_ab";
  campana_nombre?: string;
  hallazgo_titulo?: string;
  hallazgo_descripcion?: string;
  angulo_comercial?: string;
  keywords_buenas?: string[];
  terminos_evitar?: string[];
  idioma_ui?: string;
};

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "gemini_not_configured", message: "API de IA no configurada." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as AnunciosGenerarContexto;
    const {
      tipo_negocio = "ecommerce",
      tono = "directo",
      objetivo = "escalar",
      campana_nombre,
      hallazgo_titulo,
      hallazgo_descripcion,
      angulo_comercial,
      keywords_buenas = [],
      terminos_evitar = [],
      idioma_ui = "es",
    } = body;

    if (!hallazgo_titulo && !campana_nombre && keywords_buenas.length === 0) {
      return NextResponse.json(
        {
          error: "contexto_insuficiente",
          message: "Mora necesita un hallazgo, campaña o keywords para generar anuncios.",
        },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: `Eres copywriter de performance para Google Ads (Responsive Search Ads).
Generá EXACTAMENTE 3 variantes de anuncio en JSON.
Reglas:
- Headlines: máximo 30 caracteres cada uno, mínimo 5 por variante.
- Descriptions: máximo 90 caracteres cada una, mínimo 2 por variante.
- Sin claims garantizados ("garantizado", "100%", "el mejor").
- Usar keywords buenas cuando encajen naturalmente.
- Evitar términos de la lista terminos_evitar.
- objetivo debe ser uno de: escalar, filtrar, recuperar_relevancia, test_ab.
- Tono según solicitud del usuario.`,
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
        responseSchema: schemaAnuncios as any,
      },
    });

    const prompt = `Idioma: ${idioma_ui}
Tipo negocio: ${tipo_negocio}
Tono: ${tono}
Objetivo del copy: ${objetivo}
Campaña: ${campana_nombre || "N/A"}
Hallazgo: ${hallazgo_titulo || "N/A"}
Detalle: ${hallazgo_descripcion || "N/A"}
Ángulo Mora: ${angulo_comercial || "Optimizar según diagnóstico"}
Keywords buenas: ${keywords_buenas.slice(0, 12).join(", ") || "N/A"}
Evitar términos: ${terminos_evitar.slice(0, 15).join(", ") || "N/A"}`;

    const responseText = await generateContentWithRetry(model, prompt);
    const parsed = JSON.parse(responseText) as {
      variantes?: Array<Record<string, unknown>>;
    };

    const variantes: AnuncioGeneradoValidado[] = (parsed.variantes || [])
      .slice(0, 5)
      .map(v =>
        validarAnuncioGenerado(
          {
            enfoque: String(v.enfoque || ""),
            objetivo: String(v.objetivo || objetivo),
            headlines: Array.isArray(v.headlines)
              ? v.headlines.map(String)
              : [],
            descriptions: Array.isArray(v.descriptions)
              ? v.descriptions.map(String)
              : [],
            keywords_usadas: Array.isArray(v.keywords_usadas)
              ? v.keywords_usadas.map(String)
              : [],
            terminos_evitar: Array.isArray(v.terminos_evitar)
              ? v.terminos_evitar.map(String)
              : [],
            advertencias: Array.isArray(v.advertencias)
              ? v.advertencias.map(String)
              : [],
            razonamiento: String(v.razonamiento || ""),
          },
          keywords_buenas,
          terminos_evitar
        )
      );

    if (variantes.length === 0) {
      return NextResponse.json(
        { error: "sin_variantes", message: "No se pudieron generar variantes válidas." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      variantes,
      generado_en: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[anuncios/generar]", error);
    return NextResponse.json(
      {
        error: "gemini_unavailable",
        message: "No se pudieron generar anuncios en este momento. Reintentá en unos minutos.",
      },
      { status: 503 }
    );
  }
}
