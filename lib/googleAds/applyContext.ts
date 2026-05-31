import {
  createCustomerClient,
  getGoogleAdsApiClient,
  getUserGoogleAdsLink,
  GoogleAdsConfigError,
  GoogleAdsNotConnectedError,
} from "./client";
import type { Customer } from "google-ads-api";

export type GoogleAdsApplyContext = {
  customer: Customer;
  customerId: string;
  refreshToken: string;
  loginCustomerId: string | null;
};

export class GoogleAdsApplyBlockedError extends Error {
  readonly code: "not_connected" | "account_not_linked" | "config";

  constructor(
    code: GoogleAdsApplyBlockedError["code"],
    message: string
  ) {
    super(message);
    this.name = "GoogleAdsApplyBlockedError";
    this.code = code;
  }
}

export function isApplyDryRun(): boolean {
  return process.env.GOOGLE_ADS_APPLY_DRY_RUN === "true";
}

export async function resolveApplyContext(
  userId: string
): Promise<GoogleAdsApplyContext> {
  let link;
  try {
    link = await getUserGoogleAdsLink(userId);
  } catch {
    throw new GoogleAdsApplyBlockedError(
      "config",
      "No se pudo leer la conexión con Google Ads."
    );
  }

  if (!link.connected || !link.refresh_token) {
    throw new GoogleAdsNotConnectedError();
  }
  if (!link.customer_id) {
    throw new GoogleAdsApplyBlockedError(
      "account_not_linked",
      "Elegí una cuenta de Google Ads antes de aplicar cambios."
    );
  }

  try {
    getGoogleAdsApiClient();
  } catch {
    throw new GoogleAdsConfigError();
  }

  const customerId = link.customer_id.replace(/-/g, "");
  const customer = createCustomerClient(
    link.refresh_token,
    customerId,
    link.login_customer_id
  );

  return {
    customer,
    customerId,
    refreshToken: link.refresh_token,
    loginCustomerId: link.login_customer_id,
  };
}
