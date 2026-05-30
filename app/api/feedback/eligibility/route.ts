import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { fetchFeedbackEligibilityForUser } from "@/lib/feedback/surveyServer";

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "unauthorized", message: "Iniciá sesión." },
        { status: 401 }
      );
    }

    const eligibility = await fetchFeedbackEligibilityForUser(user.id);
    return NextResponse.json(eligibility);
  } catch (e) {
    console.error("[feedback/eligibility]", e);
    return NextResponse.json(
      { error: "server_error", message: "No se pudo verificar elegibilidad." },
      { status: 500 }
    );
  }
}
