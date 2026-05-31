import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { generarEsqueletoAuditoria, DatosAuditoriaInput } from "@/lib/motorMora";
import {
  assertUsageAllowed,
  recordUsageSuccess,
  UsageLimitError,
  usageLimitResponse,
} from "@/lib/usage/enforce";
import { buildDatosAuditoriaFromGoogleAds } from "@/lib/googleAds/liveExtract";
import { getUserGoogleAdsLink } from "@/lib/googleAds/client";
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
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Tenés que iniciar sesión para auditar." },
        { status: 401 }
      );
    }

    try {
      await assertUsageAllowed(user.id, "audit");
    } catch (err) {
      if (err instanceof UsageLimitError) return usageLimitResponse(err);
      throw err;
    }

    const { datos, idioma_ui, marca_cliente } = await req.json();
    const idioma = typeof idioma_ui === "string" ? idioma_ui : "es";

    let datosEstructurados: DatosAuditoriaInput;

    if (
      datos &&
      typeof datos === "object" &&
      !Array.isArray(datos) &&
      Array.isArray((datos as DatosAuditoriaInput).campanas)
    ) {
      datosEstructurados = {
        ...(datos as DatosAuditoriaInput),
        marca_cliente:
          (datos as DatosAuditoriaInput).marca_cliente ?? marca_cliente,
      };
    } else {
      const link = await getUserGoogleAdsLink(user.id);
      if (link.connected && link.refresh_token && link.customer_id) {
        datosEstructurados = await buildDatosAuditoriaFromGoogleAds({
          refreshToken: link.refresh_token,
          customerId: link.customer_id,
          loginCustomerId: link.login_customer_id,
          marca_cliente,
          useFixtureMetrics: false,
        });
      } else {
        return NextResponse.json(
          {
            error: "google_ads_not_ready",
            message: "Conectá y elegí una cuenta de Google Ads antes de auditar.",
          },
          { status: 400 }
        );
      }
    }

    const esqueletoJSON = generarEsqueletoAuditoria(datosEstructurados) as Record<string, unknown> & {
      hallazgos: HallazgosBuckets;
    };

    const originales: HallazgosBuckets = {
      graves_rojo: (esqueletoJSON.hallazgos?.graves_rojo || []) as HallazgoConCamposExtra[],
      debiles_amarillo: (esqueletoJSON.hallazgos?.debiles_amarillo || []) as HallazgoConCamposExtra[],
      bien_verde: (esqueletoJSON.hallazgos?.bien_verde || []) as HallazgoConCamposExtra[],
    };

    const hayHallazgosAccionables =
      originales.graves_rojo.length + originales.debiles_amarillo.length > 0;

    if (hayHallazgosAccionables && !isAiConfigured("redactor_hallazgos")) {
      return NextResponse.json(
        { error: "ai_not_configured", message: "API de IA no configurada (OpenAI)." },
        { status: 503 }
      );
    }

    const payloadEstratega = construirPayloadEstratega(esqueletoJSON);

    let hallazgosRedactados = originales;
    let estratega: Awaited<ReturnType<typeof ejecutarEstrategaAuditoria>> = null;

    if (hayHallazgosAccionables) {
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

    const reporteFinal = aplicarEstratega(esqueletoJSON, hallazgosRedactados, estratega) as Record<
      string,
      unknown
    >;
    const currencyCode =
      typeof datosEstructurados.currency_code === "string"
        ? datosEstructurados.currency_code
        : "USD";
    reporteFinal.meta = {
      ...(typeof reporteFinal.meta === "object" && reporteFinal.meta !== null
        ? (reporteFinal.meta as Record<string, unknown>)
        : {}),
      currency_code: currencyCode,
      idioma_ui: idioma,
    };

    await recordUsageSuccess(user.id, "audit");

    return NextResponse.json(reporteFinal);
  } catch (error: unknown) {
    console.error("Error crítico en la API de Auditoría:", error);
    return NextResponse.json(
      { error: "audit_failed", message: MENSAJE_IA_NO_DISPONIBLE },
      { status: 500 }
    );
  }
}
