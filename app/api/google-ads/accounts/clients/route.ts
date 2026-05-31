import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import {
  GoogleAdsConfigError,
  GoogleAdsNotConnectedError,
  listChildAccountsUnderManager,
} from "@/lib/googleAds/client";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Iniciá sesión." },
      { status: 401 }
    );
  }

  const managerId = new URL(req.url).searchParams.get("manager_id")?.trim() ?? "";
  if (!/^\d+$/.test(managerId.replace(/-/g, ""))) {
    return NextResponse.json(
      { error: "validation", message: "manager_id inválido." },
      { status: 400 }
    );
  }

  try {
    const clients = await listChildAccountsUnderManager(user.id, managerId);
    return NextResponse.json({ clients });
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
    console.error("[api/google-ads/accounts/clients]", err);
    return NextResponse.json(
      {
        error: "google_ads_error",
        message: "No se pudieron cargar las cuentas bajo este administrador.",
      },
      { status: 502 }
    );
  }
}
