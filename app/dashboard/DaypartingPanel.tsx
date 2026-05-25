"use client";

import { useMemo, useState } from "react";
import {
  X,
  Clock,
  Check,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  TrendingDown,
  Pause,
} from "lucide-react";
import type { DaypartingReporte } from "../../lib/motorMora";
import {
  construirPlanDayparting,
  labelAccionDayparting,
  type DaypartingApplyPlan,
  type DaypartingApplyResult,
} from "../../lib/daypartingSafeApply";
import DaypartingHeatmapGrid from "./DaypartingHeatmapGrid";

interface DaypartingPanelProps {
  dayparting: DaypartingReporte | null;
  open: boolean;
  auditId?: string | number | null;
  aplicadosIds: Set<string>;
  onClose: () => void;
  onAplicar?: (franjaIds: string[], planId?: string) => void;
}

function moneyFmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function DaypartingPanel({
  dayparting,
  open,
  auditId,
  aplicadosIds,
  onClose,
  onAplicar,
}: DaypartingPanelProps) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [resultado, setResultado] = useState<DaypartingApplyResult | null>(null);
  const [aplicadosAbierto, setAplicadosAbierto] = useState(true);

  const franjasPendientes = useMemo(() => {
    if (!dayparting) return [];
    return dayparting.franjas_problematicas.filter(f => !aplicadosIds.has(f.id));
  }, [dayparting, aplicadosIds]);

  const franjasAplicadas = useMemo(() => {
    if (!dayparting) return [];
    return dayparting.franjas_problematicas.filter(f => aplicadosIds.has(f.id));
  }, [dayparting, aplicadosIds]);

  const franjasSeleccionadas = useMemo(
    () => franjasPendientes.filter(f => seleccionados.has(f.id)),
    [franjasPendientes, seleccionados]
  );

  const plan = useMemo<DaypartingApplyPlan | null>(() => {
    if (franjasSeleccionadas.length === 0) return null;
    return construirPlanDayparting(franjasSeleccionadas);
  }, [franjasSeleccionadas]);

  const cerrarPanel = () => {
    setMostrarConfirmacion(false);
    setResultado(null);
    onClose();
  };

  const toggle = (id: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const seleccionarTodas = () => {
    setSeleccionados(new Set(franjasPendientes.map(f => f.id)));
  };

  const limpiarSeleccion = () => setSeleccionados(new Set());

  const abrirReprogramarRapido = () => {
    if (franjasPendientes.length === 0) return;
    setSeleccionados(new Set(franjasPendientes.map(f => f.id)));
    setMostrarConfirmacion(true);
  };

  const aplicar = async () => {
    if (!plan) return;
    setAplicando(true);
    const ids = franjasSeleccionadas.map(f => f.id);
    try {
      const res = await fetch("/api/dayparting/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userConfirmed: true }),
      });
      const data: DaypartingApplyResult | { error: string } = await res.json();
      if (!res.ok) {
        const err = (data as { error?: string }).error || "No se pudo aplicar.";
        setResultado({
          status: "cancelado",
          message: err,
          applied: [],
          rejected: plan.items.map(item => ({ item, reason: err })),
        });
        return;
      }
      const ok = data as DaypartingApplyResult;
      setResultado(ok);
      if (ok.status === "aplicado") {
        onAplicar?.(ids, plan.id);
        setSeleccionados(new Set());
        setAplicadosAbierto(true);
        setMostrarConfirmacion(false);
      }
    } catch {
      setResultado({
        status: "bloqueado_sin_conexion",
        message: "No se pudo conectar con el servidor.",
        applied: [],
        rejected: plan.items.map(item => ({
          item,
          reason: "Sin conexión",
        })),
      });
    } finally {
      setAplicando(false);
    }
  };

  if (!open) return null;

  const ahorroPendiente = franjasPendientes.reduce((acc, f) => acc + f.gasto_desperdiciado, 0);
  const patron = dayparting?.patron_principal;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end print:hidden">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm cursor-pointer"
        onClick={cerrarPanel}
      />

      <div className="relative w-full max-w-3xl h-full bg-[#1C1917] border-l border-[#44403C] shadow-[0_0_50px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-[#44403C] bg-[#292524] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#D4A843]/15 border border-[#D4A843]/30 flex items-center justify-center">
                <Clock size={20} className="text-[#D4A843]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A843]">Dayparting</p>
                <h2 className="text-xl font-black text-[#F5F0EB]">Patrones históricos 7×24</h2>
                {auditId != null && (
                  <p className="text-[9px] text-[#A8A29E] font-bold mt-0.5">Auditoría #{auditId}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={cerrarPanel}
              className="w-9 h-9 rounded-xl bg-[#1C1917] border border-[#44403C] flex items-center justify-center text-[#A8A29E] hover:text-[#F5F0EB]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Franjas con fuga</p>
              <p className="text-2xl font-black text-[#E07070] mt-1">{franjasPendientes.length}</p>
            </div>
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Recuperable</p>
              <p className="text-2xl font-black text-[#D4A843] mt-1">{moneyFmt(ahorroPendiente)}</p>
            </div>
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Aplicadas</p>
              <p className="text-2xl font-black text-[#10B981] mt-1">{franjasAplicadas.length}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-6 md:px-8 py-4 bg-[#1C1917]">
          {!dayparting ? (
            <p className="text-[#A8A29E] text-sm text-center py-12">Sin datos de dayparting en esta auditoría.</p>
          ) : (
            <>
              <div className="shrink-0 w-full rounded-2xl border border-[#44403C] bg-[#292524] p-4 md:p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-3">
                  Matriz histórica 7×24 ({dayparting.ventana_dias_historico ?? 60} días)
                </p>
                <DaypartingHeatmapGrid heatmap={dayparting.heatmap} size="panel" />
              </div>

              <div className="shrink-0 rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 px-3 py-2.5 flex gap-2 mt-3">
                <ShieldCheck size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#A8A29E] font-medium leading-snug">
                  Fuga crítica solo si gasto acumulado ≥ CPA ref. ×2 y 0 conversiones en esa celda (día × hora).
                </p>
              </div>

              {patron && franjasPendientes.length > 0 && (
                <div className="shrink-0 mt-4 rounded-2xl border border-[#E07070]/35 bg-[#E07070]/10 p-4 flex flex-col gap-3">
                  <p className="text-xs text-[#F5F0EB] font-medium leading-relaxed">{patron.mensaje}</p>
                  <button
                    type="button"
                    onClick={abrirReprogramarRapido}
                    className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#E07070] text-[#F5F0EB] hover:bg-[#c85a5a] transition-colors"
                  >
                    Reprogramar horarios (1-click)
                  </button>
                </div>
              )}

              <div className="flex-1 min-h-0 flex flex-col gap-2 mt-4 overflow-hidden">
              {franjasPendientes.length === 0 && franjasAplicadas.length === 0 ? (
                <p className="text-center text-[#A8A29E] text-sm py-8">No se detectaron franjas problemáticas.</p>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1">
                  {franjasPendientes.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] sticky top-0 bg-[#1C1917] py-1 z-10">
                        Franjas problemáticas ({franjasPendientes.length})
                      </p>
                      {franjasPendientes.map(f => {
                        const checked = seleccionados.has(f.id);
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => toggle(f.id)}
                            className={`text-left rounded-2xl border p-4 flex gap-3 transition-all ${
                              checked
                                ? "border-[#D4A843]/70 ring-2 ring-[#D4A843]/30 bg-[#292524]"
                                : "border-[#44403C] bg-[#292524] hover:border-[#D4A843]/40"
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                checked ? "bg-[#D4A843] border-[#D4A843]" : "border-[#A8A29E] bg-[#1C1917]"
                              }`}
                            >
                              {checked && <Check size={14} strokeWidth={3} className="text-[#0a0a0a]" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-[#F5F0EB]">{f.etiqueta}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-[#E07070]/40 bg-[#E07070]/10 text-[#E07070]">
                                  {labelAccionDayparting(f.accion_recomendada)}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#A8A29E] mt-1">{f.motivo}</p>
                              <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-bold text-[#A8A29E]">
                                <span>
                                  Gasto · <span className="text-[#F5F0EB]">{moneyFmt(f.gasto)}</span>
                                </span>
                                <span>
                                  Conv. · <span className="text-[#F5F0EB]">{f.conversiones}</span>
                                </span>
                                <span>
                                  Recuperable ·{" "}
                                  <span className="text-[#D4A843]">{moneyFmt(f.gasto_desperdiciado)}</span>
                                </span>
                              </div>
                              {f.campanas_top.length > 0 && (
                                <p className="text-[9px] text-[#A8A29E] mt-2 truncate">
                                  Campañas: {f.campanas_top.map(c => c.campana_nombre).join(" · ")}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {franjasAplicadas.length > 0 && (
                    <div className="rounded-2xl border border-[#10B981]/25 bg-[#292524] overflow-hidden shrink-0">
                      <button
                        type="button"
                        onClick={() => setAplicadosAbierto(v => !v)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left"
                      >
                        <span className="text-xs font-black uppercase tracking-widest text-[#10B981] flex items-center gap-2">
                          <CheckCircle2 size={14} /> Aplicadas ({franjasAplicadas.length})
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-[#10B981] transition-transform ${aplicadosAbierto ? "rotate-180" : ""}`}
                        />
                      </button>
                      {aplicadosAbierto && (
                        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-[#10B981]/15 pt-3">
                          {franjasAplicadas.map(f => (
                            <div
                              key={f.id}
                              className="rounded-xl border border-[#10B981]/20 bg-[#10B981]/5 p-3 opacity-75"
                            >
                              <p className="text-sm font-black text-[#A8A29E] line-through">{f.etiqueta}</p>
                              <p className="text-[10px] text-[#A8A29E] mt-1">{moneyFmt(f.gasto_desperdiciado)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {resultado && (
                <div
                  className={`shrink-0 rounded-2xl border p-3 text-sm font-medium ${
                    resultado.status === "aplicado"
                      ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]"
                      : "border-[#E07070]/30 bg-[#E07070]/10 text-[#E07070]"
                  }`}
                >
                  {resultado.message}
                </div>
              )}
              </div>
            </>
          )}
        </div>

        {dayparting && franjasPendientes.length > 0 && (
          <div className="px-6 md:px-8 py-4 border-t border-[#44403C] bg-[#292524] flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#A8A29E]">
                <span className="text-[#F5F0EB] font-black">{seleccionados.size}</span> seleccionadas
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={seleccionarTodas}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB]"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={limpiarSeleccion}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB]"
                >
                  Ninguna
                </button>
              </div>
            </div>
            <button
              type="button"
              disabled={!plan || aplicando}
              onClick={() => setMostrarConfirmacion(true)}
              className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#D4A843] text-[#0a0a0a] hover:bg-[#e6bd55] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {aplicando ? "Aplicando…" : "Aplicar ajustes en Google Ads"}
            </button>
          </div>
        )}
      </div>

      {mostrarConfirmacion && plan && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0a0a0a]/50 backdrop-blur-sm"
            onClick={() => !aplicando && setMostrarConfirmacion(false)}
          />
          <div className="relative w-full max-w-lg bg-[#FDE8D3] rounded-3xl p-6 shadow-2xl border border-[#CFD6C4]">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#E07070]/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-[#E07070]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0a0a0a]">Cambio sensible en horarios</h3>
                <p className="text-xs text-[#4B5563] font-medium mt-1">{plan.consentLabel}</p>
              </div>
            </div>

            <ul className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {plan.items.map(item => (
                <li
                  key={item.franja_id}
                  className="text-xs bg-white/60 rounded-xl px-3 py-2 border border-[#CFD6C4]/60 flex justify-between gap-2"
                >
                  <span className="font-bold text-[#0a0a0a]">{item.etiqueta}</span>
                  <span className="text-[#4B5563] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                    {item.accion === "pausar_trafico" ? (
                      <Pause size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {labelAccionDayparting(item.accion)}
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-[10px] text-[#4B5563] font-bold uppercase tracking-widest mb-4">
              Recuperación estimada: {moneyFmt(plan.totales.ahorro_estimado)}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={aplicando}
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-[#CFD6C4] text-[#4B5563]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={aplicando}
                onClick={aplicar}
                className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-[#0a0a0a] text-[#FDE8D3]"
              >
                {aplicando ? "Registrando…" : "Confirmar y aplicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
