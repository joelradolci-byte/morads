import crypto from "crypto";

const LEMON_API = "https://api.lemonsqueezy.com/v1";

export function getLemonConfig() {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID?.trim();
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID?.trim();
  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  return { apiKey, storeId, variantId, webhookSecret, appUrl };
}

export function isLemonConfigured(): boolean {
  const c = getLemonConfig();
  return Boolean(c.apiKey && c.storeId && c.variantId);
}

export async function createCheckoutUrl(options: {
  userId: string;
  email: string;
}): Promise<string> {
  const { apiKey, storeId, variantId, appUrl } = getLemonConfig();
  if (!apiKey || !storeId || !variantId) {
    throw new Error("Lemon Squeezy no configurado");
  }

  const res = await fetch(`${LEMON_API}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_options: {
            embed: false,
            media: false,
          },
          checkout_data: {
            email: options.email,
            custom: {
              user_id: options.userId,
            },
          },
          product_options: {
            redirect_url: `${appUrl}/dashboard?checkout=success`,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: storeId },
          },
          variant: {
            data: { type: "variants", id: variantId },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lemon checkout failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const url = json.data?.attributes?.url;
  if (!url) throw new Error("Lemon no devolvió URL de checkout");
  return url;
}

export function verifyLemonWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const { webhookSecret } = getLemonConfig();
  if (!webhookSecret || !signatureHeader) return false;

  const digest = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string };
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      customer_id?: number;
      variant_id?: number;
      user_email?: string;
    };
  };
};

export function parseLemonUserId(payload: LemonWebhookPayload): string | null {
  const fromMeta = payload.meta?.custom_data?.user_id;
  if (typeof fromMeta === "string" && fromMeta.length > 0) return fromMeta;
  return null;
}
