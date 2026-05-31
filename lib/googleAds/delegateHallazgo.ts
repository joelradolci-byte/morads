import type { HallazgoApplyPlan, HallazgoApplyResult } from "../hallazgoSafeApply";
import type { SafeApplyPlan } from "../safeApply";
import type { NegativosApplyPlan } from "../destripadorSafeApply";
import type { DaypartingApplyPlan } from "../daypartingSafeApply";
import type { GoogleAdsApplyContext } from "./applyContext";
import {
  applyBudgetPlan,
  applyDaypartingPlan,
  applyNegativosPlan,
} from "./mutations";

const HERRAMIENTAS = new Set(["destripador", "dayparting", "simulador"]);

export type HallazgoDelegateOutcome =
  | { httpStatus: 200; result: HallazgoApplyResult }
  | { httpStatus: 409; body: { status: string; accion: string; message: string } }
  | { httpStatus: 400; body: { error: string } };

export async function delegateHallazgoApply(
  ctx: GoogleAdsApplyContext,
  plan: HallazgoApplyPlan
): Promise<HallazgoDelegateOutcome> {
  const mutation = plan.payload?.mutation;

  if (mutation?.kind === "budget") {
    const budgetPlan = mutation.plan as SafeApplyPlan;
    const outcome = await applyBudgetPlan(ctx.customer, budgetPlan, "apply");
    const status = outcome.ok ? "aplicado" : outcome.applied.length > 0 ? "aplicado" : "cancelado";
    return {
      httpStatus: 200,
      result: {
        status,
        message: outcome.message,
        appliedAt: new Date().toISOString(),
        receiptId: plan.id,
      },
    };
  }

  if (mutation?.kind === "negativos") {
    const negPlan = mutation.plan as NegativosApplyPlan;
    const outcome = await applyNegativosPlan(
      ctx.customer,
      ctx.customerId,
      negPlan
    );
    const status =
      outcome.rejected.length === 0 && outcome.applied.length > 0
        ? "aplicado"
        : outcome.applied.length > 0
          ? "aplicado"
          : "cancelado";
    return {
      httpStatus: 200,
      result: {
        status,
        message: outcome.message,
        appliedAt: new Date().toISOString(),
        receiptId: plan.id,
      },
    };
  }

  if (mutation?.kind === "dayparting") {
    const dpPlan = mutation.plan as DaypartingApplyPlan;
    const outcome = await applyDaypartingPlan(
      ctx.customer,
      ctx.customerId,
      dpPlan
    );
    const status =
      outcome.rejected.length === 0 && outcome.applied.length > 0
        ? "aplicado"
        : outcome.applied.length > 0
          ? "aplicado"
          : "cancelado";
    return {
      httpStatus: 200,
      result: {
        status,
        message: outcome.message,
        appliedAt: new Date().toISOString(),
        receiptId: plan.id,
      },
    };
  }

  const accion = plan.payload?.accion;
  if (accion && HERRAMIENTAS.has(accion)) {
    const labels: Record<string, string> = {
      destripador: "Destripador de búsquedas",
      dayparting: "Mapa de horarios",
      simulador: "Simulador de presupuesto",
    };
    return {
      httpStatus: 409,
      body: {
        status: "requiere_herramienta",
        accion,
        message: `Este hallazgo se aplica desde ${labels[accion] ?? accion}. Abrí la herramienta y confirmá los cambios allí.`,
      },
    };
  }

  return {
    httpStatus: 200,
    result: {
      status: "aplicado",
      message:
        "Mora registró tu confirmación. Los pasos de este hallazgo requieren revisión manual o una herramienta específica.",
      appliedAt: new Date().toISOString(),
      receiptId: plan.id,
    },
  };
}
