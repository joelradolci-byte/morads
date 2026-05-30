import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import {
  fetchFeedbackEligibilityForUser,
  insertFeedbackSurvey,
} from "@/lib/feedback/surveyServer";
import { parseSurveyBody } from "@/lib/feedback/validateSurvey";

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user?.email) {
      return NextResponse.json(
        { error: "unauthorized", message: "Iniciá sesión." },
        { status: 401 }
      );
    }

    const eligibility = await fetchFeedbackEligibilityForUser(user.id);
    if (!eligibility.canSubmit) {
      const message = eligibility.hasSubmittedRecently
        ? "Ya enviaste tu encuesta recientemente. Gracias."
        : eligibility.daysRemaining > 0
          ? `Podés responder cuando lleves al menos una semana usando Mora (faltan ${eligibility.daysRemaining} días).`
          : "Necesitás al menos una auditoría antes de responder.";
      return NextResponse.json(
        { error: "not_eligible", message, eligibility },
        { status: 409 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "invalid_json", message: "JSON inválido." },
        { status: 400 }
      );
    }

    const parsed = parseSurveyBody(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "validation", message: parsed.message },
        { status: 400 }
      );
    }

    await insertFeedbackSurvey(user.id, user.email, parsed.data);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[feedback/survey]", e);
    return NextResponse.json(
      { error: "server_error", message: "No se pudo guardar la encuesta." },
      { status: 500 }
    );
  }
}
