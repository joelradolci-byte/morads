import { NextResponse } from "next/server";
import { ensureSuscripcionRow, startTrialIfEligible } from "@/lib/billing/plan";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getUserGoogleAdsLink, getUserGoogleAdsToken } from "@/lib/googleAds/client";

type LinkBody = {
  refresh_token?: string;
  customer_id?: string | null;
  login_customer_id?: string | null;
};

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Iniciá sesión." },
      { status: 401 }
    );
  }

  let body: LinkBody;
  try {
    body = (await req.json()) as LinkBody;
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "JSON inválido." },
      { status: 400 }
    );
  }

  const refreshToken =
    typeof body.refresh_token === "string" ? body.refresh_token.trim() : "";
  const customerId =
    typeof body.customer_id === "string" ? body.customer_id.trim() : "";
  const hasCustomerId = customerId.length > 0;
  const hasRefreshToken = refreshToken.length > 0;

  if (!hasRefreshToken && !hasCustomerId) {
    return NextResponse.json(
      {
        error: "validation",
        message: "Se requiere refresh_token o customer_id.",
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const userId = user.id;
  const userEmail = user.email ?? "";

  try {
    const admin = getSupabaseAdmin();
    if (userEmail) {
      await ensureSuscripcionRow(userId, userEmail);
    }

    async function maybeStartTrial(wasCustomerIdEmpty: boolean) {
      if (!hasCustomerId || !wasCustomerIdEmpty || !userEmail) return null;
      const result = await startTrialIfEligible(userId, userEmail);
      if (result.error === "trial_already_used") {
        return NextResponse.json(
          {
            error: "trial_already_used",
            message:
              "Este email ya usó la evaluación gratuita. Activá Pro para seguir usando Mora.",
          },
          { status: 403 }
        );
      }
      if (result.error === "confirm_email") {
        return NextResponse.json(
          {
            error: "confirm_email",
            message: "Confirmá tu email para activar la evaluación de 14 días.",
          },
          { status: 403 }
        );
      }
      return null;
    }

    if (hasRefreshToken) {
      const row: Record<string, unknown> = {
        user_id: user.id,
        refresh_token: refreshToken,
        actualizado_el: now,
      };

      if (body.customer_id !== undefined) {
        row.customer_id = hasCustomerId ? customerId : null;
      }
      if (body.login_customer_id !== undefined) {
        row.login_customer_id =
          typeof body.login_customer_id === "string" &&
          body.login_customer_id.trim()
            ? body.login_customer_id.trim()
            : null;
      }

      const priorLink = await getUserGoogleAdsLink(user.id);
      const wasEmpty = !priorLink?.customer_id;

      const { error } = await admin
        .from("google_ads_tokens")
        .upsert(row, { onConflict: "user_id" });

      if (error) {
        console.error("[api/google-ads/link]", error);
        return NextResponse.json(
          { error: "db_error", message: "No se pudo guardar la conexión." },
          { status: 500 }
        );
      }

      const trialBlock = await maybeStartTrial(wasEmpty && hasCustomerId);
      if (trialBlock) return trialBlock;

      return NextResponse.json({
        ok: true,
        trial_started: wasEmpty && hasCustomerId,
      });
    }

    const existingLink = await getUserGoogleAdsLink(user.id);
    if (!existingLink?.refresh_token) {
      return NextResponse.json(
        {
          error: "not_connected",
          message: "Conectá Google Ads antes de elegir una cuenta.",
        },
        { status: 400 }
      );
    }

    const loginCustomerId =
      body.login_customer_id === undefined
        ? undefined
        : typeof body.login_customer_id === "string" &&
            body.login_customer_id.trim()
          ? body.login_customer_id.trim()
          : null;

    const updateRow: Record<string, unknown> = {
      customer_id: customerId,
      actualizado_el: now,
    };
    if (loginCustomerId !== undefined) {
      updateRow.login_customer_id = loginCustomerId;
    }

    const wasEmpty = !existingLink.customer_id;

    const { error } = await admin
      .from("google_ads_tokens")
      .update(updateRow)
      .eq("user_id", user.id);

    if (error) {
      console.error("[api/google-ads/link]", error);
      return NextResponse.json(
        { error: "db_error", message: "No se pudo guardar la cuenta." },
        { status: 500 }
      );
    }

    const trialBlock = await maybeStartTrial(wasEmpty);
    if (trialBlock) return trialBlock;

    return NextResponse.json({ ok: true, trial_started: wasEmpty });
  } catch (e) {
    console.error("[api/google-ads/link]", e);
    return NextResponse.json(
      { error: "server_error", message: "Error interno." },
      { status: 500 }
    );
  }
}
