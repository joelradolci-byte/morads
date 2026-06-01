import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ComparacionPDF } from "@/app/components/pdf/ComparacionPDF";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertProFeature,
  assertUsageAllowed,
  ProFeatureError,
  proFeatureResponse,
  recordUsageSuccess,
  UsageLimitError,
  usageLimitResponse,
} from "@/lib/usage/enforce";
import { buildComparacionPdfPayload } from "@/lib/pdf/comparacionPdfData";
import { comparacionEsMismaCuenta } from "@/app/dashboard/reportes/historialReportesUtils";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Iniciá sesión para exportar el PDF." },
        { status: 401 }
      );
    }

    try {
      await assertProFeature(user.id, user.email);
      await assertUsageAllowed(user.id, "pdf", user.email);
    } catch (err) {
      if (err instanceof ProFeatureError) return proFeatureResponse(err);
      if (err instanceof UsageLimitError) return usageLimitResponse(err);
      throw err;
    }

    const { searchParams } = new URL(req.url);
    const idA = searchParams.get("idA");
    const idB = searchParams.get("idB");

    if (!idA || !idB) {
      return NextResponse.json(
        { error: "Faltan los IDs de las auditorías a comparar" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const [resA, resB] = await Promise.all([
      supabase.from("historial_auditorias").select("*").eq("id", idA).single(),
      supabase.from("historial_auditorias").select("*").eq("id", idB).single(),
    ]);

    const auditA = resA.data;
    const auditB = resB.data;

    if (!auditA || !auditB || resA.error || resB.error) {
      return NextResponse.json({ error: "Auditoría no encontrada" }, { status: 404 });
    }

    if (auditA.user_id !== user.id || auditB.user_id !== user.id) {
      return NextResponse.json(
        { error: "forbidden", message: "No tenés permiso para exportar estas auditorías." },
        { status: 403 }
      );
    }

    if (!comparacionEsMismaCuenta([auditA, auditB])) {
      return NextResponse.json(
        {
          error: "bad_request",
          message: "La comparación en PDF solo está disponible para la misma cuenta.",
        },
        { status: 400 }
      );
    }

    const [older, newer] =
      new Date(auditA.created_at).getTime() <= new Date(auditB.created_at).getTime()
        ? [auditA, auditB]
        : [auditB, auditA];

    const { data: agencia } = await supabase
      .from("configuracion_agencia")
      .select("agencia_nombre, agencia_logo")
      .eq("user_id", user.id)
      .maybeSingle();

    const payload = buildComparacionPdfPayload(older, newer, agencia ?? {});

    const pdfBuffer = await renderToBuffer(
      createElement(ComparacionPDF as never, { data: payload } as never) as never
    );

    await recordUsageSuccess(user.id, "pdf", user.email);

    const safeName = (payload.meta.nombre_cuenta || "Cuenta").replace(/\s+/g, "_");
    const filename = `Comparacion_Mora_${safeName}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF de comparación:", error);
    return NextResponse.json(
      { error: "Error interno generando el PDF de comparación" },
      { status: 500 }
    );
  }
}
