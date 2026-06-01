import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import {
  assertProFeature,
  ProFeatureError,
  proFeatureResponse,
} from "@/lib/usage/enforce";
import { resolveApplyContext } from "@/lib/googleAds/applyContext";
import { googleAdsApplyErrorResponse } from "@/lib/googleAds/applyHttp";
import { applyNegativosPlan } from "@/lib/googleAds/mutations";
import type {
  NegativosApplyPlan,
  NegativosApplyResult,
} from "@/lib/destripadorSafeApply";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized", message: "Iniciá sesión." }, { status: 401 });
  }

  try {
    try {
      await assertProFeature(user.id, user.email);
    } catch (err) {
      if (err instanceof ProFeatureError) return proFeatureResponse(err);
      throw err;
    }

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

    const invalidos = plan.items.filter(
      it => !it.termino || (it.match_type !== "FRASE" && it.match_type !== "EXACTA")
    );
    if (invalidos.length > 0) {
      return NextResponse.json(
        { error: "Se encontraron ítems con formato inválido.", invalidos },
        { status: 400 }
      );
    }

    const ctx = await resolveApplyContext(user.id);
    const outcome = await applyNegativosPlan(ctx.customer, ctx.customerId, plan);

    const result: NegativosApplyResult = {
      status:
        outcome.applied.length > 0
          ? outcome.rejected.length === 0
            ? "aplicado"
            : "aplicado"
          : "cancelado",
      message: outcome.message,
      appliedAt: new Date().toISOString(),
      applied: outcome.applied,
      rejected: outcome.rejected,
      receiptId: plan.id,
    };

    return NextResponse.json(result, {
      status: outcome.applied.length === 0 ? 422 : 200,
    });
  } catch (err) {
    return googleAdsApplyErrorResponse(err);
  }
}
