import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ReportePDF } from "../../components/pdf/ReportePDF";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertUsageAllowed,
  recordUsageSuccess,
  UsageLimitError,
  usageLimitResponse,
} from "@/lib/usage/enforce";
import { getCurrencyCodeFromReporte } from "@/lib/formatoMoneda";

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
      await assertUsageAllowed(user.id, "pdf");
    } catch (err) {
      if (err instanceof UsageLimitError) return usageLimitResponse(err);
      throw err;
    }

    const { searchParams } = new URL(req.url);
    const auditId = searchParams.get("id");

    if (!auditId) {
      return NextResponse.json({ error: "Falta el ID de la auditoría" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: audit, error: auditError } = await supabase
      .from("historial_auditorias")
      .select("*")
      .eq("id", auditId)
      .single();

    if (auditError || !audit) {
      return NextResponse.json({ error: "Auditoría no encontrada" }, { status: 404 });
    }

    if (audit.user_id !== user.id) {
      return NextResponse.json(
        { error: "forbidden", message: "No tenés permiso para exportar esta auditoría." },
        { status: 403 }
      );
    }

    const { data: agencia } = await supabase
      .from("configuracion_agencia")
      .select("agencia_nombre, agencia_logo, agencia_web, agencia_pie")
      .eq("user_id", audit.user_id)
      .maybeSingle();

    const reporteJson = audit.reporte_json as Record<string, unknown> | null;
    const meta = {
      nombre_cuenta: audit.nombre_cuenta || "Cliente",
      created_at: audit.created_at,
      agencia_nombre: agencia?.agencia_nombre || audit.nombre_cuenta || "Mora",
      agencia_logo: agencia?.agencia_logo || undefined,
      agencia_web: agencia?.agencia_web || undefined,
      agencia_pie: agencia?.agencia_pie || undefined,
      currency_code: getCurrencyCodeFromReporte(reporteJson),
      idioma_ui:
        typeof (reporteJson?.meta as Record<string, unknown> | undefined)?.idioma_ui ===
        "string"
          ? String((reporteJson!.meta as Record<string, unknown>).idioma_ui)
          : "es",
    };

    const pdfBuffer = await renderToBuffer(
      createElement(ReportePDF as never, { reporte: audit.reporte_json, meta } as never) as never
    );

    await recordUsageSuccess(user.id, "pdf");

    const pdfBody = new Uint8Array(pdfBuffer);
    const filename = `Auditoria_Mora_${meta.nombre_cuenta.replace(/\s+/g, "_")}.pdf`;

    return new Response(pdfBody, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    return NextResponse.json({ error: "Error interno generando el PDF" }, { status: 500 });
  }
}
