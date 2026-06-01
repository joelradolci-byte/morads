import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { createCheckoutUrl, isLemonConfigured } from "@/lib/billing/lemon";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isLemonConfigured()) {
    return NextResponse.json(
      {
        error: "billing_not_configured",
        message: "Los pagos no están configurados todavía. Contactá soporte.",
      },
      { status: 503 }
    );
  }

  if (!user.email) {
    return NextResponse.json(
      { error: "no_email", message: "Tu cuenta no tiene email asociado." },
      { status: 400 }
    );
  }

  try {
    const url = await createCheckoutUrl({
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json({ checkout_url: url });
  } catch (error) {
    console.error("[billing/checkout]", error);
    return NextResponse.json(
      { error: "checkout_failed", message: "No se pudo iniciar el pago." },
      { status: 500 }
    );
  }
}
