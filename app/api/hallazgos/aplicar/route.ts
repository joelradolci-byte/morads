import { NextResponse } from "next/server";
import type {
  HallazgoApplyPlan,
  HallazgoApplyResult,
} from "@/lib/hallazgoSafeApply";
import { validateHallazgoPlan } from "@/lib/hallazgoSafeApply";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = body?.plan as HallazgoApplyPlan | undefined;
    const userConfirmed = Boolean(body?.userConfirmed);

    if (!plan) {
      return NextResponse.json(
        { error: "Plan de hallazgo inválido o faltante." },
        { status: 400 }
      );
    }

    const validation = validateHallazgoPlan(plan);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    if (!userConfirmed) {
      return NextResponse.json(
        { error: "Falta confirmación explícita del usuario." },
        { status: 400 }
      );
    }

    const result: HallazgoApplyResult = {
      status: "aplicado",
      message:
        "Mora registró tu confirmación. Cuando conectes Google Ads en escritura, " +
        "este cambio quedará listo para aplicarse con este mismo plan.",
      appliedAt: new Date().toISOString(),
      receiptId: plan.id,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[hallazgos/aplicar] error inesperado:", error);
    return NextResponse.json(
      { error: "Error inesperado al procesar el plan del hallazgo." },
      { status: 500 }
    );
  }
}

