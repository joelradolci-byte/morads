import { NextResponse } from "next/server";
import { applyReportTeaser } from "@/lib/billing/reportTeaser";
import { getPlanState } from "@/lib/billing/plan";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const admin = getSupabaseAdmin();
  const { data: audit, error } = await admin
    .from("historial_auditorias")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !audit) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const planState = await getPlanState(user.id, user.email);
  let reporte = audit.reporte_json as Record<string, unknown> | null;
  if (reporte && planState.kind !== "paid") {
    reporte = applyReportTeaser(reporte, planState);
  }

  return NextResponse.json({
    ...audit,
    reporte_json: reporte,
    planKind: planState.kind,
  });
}
