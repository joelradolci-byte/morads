import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ReportePDF } from "../../components/pdf/ReportePDF";
import { fetchSuscripcion } from "@/lib/billing/plan";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertPdfAllowed,
  getUsageSnapshot,
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

    const { searchParams } = new URL(req.url);
    const auditId = searchParams.get("id");

    if (!auditId) {
      return NextResponse.json({ error: "Falta el ID de la auditoría" }, { status: 400 });
    }

    const sub = await fetchSuscripcion(user.id);
    const isRedownload =
      Boolean(sub?.trial_pdf_used) && sub?.trial_pdf_audit_id === auditId;

    try {
      await assertPdfAllowed(
        user.id,
        { auditId, isRedownload },
        user.email
      );
    } catch (err) {
      if (err instanceof UsageLimitError) return usageLimitResponse(err);
      throw err;
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
    const snapshot = await getUsageSnapshot(user.id, user.email);
    const isPaid = snapshot.planKind === "paid";

    const meta = {
      nombre_cuenta: audit.nombre_cuenta || "Cliente",
      created_at: audit.created_at,
      agencia_nombre: isPaid
        ? agencia?.agencia_nombre || audit.nombre_cuenta || "Mora"
        : agencia?.agencia_nombre || "Mora",
      agencia_logo: isPaid ? agencia?.agencia_logo || undefined : undefined,
      agencia_web: isPaid ? agencia?.agencia_web || undefined : undefined,
      agencia_pie: isPaid ? agencia?.agencia_pie || undefined : undefined,
      currency_code: getCurrencyCodeFromReporte(reporteJson),
      idioma_ui:
        typeof (reporteJson?.meta as Record<string, unknown> | undefined)?.idioma_ui ===
        "string"
          ? String((reporteJson!.meta as Record<string, unknown>).idioma_ui)
          : "es",
      watermark: !isPaid,
    };

    const pdfBuffer = await renderToBuffer(
      createElement(ReportePDF as never, { reporte: audit.reporte_json, meta } as never) as never
    );

    if (!isRedownload) {
      await recordUsageSuccess(user.id, "pdf", user.email, auditId);
    }

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
