import { NextResponse } from "next/server";
import type {
  DaypartingApplyPlan,
  DaypartingApplyResult,
} from "@/lib/daypartingSafeApply";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = body?.plan as DaypartingApplyPlan | undefined;
    const userConfirmed = Boolean(body?.userConfirmed);

    if (!plan || !Array.isArray(plan.items)) {
      return NextResponse.json(
        { error: "Plan de dayparting inválido o faltante." },
        { status: 400 }
      );
    }

    if (!userConfirmed) {
      return NextResponse.json(
        { error: "Falta confirmación explícita del usuario." },
        { status: 400 }
      );
    }

    if (plan.items.length === 0) {
      return NextResponse.json(
        { error: "No hay franjas seleccionadas para aplicar." },
        { status: 400 }
      );
    }

    const result: DaypartingApplyResult = {
      status: "aplicado",
      message:
        "Mora registró tu confirmación. Cuando conectes Google Ads en escritura, " +
        "estos ajustes de dayparting quedan listos para aplicarse con este mismo plan.",
      appliedAt: new Date().toISOString(),
      applied: plan.items,
      rejected: [],
      receiptId: plan.id,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[dayparting/aplicar] error inesperado:", error);
    return NextResponse.json(
      { error: "Error inesperado al procesar el plan de dayparting." },
      { status: 500 }
    );
  }
}
