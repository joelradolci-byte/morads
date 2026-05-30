"use client";

import { useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { moraAuthHeaders } from "@/lib/auth/client-headers";
import {
  FEATURE_BLOCKS,
  FEATURE_BLOCK_KEYS,
  INTERES_OPTIONS,
  USAGE_LABELS,
  type FeatureBlockKey,
  type FeatureUsage,
  type InteresActiveKey,
} from "@/lib/feedback/features";

const USAGE_OPTIONS: FeatureUsage[] = ["mucho", "algo", "poco", "no_usado"];

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EncuestaFeedbackModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Record<FeatureBlockKey, FeatureUsage>>(
    () =>
      Object.fromEntries(
        FEATURE_BLOCK_KEYS.map((k) => [k, "no_usado" as FeatureUsage])
      ) as Record<FeatureBlockKey, FeatureUsage>
  );
  const [intereses, setIntereses] = useState<Set<InteresActiveKey>>(new Set());
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canNext = useMemo(() => {
    if (step === 0) return nps !== null;
    if (step === 1) return true;
    return true;
  }, [step, nps]);

  const reset = () => {
    setStep(0);
    setNps(null);
    setRatings(
      Object.fromEntries(
        FEATURE_BLOCK_KEYS.map((k) => [k, "no_usado" as FeatureUsage])
      ) as Record<FeatureBlockKey, FeatureUsage>
    );
    setIntereses(new Set());
    setComentario("");
    setError(null);
  };

  const handleClose = () => {
    if (enviando) return;
    reset();
    onClose();
  };

  const toggleInteres = (key: InteresActiveKey) => {
    setIntereses((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const enviar = async () => {
    if (nps === null) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback/survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await moraAuthHeaders()),
        },
        body: JSON.stringify({
          nps,
          feature_ratings: ratings,
          intereses: [...intereses],
          comentario: comentario.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(json.message ?? "No se pudo enviar.");
        return;
      }
      reset();
      onSuccess();
      onClose();
    } catch {
      setError("Error de conexión. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-labelledby="encuesta-title"
        className="relative z-10 w-full sm:max-w-lg max-h-[92vh] overflow-hidden bg-[#FAFAF9] border border-[#E5E7EB] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col"
      >
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-[#E5E7EB] flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#6366F1]">
              Paso {step + 1} de 3
            </p>
            <h2
              id="encuesta-title"
              className="text-xl font-black text-[#0a0a0a] mt-1"
            >
              {step === 0 && "¿Recomendarías Mora?"}
              {step === 1 && "¿Qué tanto usás cada parte?"}
              {step === 2 && "Último paso (opcional)"}
            </h2>
            <p className="text-sm text-[#4B5563] font-medium mt-1">
              {step === 0 &&
                "Del 0 al 10, ¿con qué probabilidad se lo recomendarías a un colega?"}
              {step === 1 && "Un tap por bloque — 30 segundos."}
              {step === 2 &&
                "Elegí una o varias — nos ayuda a priorizar el roadmap."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 w-10 h-10 rounded-xl border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] hover:bg-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {step === 0 && (
            <div>
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, i) => i).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setNps(v)}
                    className={`aspect-square min-w-0 rounded-lg font-black text-xs sm:text-sm border transition-all ${
                      nps === v
                        ? "bg-[#F3C3B2] border-[#F3C3B2] text-[#0a0a0a] scale-105 shadow-md"
                        : "bg-white border-[#E5E7EB] text-[#4B5563] hover:border-[#E0E7FF]"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-2 px-0.5 text-[10px] font-bold text-[#8A968C]">
                <span>Nada probable</span>
                <span>Muy probable</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              {FEATURE_BLOCKS.map((block) => (
                <div key={block.key}>
                  <p className="text-sm font-black text-[#0a0a0a]">
                    {block.label}
                  </p>
                  <p className="text-[11px] text-[#8A968C] font-medium mb-2">
                    {block.hint}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {USAGE_OPTIONS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() =>
                          setRatings((prev) => ({ ...prev, [block.key]: u }))
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-colors ${
                          ratings[block.key] === u
                            ? "bg-[#E0E7FF] border-[#E0E7FF] text-[#0a0a0a]"
                            : "bg-[#F4F4F5] border-[#E5E7EB] text-[#4B5563] hover:bg-white"
                        }`}
                      >
                        {USAGE_LABELS[u]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B5563] mb-3">
                  ¿Qué haría Mora más útil para vos?
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTERES_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleInteres(opt.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        intereses.has(opt.key)
                          ? "bg-[#FDE8D3] border-[#F3C3B2] text-[#0a0a0a]"
                          : "bg-white border-[#E5E7EB] text-[#4B5563]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#4B5563] mb-2">
                  Comentario libre (opcional)
                </p>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Ej.: qué te costó, qué extrañás de otra herramienta, o una idea concreta..."
                  className="w-full h-28 p-4 bg-[#F4F4F5] border border-[#E5E7EB] rounded-2xl text-sm text-[#0a0a0a] font-medium resize-none focus:outline-none focus:border-[#E0E7FF]"
                  maxLength={2000}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm font-bold text-[#B91C1C]">{error}</p>
          )}
        </div>

        <div className="shrink-0 px-6 pb-6 pt-2 flex gap-3 border-t border-[#E5E7EB] bg-[#FAFAF9]">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={enviando}
              className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-[#E5E7EB] text-[#4B5563] font-bold text-xs uppercase tracking-widest"
            >
              <ChevronLeft size={16} /> Atrás
            </button>
          ) : (
            <div />
          )}
          {step < 2 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-[#E0E7FF] text-[#0a0a0a] font-black text-xs uppercase tracking-widest disabled:opacity-50"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={enviando || nps === null}
              onClick={() => void enviar()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F3C3B2] text-[#0a0a0a] font-black text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {enviando ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Enviando...
                </>
              ) : (
                "Enviar encuesta"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
