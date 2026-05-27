import { NextResponse } from "next/server";
import { generarEsqueletoAuditoria, DatosAuditoriaInput } from "@/lib/motorMora";
import { extraerTerminosGoogle, extraerDatosHorariosGoogle } from "@/lib/googleAds";
import { construirPayloadEstratega } from "@/lib/ai/auditPayload";
import {
  mergeBucketsHallazgos,
  reordenarBucket,
  type HallazgoConCamposExtra,
} from "@/lib/ai/merge";
import { isAiConfigured } from "@/lib/ai/provider";
import { ejecutarEstrategaAuditoria, ejecutarRedactorHallazgos } from "@/lib/ai/tasks";
import type { EstrategaAuditoriaResponse, HallazgosBuckets } from "@/lib/ai/types";

const MENSAJE_IA_NO_DISPONIBLE =
  "El análisis no está disponible en este momento. Intentá de nuevo en unos minutos.";

function aplicarEstratega(
  esqueleto: Record<string, unknown>,
  hallazgos: HallazgosBuckets,
  estratega: EstrategaAuditoriaResponse | null
): Record<string, unknown> {
  if (!estratega) {
    return { ...esqueleto, hallazgos };
  }

  const resumenBase = (esqueleto.resumen as Record<string, unknown>) || {};
  const priorizacion = estratega.priorizacion_final || [];

  const hallazgosOrdenados: HallazgosBuckets = {
    graves_rojo: reordenarBucket(hallazgos.graves_rojo, priorizacion),
    debiles_amarillo: reordenarBucket(hallazgos.debiles_amarillo, priorizacion),
    bien_verde: reordenarBucket(hallazgos.bien_verde, priorizacion),
  };

  const checklist = (estratega.plan_accion || []).map(item => ({
    tarea: item.tarea,
    impacto: item.impacto,
    color: item.color,
    ...(item.plazo ? { plazo: item.plazo } : {}),
  }));

  return {
    ...esqueleto,
    hallazgos: hallazgosOrdenados,
    resumen: {
      ...resumenBase,
      ejecutivo: estratega.resumen_ejecutivo || resumenBase.ejecutivo,
      lectura_global: estratega.lectura_global_cuenta || resumenBase.lectura_global,
      cierre_cliente: estratega.cierre_cliente || resumenBase.cierre_cliente,
    },
    narrativa: {
      priorizacion_final: estratega.priorizacion_final || [],
    },
    checklist,
    advertencias: estratega.advertencias?.length ? estratega.advertencias : esqueleto.advertencias,
  };
}

