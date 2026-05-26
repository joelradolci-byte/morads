"use client";

import { useState } from "react";
import { X, Sparkles, Copy, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import type { AnuncioGeneradoValidado } from "../../lib/anunciosValidator";
import {
  formatearAnuncioParaCopiar,
  MAX_HEADLINE,
  MAX_DESCRIPTION,
} from "../../lib/anunciosValidator";
import type { AnunciosGenerarContexto } from "../api/anuncios/generar/route";

export type AdGeneratorContext = AnunciosGenerarContexto & {
  hallazgo_id?: string;
};

interface AdGeneratorPanelProps {
  open: boolean;
  contexto: AdGeneratorContext | null;
  onClose: () => void;
}

const TONOS: AdGeneratorContext["tono"][] = ["directo", "premium", "urgente", "educativo"];
const OBJETIVOS: AdGeneratorContext["objetivo"][] = [
  "escalar",
  "filtrar",
  "recuperar_relevancia",
  "test_ab",
];

export default function AdGeneratorPanel({ open, contexto, onClose }: AdGeneratorPanelProps) {
  const [tono, setTono] = useState<AdGeneratorContext["tono"]>("directo");
  const [objetivo, setObjetivo] = useState<AdGeneratorContext["objetivo"]>("escalar");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variantes, setVariantes] = useState<AnuncioGeneradoValidado[]>([]);
  const [copiadoIdx, setCopiadoIdx] = useState<number | null>(null);

  const generar = async () => {
    if (!contexto) return;
    setCargando(true);
    setError(null);
    setVariantes([]);
    try {
      const res = await fetch("/api/anuncios/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contexto,
          tono,
          objetivo,
          idioma_ui: "es",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "No se pudieron generar anuncios.");
        return;
      }
      setVariantes(data.variantes || []);
      try {
        sessionStorage.setItem(
          `mora_ads_${contexto.hallazgo_id || contexto.campana_nombre || "last"}`,
          JSON.stringify({ variantes: data.variantes, generado_en: data.generado_en })
        );
      } catch {
        /* ignore */
      }
    } catch {
      setError("Error de conexión. Reintentá en unos minutos.");
    } finally {
      setCargando(false);
    }
  };

  const copiarVariante = async (idx: number) => {
    const ad = variantes[idx];
    if (!ad) return;
    try {
      await navigator.clipboard.writeText(formatearAnuncioParaCopiar(ad));
      setCopiadoIdx(idx);
      setTimeout(() => setCopiadoIdx(null), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!open || !contexto) return null;

  return (
    <div className="fixed inset-0 z-[125] flex justify-end print:hidden">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl h-full bg-[#1C1917] border-l border-[#44403C] shadow-[0_0_50px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-[#44403C] bg-[#292524] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F3C3B2]/15 border border-[#F3C3B2]/30 flex items-center justify-center">
                <Sparkles size={20} className="text-[#F3C3B2]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#F3C3B2]">
                  Generador de anuncios
                </p>
                <h2 className="text-lg font-black text-[#F5F0EB] line-clamp-1">
                  {contexto.hallazgo_titulo || contexto.campana_nombre || "Desde auditoría"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#1C1917] border border-[#44403C] flex items-center justify-center text-[#A8A29E]"
            >
              <X size={18} />
            </button>
          </div>
          {contexto.hallazgo_descripcion && (
            <p className="text-[11px] text-[#A8A29E] mt-3 leading-snug line-clamp-3">
              {contexto.hallazgo_descripcion}
            </p>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          <div className="rounded-xl border border-[#F3C3B2]/20 bg-[#F3C3B2]/5 px-3 py-2 text-[10px] text-[#A8A29E]">
            Mora usa el diagnóstico de tu auditoría, no un prompt vacío.
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2">Tono</p>
            <div className="flex flex-wrap gap-2">
              {TONOS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTono(t)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${
                    tono === t
                      ? "bg-[#F3C3B2]/20 border-[#F3C3B2]/40 text-[#F3C3B2]"
                      : "border-[#44403C] text-[#A8A29E]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2">Objetivo</p>
            <div className="flex flex-wrap gap-2">
              {OBJETIVOS.map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setObjetivo(o)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border ${
                    objetivo === o
                      ? "bg-[#F3C3B2]/20 border-[#F3C3B2]/40 text-[#F3C3B2]"
                      : "border-[#44403C] text-[#A8A29E]"
                  }`}
                >
                  {o.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-[#E07070]/30 bg-[#E07070]/10 px-3 py-2 flex gap-2">
              <AlertTriangle size={14} className="text-[#E07070] shrink-0" />
              <p className="text-[11px] text-[#A8A29E]">{error}</p>
            </div>
          )}

          {variantes.map((ad, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#44403C] bg-[#292524] p-4 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-xs font-black text-[#F5F0EB]">{ad.enfoque}</p>
                  <p className="text-[9px] text-[#A8A29E] uppercase font-bold mt-0.5">
                    Score {ad.score_calidad}/100 · {ad.objetivo}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copiarVariante(idx)}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-[#44403C] text-[9px] font-black uppercase flex items-center gap-1 text-[#A8A29E] hover:text-[#F5F0EB]"
                >
                  {copiadoIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                  {copiadoIdx === idx ? "Ok" : "Copiar"}
                </button>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase text-[#A8A29E] mb-1">
                  Títulos (máx. {MAX_HEADLINE})
                </p>
                <ul className="space-y-1">
                  {ad.headlines.map((h, i) => (
                    <li
                      key={i}
                      className={`text-[11px] ${h.valid ? "text-[#F5F0EB]" : "text-[#E07070]"}`}
                    >
                      {h.texto}
                      {!h.valid && h.motivo && (
                        <span className="text-[9px] ml-1">({h.motivo})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase text-[#A8A29E] mb-1">
                  Descripciones (máx. {MAX_DESCRIPTION})
                </p>
                <ul className="space-y-1">
                  {ad.descriptions.map((d, i) => (
                    <li
                      key={i}
                      className={`text-[11px] ${d.valid ? "text-[#F5F0EB]" : "text-[#E07070]"}`}
                    >
                      {d.texto}
                    </li>
                  ))}
                </ul>
              </div>

              {ad.advertencias.length > 0 && (
                <p className="text-[9px] text-[#EAB308]">{ad.advertencias.join(" · ")}</p>
              )}
            </div>
          ))}

          <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 px-3 py-2 flex gap-2">
            <ShieldCheck size={14} className="text-[#10B981] shrink-0" />
            <p className="text-[10px] text-[#A8A29E] leading-snug">
              Revisá siempre el copy antes de publicar en Google Ads.
            </p>
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-[#44403C] bg-[#292524]">
          <button
            type="button"
            onClick={generar}
            disabled={cargando}
            className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            {cargando ? "Generando desde diagnóstico…" : variantes.length ? "Regenerar variantes" : "Generar anuncios"}
          </button>
        </div>
      </div>
    </div>
  );
}
