import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import {
  assertProFeature,
  ProFeatureError,
  proFeatureResponse,
} from "@/lib/usage/enforce";
import { resolveApplyContext } from "@/lib/googleAds/applyContext";
import { googleAdsApplyErrorResponse } from "@/lib/googleAds/applyHttp";
import { delegateHallazgoApply } from "@/lib/googleAds/delegateHallazgo";
import type { HallazgoApplyPlan } from "@/lib/hallazgoSafeApply";
import { validateHallazgoPlan } from "@/lib/hallazgoSafeApply";

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

    const ctx = await resolveApplyContext(user.id);
    const outcome = await delegateHallazgoApply(ctx, plan);

    if (outcome.httpStatus === 409) {
      return NextResponse.json(outcome.body, { status: 409 });
    }
    if (outcome.httpStatus === 400) {
      return NextResponse.json(outcome.body, { status: 400 });
    }

    return NextResponse.json(outcome.result);
  } catch (err) {
    return googleAdsApplyErrorResponse(err);
  }
}
