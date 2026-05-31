import { NextResponse } from "next/server";
import {
  GoogleAdsConfigError,
  GoogleAdsNotConnectedError,
} from "./client";
import { GoogleAdsApplyBlockedError } from "./applyContext";

export function googleAdsApplyErrorResponse(err: unknown): NextResponse {
  if (err instanceof GoogleAdsNotConnectedError) {
    return NextResponse.json(
      {
        status: "bloqueado_sin_conexion",
        error: "not_connected",
        message: err.message,
      },
      { status: 400 }
    );
  }
  if (err instanceof GoogleAdsApplyBlockedError) {
    return NextResponse.json(
      {
        status: "bloqueado_sin_conexion",
        error: err.code,
        message: err.message,
      },
      { status: 400 }
    );
  }
  if (err instanceof GoogleAdsConfigError) {
    return NextResponse.json(
      {
        status: "bloqueado_sin_conexion",
        error: "not_configured",
        message: err.message,
      },
      { status: 503 }
    );
  }
  console.error("[googleAds apply]", err);
  return NextResponse.json(
    { error: "google_ads_error", message: "Error inesperado al aplicar en Google Ads." },
    { status: 500 }
  );
}