export async function POST(req: Request) {
  try {
    const { datos, idioma_ui, marca_cliente } = await req.json();
    const idioma = typeof idioma_ui === "string" ? idioma_ui : "es";

    let datosEstructurados: DatosAuditoriaInput;
    const [terminosSimulados, horariosSimulados] = await Promise.all([
      extraerTerminosGoogle(),
      extraerDatosHorariosGoogle(),
    ]);

    if (Array.isArray(datos)) {
      const campanasNormalizadas = datos.map((c: Record<string, unknown>) => ({
        id: String(c.id || c.ID || Math.random().toString()),
        nombre: String(c.nombre || c.Nombre || "Campaña Sin Nombre"),
        estado: String(c.estado || c.Estado || "ENABLED"),
        presupuesto_mensual: Number(
          c.presupuesto_mensual || c.presupuesto || c.Presupuesto_Mensual || 0
        ),
        gasto_mensual: Number(c.gasto_mensual || c.gasto || c.Gasto_Mensual || 0),
        clics: Number(c.clics || c.Clics || 0),
        conversiones: Number(c.conversiones || c.Conversiones || 0),
        cpa_actual: Number(c.cpa_actual || c.cpa || c.CPA_Actual || 0),
        cpa_objetivo: c.cpa_objetivo !== undefined ? Number(c.cpa_objetivo) : undefined,
        quality_score: c.quality_score !== undefined ? Number(c.quality_score) : undefined,
        quality_ctr: c.quality_ctr ? String(c.quality_ctr) : undefined,
        quality_relevance: c.quality_relevance ? String(c.quality_relevance) : undefined,
        quality_landing: c.quality_landing ? String(c.quality_landing) : undefined,
        search_lost_is_budget:
          c.search_lost_is_budget !== undefined ? Number(c.search_lost_is_budget) : undefined,
        cuota_impresiones_perdida_presupuesto:
          c.cuota_impresiones_perdida_presupuesto !== undefined
            ? Number(c.cuota_impresiones_perdida_presupuesto)
            : undefined,
        impression_share_lost_budget:
          c.impression_share_lost_budget !== undefined
            ? Number(c.impression_share_lost_budget)
            : undefined,
      }));

      const gastoTotal = campanasNormalizadas.reduce((sum, c) => sum + c.gasto_mensual, 0);
      const convTotales = campanasNormalizadas.reduce((sum, c) => sum + c.conversiones, 0);
      const clicsTotales = campanasNormalizadas.reduce((sum, c) => sum + c.clics, 0);
      const cpaPromedio = convTotales > 0 ? gastoTotal / convTotales : 0;

      datosEstructurados = {
        tipo_negocio: "ecommerce",
        cpa_promedio_cuenta: cpaPromedio,
        gasto_total_cuenta: gastoTotal,
        conversiones_totales: convTotales,
        clics_totales: clicsTotales,
        campanas: campanasNormalizadas,
        terminos: terminosSimulados,
        horarios: horariosSimulados,
        marca_cliente,
      };
    } else {
      datosEstructurados = {
        ...datos,
        terminos: datos.terminos || terminosSimulados,
        horarios: datos.horarios || horariosSimulados,
        marca_cliente: datos.marca_cliente || marca_cliente,
      };
    }

    const esqueletoJSON = generarEsqueletoAuditoria(datosEstructurados) as Record<string, unknown> & {
      hallazgos: HallazgosBuckets;
    };

    const originales: HallazgosBuckets = {
      graves_rojo: (esqueletoJSON.hallazgos?.graves_rojo || []) as HallazgoConCamposExtra[],
      debiles_amarillo: (esqueletoJSON.hallazgos?.debiles_amarillo || []) as HallazgoConCamposExtra[],
      bien_verde: (esqueletoJSON.hallazgos?.bien_verde || []) as HallazgoConCamposExtra[],
    };

    const hayHallazgos =
      originales.graves_rojo.length +
        originales.debiles_amarillo.length +
        originales.bien_verde.length >
      0;

    if (hayHallazgos && !isAiConfigured("redactor_hallazgos")) {
      return NextResponse.json(
        { error: "ai_not_configured", message: "API de IA no configurada (OpenAI)." },
        { status: 503 }
      );
    }

    const payloadEstratega = construirPayloadEstratega(esqueletoJSON);

    let hallazgosRedactados = originales;
    let estratega: Awaited<ReturnType<typeof ejecutarEstrategaAuditoria>> = null;

    if (hayHallazgos) {
      const [redactorResult, estrategaResult] = await Promise.all([
        ejecutarRedactorHallazgos(esqueletoJSON, idioma).catch(err => {
          console.error("[audit] redactor_hallazgos falló (degradación):", err);
          return null;
        }),
        isAiConfigured("estratega_auditoria")
          ? ejecutarEstrategaAuditoria(payloadEstratega, idioma)
          : Promise.resolve(null),
      ]);

      if (redactorResult) {
        hallazgosRedactados = mergeBucketsHallazgos(originales, redactorResult);
      }
      estratega = estrategaResult;
    } else if (isAiConfigured("estratega_auditoria")) {
      estratega = await ejecutarEstrategaAuditoria(payloadEstratega, idioma);
    }

    const reporteFinal = aplicarEstratega(esqueletoJSON, hallazgosRedactados, estratega);

    return NextResponse.json(reporteFinal);
  } catch (error: unknown) {
    console.error("Error crítico en la API de Auditoría:", error);
    return NextResponse.json(
      { error: "audit_failed", message: MENSAJE_IA_NO_DISPONIBLE },
      { status: 500 }
    );
  }
}
