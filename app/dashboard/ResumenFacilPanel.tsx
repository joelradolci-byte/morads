"use client";

import { useMemo, useState } from "react";
import {
  X,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  TrendingDown,
  ListChecks,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import MoraOverlay from "./MoraOverlay";
import {
  fraseSaludCuenta,
  resolverAccionHallazgo,
  tituloHumanoHallazgo,
  textoHallazgoParaUsuario,
} from "../../lib/resumenFacil";
import {
  construirPlanHallazgo,
  type HallazgoApplyResult,
} from "../../lib/hallazgoSafeApply";

export type ItemResumenHallazgo = {
  id_rastreo: string;
  titulo: string;
  descripcion_simple?: string;
  descripcion_tecnica?: string;
  descripcion?: string;
  problema_detalle?: string;
  sugerencia?: string;
  razonamiento?: string;
  resultado_esperado?: string;
  tipo: "critico" | "mejora";
};

interface ResumenFacilPanelProps {
  open: boolean;
  onClose: () => void;
  score: number;
  gastoDesperdiciado: number;
  porcentajeDesperdiciado: number;
  /** Narrativa Sonnet (resumen.ejecutivo) si existe */
  resumenEjecutivo?: string;
  items: ItemResumenHallazgo[];
  lenguajeClaro: boolean;
  onResolver: (item: ItemResumenHallazgo) => void;
}

function scoreVisual(score: number) {
  if (score < 50) {
    return {
      label: "Crítico",
      ring: "border-[#FECACA] bg-[#FEE2E2] text-[#B91C1C]",
      chip: "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]",
      icon: AlertTriangle,
    };
  }
  if (score < 80) {
    return {
      label: "Atención",
      ring: "border-[#FDE68A] bg-[#FEF3C7] text-[#B45309]",
      chip: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
      icon: Zap,
    };
  }
  return {
    label: "Saludable",
    ring: "border-[#A7F3D0] bg-[#D1FAE5] text-[#047857]",
    chip: "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]",
    icon: ListChecks,
  };
}

export default function ResumenFacilPanel({
  open,
  onClose,
  score,
  gastoDesperdiciado,
  porcentajeDesperdiciado,
  resumenEjecutivo,
  items,
  lenguajeClaro,
  onResolver,
}: ResumenFacilPanelProps) {
  const [copiadoIdx, setCopiadoIdx] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState<Record<string, boolean>>({});
  const [aplicandoId, setAplicandoId] = useState<string | null>(null);
  const [resultById, setResultById] = useState<Record<string, HallazgoApplyResult | null>>({});

  const fraseSalud = useMemo(() => {
    const ejecutivo = (resumenEjecutivo || "").trim();
    if (ejecutivo) return ejecutivo;
    return fraseSaludCuenta(score, gastoDesperdiciado, porcentajeDesperdiciado);
  }, [resumenEjecutivo, score, gastoDesperdiciado, porcentajeDesperdiciado]);

  const visual = useMemo(() => scoreVisual(score), [score]);
  const ScoreIcon = visual.icon;

  const urgentes = items.filter((i) => i.tipo === "critico").length;
  const mejoras = items.filter((i) => i.tipo === "mejora").length;

  if (!open) return null;

  const copiarItem = async (idx: number, texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoIdx(idx);
      setTimeout(() => setCopiadoIdx(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const gastoFmt =
    gastoDesperdiciado > 0
      ? `$${Math.round(gastoDesperdiciado).toLocaleString()}`
      : "—";

  const labelToolCta = (accion: string) => {
    switch (accion) {
      case "destripador":
        return "Abrir destripador";
      case "dayparting":
        return "Abrir mapa de horarios";
      case "simulador":
        return "Abrir simulador";
      case "robin_hood":
        return "Ver Robin Hood";
      default:
        return "Ver detalle";
    }
  };

  const pasosCortos = (item: ItemResumenHallazgo) => {
    const sug = (item.sugerencia || "").trim();
    const base = [
      "Abrí Google Ads y entrá a la cuenta correcta.",
      "Buscá el elemento afectado (campaña / grupo / keyword).",
      sug ? `Aplicá este cambio: ${sug}` : "Aplicá el cambio recomendado por Mora en esa sección.",
      "Guardá y verificá el impacto en 24–72hs.",
    ];
    const accion = resolverAccionHallazgo(item.id_rastreo);
    if (accion === "destripador") {
      return [
        "Andá a Palabras clave → Términos de búsqueda.",
        "Seleccioná términos con gasto y baja intención.",
        "Agregá negativos y guardá.",
      ];
    }
    if (accion === "dayparting") {
      return [
        "Andá a Programación de anuncios.",
        "Reducí puja o pausá franjas con fuga.",
        "Guardá y monitoreá CPA/ROAS.",
      ];
    }
    if (accion === "simulador") {
      return [
        "Andá a Campañas → Presupuestos.",
        "Reducí presupuesto en campañas flojas.",
        "Mové inversión a campañas que rinden.",
      ];
    }
    return base;
  };

  const copiarPasoAPaso = async (item: ItemResumenHallazgo, idx: number) => {
    const titulo = lenguajeClaro
      ? tituloHumanoHallazgo(item.id_rastreo, item.titulo)
      : item.titulo;
    const pasos = pasosCortos(item);
    await copiarItem(idx, `${titulo}\n\nPaso a paso:\n${pasos.map((p, i) => `${i + 1}. ${p}`).join("\n")}`);
  };

  const aplicarHallazgo = async (item: ItemResumenHallazgo) => {
    setAplicandoId(item.id_rastreo);
    setResultById((prev) => ({ ...prev, [item.id_rastreo]: null }));
    const plan = construirPlanHallazgo({
      hallazgo_id: item.id_rastreo,
      title: item.titulo,
      riskLevel: item.tipo === "critico" ? "alto" : "medio",
      steps: pasosCortos(item),
      reason:
        item.razonamiento ||
        "Mora detectó una oportunidad con impacto en eficiencia y performance.",
      expectedImpact: item.resultado_esperado || "Mejora de eficiencia y performance.",
      payload: {
        id_rastreo: item.id_rastreo,
        sugerencia: item.sugerencia || item.descripcion_simple || item.descripcion_tecnica || item.titulo,
        tipo: item.tipo,
      },
    });

    try {
      const res = await fetch("/api/hallazgos/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userConfirmed: true }),
      });
      const data = (await res.json()) as HallazgoApplyResult | { error?: string };
      if (!res.ok) {
        const msg =
          typeof data === "object" && data && "error" in data && typeof data.error === "string"
            ? data.error
            : "No se pudo registrar la confirmación.";
        setResultById((prev) => ({
          ...prev,
          [item.id_rastreo]: { status: "cancelado", message: msg },
        }));
        return;
      }
      setResultById((prev) => ({ ...prev, [item.id_rastreo]: data as HallazgoApplyResult }));
      setConfirmOpen((prev) => ({ ...prev, [item.id_rastreo]: false }));
    } catch {
      setResultById((prev) => ({
        ...prev,
        [item.id_rastreo]: {
          status: "bloqueado_sin_conexion",
          message: "No se pudo conectar con el servidor.",
        },
      }));
    } finally {
      setAplicandoId(null);
    }
  };

  return (
    <MoraOverlay open={open} variant="resumen" onClose={onClose} zIndex={130}>
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 relative overflow-hidden border-b border-[#E5E7EB] bg-gradient-to-br from-[#FFFBEB] via-[#FAFAFA] to-[#E0E7FF]/30 px-6 md:px-8 py-6 md:py-7">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-[#F3C3B2]/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-6 bottom-0 w-32 h-32 rounded-full bg-[#E0E7FF]/40 blur-2xl pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className={`w-16 h-16 md:w-[4.5rem] md:h-[4.5rem] rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 shadow-sm ${visual.ring}`}
              >
                <span className="text-2xl md:text-3xl font-black leading-none">{score}</span>
                <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-80">
                  /100
                </span>
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-9 h-9 rounded-xl bg-[#E0E7FF] flex items-center justify-center">
                    <BookOpen size={18} className="text-[#0a0a0a]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6366F1]">
                    Resumen fácil
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${visual.chip}`}
                  >
                    {visual.label}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[#0a0a0a] mt-2 leading-tight">
                  Tu cuenta en criollo
                </h2>
                <p className="text-sm md:text-base text-[#4B5563] mt-2 leading-relaxed font-medium max-w-xl">
                  {fraseSalud}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-10 h-10 rounded-xl border border-[#E5E7EB] bg-white/80 flex items-center justify-center text-[#4B5563] hover:bg-white"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="relative flex flex-wrap gap-2 mt-5">
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#FECACA] bg-[#FEE2E2]/60 px-3 py-2">
              <TrendingDown size={14} className="text-[#B91C1C] shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#B91C1C]">
                Gasto desperdiciado
              </span>
              <span className="text-sm font-black text-[#0a0a0a]">{gastoFmt}</span>
              {porcentajeDesperdiciado > 0 && (
                <span className="text-xs font-bold text-[#B91C1C]">
                  ({porcentajeDesperdiciado.toFixed(0)}%)
                </span>
              )}
            </div>
            {urgentes > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#FECACA] bg-white px-3 py-2">
                <AlertTriangle size={14} className="text-[#B91C1C]" />
                <span className="text-xs font-black text-[#0a0a0a]">
                  {urgentes} urgente{urgentes !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {mejoras > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#FDE68A] bg-white px-3 py-2">
                <Zap size={14} className="text-[#B45309]" />
                <span className="text-xs font-black text-[#0a0a0a]">
                  {mejoras} mejora{mejoras !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white/70 px-3 py-2">
              <ScoreIcon size={14} className="text-[#4B5563]" />
              <span className="text-[10px] font-bold text-[#8A968C]">
                Los números del dashboard no cambian — acá te explicamos qué hacer.
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 md:px-8 py-6 bg-[#FAFAFA]">
          <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-[#4B5563] text-center py-12">
              Corré una auditoría para ver tu resumen en lenguaje claro.
            </p>
          ) : (
            <>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#4B5563] flex items-center gap-2">
                <ListChecks size={14} />
                Lo más urgente — tocá para ver el detalle completo
              </p>
              {items.map((item, idx) => {
                const titulo = lenguajeClaro
                  ? tituloHumanoHallazgo(item.id_rastreo, item.titulo)
                  : item.titulo;
                const cuerpo = textoHallazgoParaUsuario(item, lenguajeClaro);
                const esCritico = item.tipo === "critico";
                const accion = resolverAccionHallazgo(item.id_rastreo);
                const esTool =
                  accion === "destripador" ||
                  accion === "dayparting" ||
                  accion === "simulador" ||
                  accion === "robin_hood";
                const pasos = pasosCortos(item);
                const confirm = Boolean(confirmOpen[item.id_rastreo]);
                const result = resultById[item.id_rastreo] ?? null;
                return (
                  <div
                    key={item.id_rastreo}
                    className={`shrink-0 rounded-2xl border bg-white p-6 md:p-7 shadow-sm relative overflow-hidden break-words ${
                      esCritico ? "border-[#FECACA]" : "border-[#FDE68A]/80"
                    }`}
                  >
                    <div
                      className={`absolute top-0 left-0 w-1.5 h-full ${
                        esCritico ? "bg-[#E66767]" : "bg-[#EAB308]"
                      }`}
                    />
                    <div className="pl-2">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            esCritico
                              ? "bg-[#FEE2E2] border border-[#FECACA]"
                              : "bg-[#FEF3C7] border border-[#FDE68A]"
                          }`}
                        >
                          {esCritico ? (
                            <AlertTriangle size={16} className="text-[#B91C1C]" />
                          ) : (
                            <Zap size={16} className="text-[#B45309]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                              esCritico
                                ? "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]"
                                : "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
                            }`}
                          >
                            {esCritico ? "Urgente" : "Mejora"}
                          </span>
                          <h3 className="text-base md:text-lg font-black text-[#0a0a0a] mt-2 leading-snug">
                            {titulo}
                          </h3>
                          <p className="text-sm md:text-base text-[#4B5563] mt-2 leading-relaxed">
                            {cuerpo}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-6">
                        <button
                          type="button"
                          onClick={() => onResolver(item)}
                          className="flex-1 min-w-[180px] py-3.5 px-4 rounded-xl bg-[#0a0a0a] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#292524] flex items-center justify-center gap-2"
                        >
                          {esTool ? (
                            <>
                              <Wrench size={14} /> {labelToolCta(accion)}
                            </>
                          ) : (
                            <>
                              Ver detalle <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copiarItem(idx, `${titulo}\n\n${cuerpo}`)}
                          className="py-3.5 px-4 rounded-xl border border-[#E5E7EB] text-[11px] font-black uppercase tracking-widest text-[#4B5563] hover:bg-[#F4F4F5] flex items-center gap-1.5"
                        >
                          {copiadoIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                          {copiadoIdx === idx ? "Copiado" : "Copiar"}
                        </button>
                        {!esTool && (
                          <button
                            type="button"
                            onClick={() => copiarPasoAPaso(item, idx)}
                            className="py-3.5 px-4 rounded-xl border border-[#E5E7EB] text-[11px] font-black uppercase tracking-widest text-[#4B5563] hover:bg-[#F4F4F5] flex items-center gap-1.5"
                          >
                            {copiadoIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                            Copiar paso a paso
                          </button>
                        )}
                      </div>

                      {!esTool && (
                        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_0.95fr] gap-3">
                          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#4B5563]">
                              Paso a paso
                            </p>
                            <ul className="mt-2 space-y-2">
                              {pasos.slice(0, 6).map((p, i) => (
                                <li
                                  key={i}
                                  className="flex gap-2 text-xs md:text-sm text-[#4B5563] font-medium"
                                >
                                  <span className="mt-0.5 w-5 h-5 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-[10px] font-black shrink-0">
                                    {i + 1}
                                  </span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#4B5563] flex items-center gap-2">
                              <ShieldCheck size={14} className="text-[#6366F1]" /> Aplicar con Mora
                            </p>
                            <p className="text-xs text-[#4B5563] font-medium mt-2 leading-relaxed">
                              Mora registra tu confirmación y deja un recibo. Cuando conectes Google Ads en
                              escritura, se aplicará con este mismo plan.
                            </p>
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmOpen((prev) => ({
                                    ...prev,
                                    [item.id_rastreo]: !Boolean(prev[item.id_rastreo]),
                                  }))
                                }
                                className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest border border-[#E5E7EB] text-[#0a0a0a] hover:bg-[#F4F4F5]"
                              >
                                {confirm ? "Ocultar confirmación" : "Ver confirmación"}
                              </button>
                              <button
                                type="button"
                                disabled={aplicandoId === item.id_rastreo}
                                onClick={() => aplicarHallazgo(item)}
                                className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest ${
                                  aplicandoId === item.id_rastreo
                                    ? "bg-[#E5E7EB] text-[#8A968C]"
                                    : "bg-[#0a0a0a] text-white hover:bg-[#292524]"
                                }`}
                              >
                                {aplicandoId === item.id_rastreo ? "Aplicando…" : "Aplicar con Mora"}
                              </button>
                            </div>

                            {confirm && (
                              <div className="mt-3 rounded-xl border border-[#E0E7FF]/60 bg-[#E0E7FF]/10 px-3 py-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#6366F1]">
                                  Confirmación explícita
                                </p>
                                <p className="text-xs text-[#4B5563] font-medium mt-1 leading-relaxed">
                                  Al confirmar, aceptás registrar este cambio para aplicarlo cuando haya
                                  escritura habilitada.
                                </p>
                              </div>
                            )}

                            {result && (
                              <div
                                className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${
                                  result.status === "aplicado"
                                    ? "border-[#A7F3D0] bg-[#D1FAE5] text-[#047857]"
                                    : "border-[#FDE68A] bg-[#FEF3C7] text-[#B45309]"
                                }`}
                              >
                                {result.message}
                                {result.receiptId && (
                                  <span className="block mt-1 font-mono text-[10px] opacity-80">
                                    Recibo: {result.receiptId}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          </div>
        </div>

        <div className="shrink-0 px-6 md:px-8 py-4 border-t border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F4F4F5]"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    </MoraOverlay>
  );
}
