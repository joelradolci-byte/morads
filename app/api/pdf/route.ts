// app/api/pdf/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ReportePDF } from "../../components/pdf/ReportePDF";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const auditId = searchParams.get("id");

    if (!auditId) {
      return NextResponse.json({ error: "Falta el ID de la auditoría" }, { status: 400 });
    }

    // 1. Traer la auditoría
    const { data: audit, error: auditError } = await supabase
      .from("historial_auditorias")
      .select("*")
      .eq("id", auditId)
      .single();

    if (auditError || !audit) {
      return NextResponse.json({ error: "Auditoría no encontrada" }, { status: 404 });
    }

    // 2. Traer config de agencia (opcional)
    const { data: agencia } = await supabase
      .from("configuracion_agencia")
      .select("agencia_nombre, agencia_logo")
      .eq("user_id", audit.user_id)
      .maybeSingle();

    // 3. Armar el meta del reporte
    const meta = {
      nombre_cuenta: audit.nombre_cuenta || "Cliente",
      created_at: audit.created_at,
      agencia_nombre: agencia?.agencia_nombre || "Mora Analytics",
      agencia_logo: agencia?.agencia_logo || undefined,
    };

    // 4. Generar el PDF en memoria — sin dependencias externas
    // renderToBuffer expects a React-PDF Document element type; cast to any to satisfy TS
    const pdfBuffer = await renderToBuffer(
      createElement(ReportePDF as any, { reporte: audit.reporte_json, meta } as any) as any
    );

    const pdfBody = new Uint8Array(pdfBuffer);

    // 5. Devolver el archivo
    const filename = `Auditoria_Mora_${meta.nombre_cuenta.replace(/\s+/g, "_")}.pdf`;

    return new Response(pdfBody, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[pdf/route] Error generando reporte:", error);
    return NextResponse.json({ error: "Error generando el PDF" }, { status: 500 });
  }
}