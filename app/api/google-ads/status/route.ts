import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { getUserGoogleAdsLink } from "@/lib/googleAds/client";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Iniciá sesión." },
      { status: 401 }
    );
  }

  try {
    const link = await getUserGoogleAdsLink(user.id);
    return NextResponse.json({
      connected: link.connected,
      accountLinked: link.accountLinked,
      customer_id: link.customer_id,
      login_customer_id: link.login_customer_id,
    });
  } catch (e) {
    console.error("[api/google-ads/status]", e);
    return NextResponse.json(
      { error: "server_error", message: "No se pudo verificar la conexión." },
      { status: 500 }
    );
  }
}
