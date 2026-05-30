"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, BarChart3 } from "lucide-react";
import { moraAuthHeaders } from "@/lib/auth/client-headers";
import {
  FEATURE_BLOCKS,
  INTERES_ADMIN_OPTIONS,
  USAGE_LABELS,
  type FeatureBlockKey,
  type FeatureUsage,
} from "@/lib/feedback/features";

type Summary = {
  totalEncuestas: number;
  npsScore: number;
  npsBreakdown: { promoters: number; passives: number; detractors: number };
  blockStats: Record<FeatureBlockKey, Record<FeatureUsage, number>>;
  interesCounts: Record<string, number>;
  comentarios: { email: string | null; mensaje: string; created_at: string }[];
};

export default function EncuestasAdminClient() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/feedback/summary", {
          headers: await moraAuthHeaders(),
        });
        const json = (await res.json()) as Summary & { message?: string };
        if (!res.ok) {
          setError(json.message ?? "No autorizado o error de servidor.");
          return;
        }
        setData(json);
      } catch {
        setError("No se pudo cargar el resumen.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center text-[#4B5563] font-bold gap-2">
        <Loader2 className="animate-spin" size={20} /> Cargando encuestas...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] p-10 max-w-lg mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#4B5563] mb-8"
        >
          <ArrowLeft size={16} /> Volver al dashboard
        </Link>
        <p className="text-[#B91C1C] font-bold">{error ?? "Sin datos"}</p>
        <p className="text-sm text-[#4B5563] mt-4 font-medium">
          Configurá <code className="bg-[#F4F4F5] px-1 rounded">MORA_ADMIN_EMAILS</code>{" "}
          en Vercel/.env con tu email de login.
        </p>
      </div>
    );
  }

  const total = data.totalEncuestas || 1;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#0a0a0a] p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#4B5563] mb-6"
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#E0E7FF] flex items-center justify-center">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black">Encuestas Mora</h1>
            <p className="text-sm text-[#4B5563] font-medium">
              {data.totalEncuestas} respuesta{data.totalEncuestas !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#4B5563]">
              NPS
            </p>
            <p className="text-4xl font-black mt-2">{data.npsScore}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#4B5563] mb-3">
              Desglose
            </p>
            <div className="flex flex-wrap gap-4 text-sm font-bold">
              <span className="text-[#047857]">
                Promotores (9–10): {data.npsBreakdown.promoters}
              </span>
              <span className="text-[#B45309]">
                Pasivos (7–8): {data.npsBreakdown.passives}
              </span>
              <span className="text-[#B91C1C]">
                Detractores (0–6): {data.npsBreakdown.detractors}
              </span>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-black mb-4">Uso por bloque (% Mucho)</h2>
        <div className="space-y-4 mb-10">
          {FEATURE_BLOCKS.map((block) => {
            const stats = data.blockStats[block.key];
            const muchoPct = Math.round((stats.mucho / total) * 100);
            return (
              <div
                key={block.key}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-sm">{block.label}</span>
                  <span className="text-sm font-black text-[#6366F1]">
                    {muchoPct}% mucho
                  </span>
                </div>
                <div className="h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F3C3B2] rounded-full"
                    style={{ width: `${muchoPct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-[10px] font-bold text-[#8A968C]">
                  {(["mucho", "algo", "poco", "no_usado"] as FeatureUsage[]).map(
                    (u) => (
                      <span key={u}>
                        {USAGE_LABELS[u]}: {stats[u]}
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="text-lg font-black mb-4">Intereses marcados</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {INTERES_ADMIN_OPTIONS.filter((o) => !o.legacy).map((opt) => (
            <span
              key={opt.key}
              className="px-3 py-2 rounded-xl bg-[#FDE8D3] border border-[#F3C3B2]/40 text-xs font-bold"
            >
              {opt.label}: {data.interesCounts[opt.key] ?? 0}
            </span>
          ))}
        </div>
        {INTERES_ADMIN_OPTIONS.some(
          (o) => o.legacy && (data.interesCounts[o.key] ?? 0) > 0
        ) && (
          <>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A968C] mb-2">
              Opciones anteriores (histórico)
            </p>
            <div className="flex flex-wrap gap-2 mb-10">
              {INTERES_ADMIN_OPTIONS.filter((o) => o.legacy).map((opt) => {
                const count = data.interesCounts[opt.key] ?? 0;
                if (count === 0) return null;
                return (
                  <span
                    key={opt.key}
                    className="px-3 py-2 rounded-xl bg-[#F4F4F5] border border-[#E5E7EB] text-xs font-bold text-[#4B5563]"
                  >
                    {opt.label}: {count}
                  </span>
                );
              })}
            </div>
          </>
        )}
        {!INTERES_ADMIN_OPTIONS.some(
          (o) => o.legacy && (data.interesCounts[o.key] ?? 0) > 0
        ) && <div className="mb-10" />}

        <h2 className="text-lg font-black mb-4">Últimos comentarios</h2>
        <div className="space-y-3">
          {data.comentarios.length === 0 ? (
            <p className="text-sm text-[#4B5563] font-medium">Sin comentarios aún.</p>
          ) : (
            data.comentarios.map((c, i) => (
              <div
                key={`${c.created_at}-${i}`}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm"
              >
                <p className="text-[10px] font-black text-[#8A968C] uppercase tracking-widest mb-1">
                  {c.email ?? "—"} ·{" "}
                  {new Date(c.created_at).toLocaleDateString("es-AR")}
                </p>
                <p className="text-[#0a0a0a] font-medium leading-relaxed">
                  {c.mensaje}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
