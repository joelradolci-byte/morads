import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { calcNpsScore, isAdminEmail } from "@/lib/feedback/admin";
import {
  FEATURE_BLOCK_KEYS,
  FEATURE_BLOCKS,
  INTERES_OPTIONS,
  type FeatureBlockKey,
  type FeatureUsage,
} from "@/lib/feedback/features";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type EncuestaRow = {
  nps: number | null;
  feature_ratings: Record<string, FeatureUsage> | null;
  intereses: string[] | null;
  mensaje: string | null;
  usuario_email: string | null;
  created_at: string;
};

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: "forbidden", message: "No autorizado." },
        { status: 403 }
      );
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("feedback")
      .select("nps, feature_ratings, intereses, mensaje, usuario_email, created_at")
      .eq("tipo", "encuesta")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as EncuestaRow[];
    const npsScores = rows
      .map((r) => r.nps)
      .filter((n): n is number => typeof n === "number");

    const blockStats: Record<
      FeatureBlockKey,
      Record<FeatureUsage, number>
    > = Object.fromEntries(
      FEATURE_BLOCK_KEYS.map((k) => [
        k,
        { mucho: 0, algo: 0, poco: 0, no_usado: 0 },
      ])
    ) as Record<FeatureBlockKey, Record<FeatureUsage, number>>;

    for (const row of rows) {
      const ratings = row.feature_ratings;
      if (!ratings || typeof ratings !== "object") continue;
      for (const key of FEATURE_BLOCK_KEYS) {
        const v = ratings[key];
        if (v && blockStats[key][v] !== undefined) {
          blockStats[key][v] += 1;
        }
      }
    }

    const interesCounts: Record<string, number> = {};
    for (const opt of INTERES_OPTIONS) {
      interesCounts[opt.key] = 0;
    }
    for (const row of rows) {
      if (!Array.isArray(row.intereses)) continue;
      for (const k of row.intereses) {
        if (typeof k === "string" && k in interesCounts) {
          interesCounts[k] += 1;
        }
      }
    }

    const promoters = npsScores.filter((s) => s >= 9).length;
    const passives = npsScores.filter((s) => s === 7 || s === 8).length;
    const detractors = npsScores.filter((s) => s <= 6).length;

    const comentarios = rows
      .filter((r) => (r.mensaje ?? "").trim().length > 0)
      .slice(0, 20)
      .map((r) => ({
        email: r.usuario_email,
        mensaje: (r.mensaje ?? "").trim(),
        created_at: r.created_at,
      }));

    return NextResponse.json({
      totalEncuestas: rows.length,
      npsScore: calcNpsScore(npsScores),
      npsBreakdown: { promoters, passives, detractors },
      blockStats,
      blockLabels: FEATURE_BLOCKS.map((b) => ({
        key: b.key,
        label: b.label,
      })),
      interesCounts,
      interesLabels: INTERES_OPTIONS,
      comentarios,
    });
  } catch (e) {
    console.error("[admin/feedback/summary]", e);
    return NextResponse.json(
      { error: "server_error", message: "Error cargando resumen." },
      { status: 500 }
    );
  }
}
