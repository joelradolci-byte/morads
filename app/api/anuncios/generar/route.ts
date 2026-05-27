import { NextResponse } from "next/server";
import { validarAnuncioGenerado, type AnuncioGeneradoValidado } from "@/lib/anunciosValidator";
import { isAiConfigured } from "@/lib/ai/provider";
import { ejecutarAnunciosRsa } from "@/lib/ai/tasks";

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
    if (!isAiConfigured("anuncios_rsa")) {
      return NextResponse.json(
        { error: "ai_not_configured", message: "API de IA no configurada." },
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

    const parsed = await ejecutarAnunciosRsa(prompt);

    const variantes: AnuncioGeneradoValidado[] = (parsed.variantes || [])
      .slice(0, 5)
      .map(v =>
        validarAnuncioGenerado(
          {
            enfoque: String(v.enfoque || ""),
            objetivo: String(v.objetivo || objetivo),
            headlines: Array.isArray(v.headlines) ? v.headlines.map(String) : [],
            descriptions: Array.isArray(v.descriptions) ? v.descriptions.map(String) : [],
            keywords_usadas: Array.isArray(v.keywords_usadas)
              ? v.keywords_usadas.map(String)
              : [],
            terminos_evitar: Array.isArray(v.terminos_evitar)
              ? v.terminos_evitar.map(String)
              : [],
            advertencias: Array.isArray(v.advertencias) ? v.advertencias.map(String) : [],
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
        error: "ai_unavailable",
        message: "No se pudieron generar anuncios en este momento. Reintentá en unos minutos.",
      },
      { status: 503 }
    );
  }
}
