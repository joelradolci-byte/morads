import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import {
  GoogleAdsConfigError,
  GoogleAdsNotConnectedError,
  getUserGoogleAdsLink,
} from "@/lib/googleAds/client";
import { buildDatosAuditoriaFromGoogleAds } from "@/lib/googleAds/liveExtract";

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
    if (!link.connected || !link.refresh_token) {
      return NextResponse.json(
        { error: "not_connected", message: "Google Ads no conectado." },
        { status: 400 }
      );
    }
    if (!link.customer_id) {
      return NextResponse.json(
        {
          error: "account_not_linked",
          message: "Elegí una cuenta de Google Ads para auditar.",
        },
        { status: 400 }
      );
    }

    const datos = await buildDatosAuditoriaFromGoogleAds({
      refreshToken: link.refresh_token,
      customerId: link.customer_id,
      loginCustomerId: link.login_customer_id,
      marca_cliente: "Mora Academia",
      useFixtureMetrics: false,
    });

    return NextResponse.json(datos);
  } catch (err) {
    if (err instanceof GoogleAdsNotConnectedError) {
      return NextResponse.json(
        { error: "not_connected", message: err.message },
        { status: 400 }
      );
    }
    if (err instanceof GoogleAdsConfigError) {
      return NextResponse.json(
        { error: "not_configured", message: err.message },
        { status: 503 }
      );
    }
    console.error("[api/google-ads/audit-data]", err);
    return NextResponse.json(
      { error: "google_ads_error", message: "No se pudieron obtener datos." },
      { status: 502 }
    );
  }
}
