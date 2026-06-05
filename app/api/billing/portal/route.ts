import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { getCustomerPortalUrl, isLemonConfigured } from "@/lib/billing/lemon";
import { fetchSuscripcion } from "@/lib/billing/plan";

export async function GET(req: Request) {
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

  const row = await fetchSuscripcion(user.id);
  if (!row?.lemon_subscription_id && !row?.lemon_customer_id) {
    return NextResponse.json(
      {
        error: "no_subscription",
        message: "No encontramos una suscripción activa en Lemon Squeezy.",
      },
      { status: 404 }
    );
  }

  try {
    const portalUrl = await getCustomerPortalUrl({
      subscriptionId: row.lemon_subscription_id,
      customerId: row.lemon_customer_id,
    });

    if (!portalUrl) {
      return NextResponse.json(
        {
          error: "portal_unavailable",
          message: "No se pudo abrir el portal de Lemon. Probá de nuevo en unos minutos.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ portal_url: portalUrl });
  } catch (error) {
    console.error("[billing/portal]", error);
    return NextResponse.json(
      { error: "portal_failed", message: "No se pudo abrir el portal de suscripción." },
      { status: 500 }
    );
  }
}
