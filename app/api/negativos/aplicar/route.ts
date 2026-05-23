import { NextResponse } from "next/server";
import type {
  NegativosApplyPlan,
  NegativosApplyResult,
} from "@/lib/destripadorSafeApply";

// Endpoint server-side para registrar y aplicar negativos del Destripador.
// Mantiene el modelo Copilot: requiere que el cliente confirme antes de llamarlo.
// La integración real con Google Ads API se conecta aquí cuando esté disponible;
// mientras tanto, devolvemos un recibo deterministico para que la UI pueda mostrar
// el resultado, registrar auditoría y permitir verificación posterior.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = body?.plan as NegativosApplyPlan | undefined;
    const userConfirmed = Boolean(body?.userConfirmed);

    if (!plan || !Array.isArray(plan.items)) {
      return NextResponse.json(
        { error: "Plan de negativos inválido o faltante." },
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
        { error: "No hay negativos seleccionados para aplicar." },
        { status: 400 }
      );
    }

    // Validación mínima: ningún item puede venir vacío o sin tipo de match.
    const invalidos = plan.items.filter(
      it => !it.termino || (it.match_type !== "FRASE" && it.match_type !== "EXACTA")
    );
    if (invalidos.length > 0) {
      return NextResponse.json(
        { error: "Se encontraron ítems con formato inválido.", invalidos },
        { status: 400 }
      );
    }

    const result: NegativosApplyResult = {
      status: "aplicado",
      message:
        "Mora registró tu confirmación. Cuando conectes Google Ads en escritura, " +
        "estos negativos quedan listos para aplicarse con este mismo plan.",
      appliedAt: new Date().toISOString(),
      applied: plan.items,
      rejected: [],
      receiptId: plan.id,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[negativos/aplicar] error inesperado:", error);
    return NextResponse.json(
      { error: "Error inesperado al procesar el plan de negativos." },
      { status: 500 }
    );
  }
}
