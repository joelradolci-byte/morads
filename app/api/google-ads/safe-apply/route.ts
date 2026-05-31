import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { resolveApplyContext } from "@/lib/googleAds/applyContext";
import { googleAdsApplyErrorResponse } from "@/lib/googleAds/applyHttp";
import { applyBudgetPlan } from "@/lib/googleAds/mutations";
import type { SafeApplyAuditEntry, SafeApplyPlan, SafeApplyStatus } from "@/lib/safeApply";

function buildAudit(
  plan: SafeApplyPlan,
  status: SafeApplyStatus,
  details: string
): SafeApplyAuditEntry {
  return {
    id: `${plan.id}-${Date.now()}`,
    planId: plan.id,
    status,
    timestamp: new Date().toISOString(),
    details,
    changes: plan.changes,
  };
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized", message: "Iniciá sesión." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const plan = body?.plan as SafeApplyPlan | undefined;
    const userConfirmed = Boolean(body?.userConfirmed);
    const mode = body?.mode === "undo" ? "undo" : "apply";

    if (!plan || !Array.isArray(plan.changes) || plan.changes.length === 0) {
      return NextResponse.json({ error: "Plan de presupuesto inválido o vacío." }, { status: 400 });
    }
    if (!userConfirmed) {
      return NextResponse.json(
        { error: "Falta confirmación explícita del usuario." },
        { status: 400 }
      );
    }

    const ctx = await resolveApplyContext(user.id);
    const outcome = await applyBudgetPlan(ctx.customer, plan, mode);

    let status: SafeApplyStatus;
    if (outcome.ok) {
      status = mode === "undo" ? "revertido" : "aplicado";
    } else if (outcome.applied.length > 0) {
      status = "requiere_revision";
    } else {
      status = "cancelado";
    }

    return NextResponse.json({
      status,
      message: outcome.message,
      audit: buildAudit(plan, status, outcome.message),
      applied: outcome.applied,
      failed: outcome.failed,
    });
  } catch (err) {
    return googleAdsApplyErrorResponse(err);
  }
}
