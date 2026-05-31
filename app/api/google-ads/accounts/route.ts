import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import {
  GoogleAdsConfigError,
  GoogleAdsNotConnectedError,
  listAccessibleAccountsForUser,
} from "@/lib/googleAds/client";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Iniciá sesión." },
      { status: 401 }
    );
  }

  try {
    const accounts = await listAccessibleAccountsForUser(user.id);
    return NextResponse.json({ accounts });
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
    console.error("[api/google-ads/accounts]", err);
    return NextResponse.json(
      {
        error: "google_ads_error",
        message: "No se pudieron cargar las cuentas de Google Ads.",
      },
      { status: 502 }
    );
  }
}
