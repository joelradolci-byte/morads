import { NextResponse } from "next/server";
import {
  activateProFromLemon,
  deactivatePro,
  ensureSuscripcionRow,
} from "@/lib/billing/plan";
import {
  parseLemonUserId,
  verifyLemonWebhookSignature,
  type LemonWebhookPayload,
} from "@/lib/billing/lemon";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyLemonWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "";
  const userId = parseLemonUserId(payload);
  const attrs = payload.data?.attributes;
  const subscriptionId = payload.data?.id ? String(payload.data.id) : undefined;

  if (!userId) {
    console.warn("[lemon-webhook] sin user_id en custom_data", eventName);
    return NextResponse.json({ ok: true, skipped: true });
  }

  const email = attrs?.user_email ?? "";
  if (email) {
    await ensureSuscripcionRow(userId, email);
  }

  const lemonPayload = {
    lemon_customer_id: attrs?.customer_id ? String(attrs.customer_id) : undefined,
    lemon_subscription_id: subscriptionId,
    lemon_variant_id: attrs?.variant_id ? String(attrs.variant_id) : undefined,
    lemon_status: attrs?.status,
  };

  if (
    eventName === "subscription_created" ||
    eventName === "subscription_updated" ||
    eventName === "subscription_payment_success"
  ) {
    const status = String(attrs?.status ?? "").toLowerCase();
    if (status === "active" || status === "on_trial" || eventName.includes("payment_success")) {
      await activateProFromLemon(userId, lemonPayload);
    }
  } else if (
    eventName === "subscription_cancelled" ||
    eventName === "subscription_expired"
  ) {
    await deactivatePro(userId, "cancelada");
  } else if (eventName === "subscription_payment_failed") {
    await deactivatePro(userId, "past_due");
  }

  return NextResponse.json({ ok: true });
}
