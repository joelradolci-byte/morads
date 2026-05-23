"use client";

import { useMemo, useState } from "react";
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Sparkles,
  Lock,
  Target,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import type {
  DestripadorReporte,
  DestripadorTermino,
  CategoriaIntencionId,
} from "../../lib/motorMora";
import { terminoKey } from "../../lib/destripadorEstado";
import {
  construirPlanNegativos,
  formatearNegativosParaGoogleAds,
  type NegativoMatchType,
  type NegativoScope,
  type NegativosApplyPlan,
  type NegativosApplyResult,
} from "../../lib/destripadorSafeApply";

interface DestripadorPanelProps {
  destripador: DestripadorReporte | null;
  open: boolean;
  auditId?: string | number | null;
  mitigadosKeys: Set<string>;
  copiadosKeys: Set<string>;
  onClose: () => void;
  onMitigar?: (keys: string[], planId?: string) => void;
  onCopiar?: (keys: string[]) => void;
  onApplied?: (plan: NegativosApplyPlan, result: NegativosApplyResult) => void;
}

const COLOR_CATEGORIA: Record<CategoriaIntencionId, { dot: string; chip: string; border: string }> = {
  gratuita_educativa: {
    dot: "bg-[#F3C3B2]",
    chip: "bg-[#F3C3B2]/10 text-[#F3C3B2] border-[#F3C3B2]/30",
    border: "border-[#F3C3B2]/30",
  },
  baja_calidad: {
    dot: "bg-[#EAB308]",
    chip: "bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/30",
    border: "border-[#EAB308]/30",
  },
  competencia: {
    dot: "bg-[#E07070]",
    chip: "bg-[#E07070]/10 text-[#E07070] border-[#E07070]/30",
    border: "border-[#E07070]/30",
  },
  soporte_empleo: {
    dot: "bg-blue-400",
    chip: "bg-blue-400/10 text-blue-400 border-blue-400/30",
    border: "border-blue-400/30",
  },
  otro: {
    dot: "bg-[#A8A29E]",
    chip: "bg-[#A8A29E]/10 text-[#A8A29E] border-[#A8A29E]/30",
    border: "border-[#A8A29E]/30",
  },
};

function moneyFmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function keysFromTerminos(terminos: DestripadorTermino[]): string[] {
  return terminos.map(terminoKey);
}

export default function DestripadorPanel({
  destripador,
  open,
  auditId,
  mitigadosKeys,
  copiadosKeys,
  onClose,
  onMitigar,
  onCopiar,
  onApplied,
}: DestripadorPanelProps) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [matchType, setMatchType] = useState<NegativoMatchType>("FRASE");
  const [scope, setScope] = useState<NegativoScope>("campana");
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaIntencionId | "todas">("todas");
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [copiadoBtn, setCopiadoBtn] = useState(false);
  const [resultado, setResultado] = useState<NegativosApplyResult | null>(null);
  const [aplicadosAbierto, setAplicadosAbierto] = useState(true);
  const [copiadosAbierto, setCopiadosAbierto] = useState(true);

  const terminosDisponibles = useMemo<DestripadorTermino[]>(() => {
    if (!destripador) return [];
    return destripador.terminos.filter(t => !t.protegido);
  }, [destripador]);

  // Aplicados tienen prioridad sobre copiados (si aplicaste, ya no es "solo copiado").
  const terminosAplicados = useMemo(
    () => terminosDisponibles.filter(t => mitigadosKeys.has(terminoKey(t))),
    [terminosDisponibles, mitigadosKeys]
  );

  const terminosCopiados = useMemo(
    () =>
      terminosDisponibles.filter(
        t => copiadosKeys.has(terminoKey(t)) && !mitigadosKeys.has(terminoKey(t))
      ),
    [terminosDisponibles, copiadosKeys, mitigadosKeys]
  );

  const terminosPendientes = useMemo(
    () =>
      terminosDisponibles.filter(
        t => !mitigadosKeys.has(terminoKey(t)) && !copiadosKeys.has(terminoKey(t))
      ),
    [terminosDisponibles, mitigadosKeys, copiadosKeys]
  );

  const terminosProtegidos = useMemo<DestripadorTermino[]>(() => {
    if (!destripador) return [];
    return destripador.terminos.filter(t => t.protegido);
  }, [destripador]);

  const ahorroPendiente = useMemo(
    () => terminosPendientes.reduce((acc, t) => acc + t.gasto, 0),
    [terminosPendientes]
  );

  const ahorroAplicado = useMemo(
    () => terminosAplicados.reduce((acc, t) => acc + t.gasto, 0),
    [terminosAplicados]
  );

  const terminosFiltrados = useMemo(() => {
    if (filtroCategoria === "todas") return terminosPendientes;
    return terminosPendientes.filter(t => t.categoria_intencion === filtroCategoria);
  }, [terminosPendientes, filtroCategoria]);

  const conteoPorCategoria = useMemo(() => {
    const map = new Map<CategoriaIntencionId | "todas", number>();
    map.set("todas", terminosPendientes.length);
    terminosPendientes.forEach(t => {
      map.set(t.categoria_intencion, (map.get(t.categoria_intencion) ?? 0) + 1);
    });
    return map;
  }, [terminosPendientes]);

  const terminosSeleccionadosCompletos = useMemo(
    () => terminosPendientes.filter(t => seleccionados.has(terminoKey(t))),
    [terminosPendientes, seleccionados]
  );

  const ahorroSeleccionado = useMemo(
    () => terminosSeleccionadosCompletos.reduce((acc, t) => acc + t.gasto, 0),
    [terminosSeleccionadosCompletos]
  );

  const plan = useMemo<NegativosApplyPlan | null>(() => {
    if (!destripador || terminosSeleccionadosCompletos.length === 0) return null;
    return construirPlanNegativos(terminosSeleccionadosCompletos, {
      matchType,
      scope,
      marcasAplicadas: destripador.marcas_detectadas,
      terminosProtegidos: destripador.terminos_protegidos,
    });
  }, [destripador, terminosSeleccionadosCompletos, matchType, scope]);

  if (!open || !destripador) return null;

  const toggle = (t: DestripadorTermino) => {
    const key = terminoKey(t);
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const seleccionarTodos = () => {
    setSeleccionados(new Set(terminosFiltrados.map(terminoKey)));
  };

  const limpiar = () => setSeleccionados(new Set());

  const quitarDeSeleccion = (keys: string[]) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      keys.forEach(k => next.delete(k));
      return next;
    });
  };

  const copiarLista = async () => {
    if (!plan) return;
    const texto = formatearNegativosParaGoogleAds(plan);
    const keys = keysFromTerminos(terminosSeleccionadosCompletos);
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoBtn(true);
      setTimeout(() => setCopiadoBtn(false), 2000);
      onCopiar?.(keys);
    } catch {
      onCopiar?.(keys);
    }
    quitarDeSeleccion(keys);
    setCopiadosAbierto(true);
  };

  const aplicar = async () => {
    if (!plan) return;
    setAplicando(true);
    const keys = keysFromTerminos(terminosSeleccionadosCompletos);
    try {
      const res = await fetch("/api/negativos/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userConfirmed: true }),
      });
      const data: NegativosApplyResult | { error: string } = await res.json();
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
      const ok = data as NegativosApplyResult;
      setResultado(ok);
      if (ok.status === "aplicado") {
        onMitigar?.(keys, plan.id);
        quitarDeSeleccion(keys);
        onApplied?.(plan, ok);
        setAplicadosAbierto(true);
      }
    } catch {
      setResultado({
        status: "bloqueado_sin_conexion",
        message: "No se pudo conectar con el servidor para registrar la aplicación.",
        applied: [],
        rejected: plan.items.map(item => ({
          item,
          reason: "Sin conexión con backend.",
        })),
      });
    } finally {
      setAplicando(false);
    }
  };

  const cerrarPanel = () => {
    setSeleccionados(new Set());
    setMatchType("FRASE");
    setScope("campana");
    setFiltroCategoria("todas");
    setMostrarConfirmacion(false);
    setResultado(null);
    onClose();
  };

  const categoriasResumen = destripador.categorias;

  const renderFilaPendiente = (t: DestripadorTermino) => {
    const key = terminoKey(t);
    const palette = COLOR_CATEGORIA[t.categoria_intencion];
    const isChecked = seleccionados.has(key);

    return (
      <button
        key={key}
        type="button"
        onClick={() => toggle(t)}
        className={`text-left rounded-2xl border bg-[#292524] p-4 flex items-start gap-3 transition-all hover:border-[#F3C3B2]/50 ${
          isChecked
            ? "border-[#F3C3B2]/70 ring-2 ring-[#F3C3B2]/30"
            : "border-[#44403C]"
        }`}
      >
        <div
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
            isChecked ? "bg-[#F3C3B2] border-[#F3C3B2]" : "border-[#A8A29E] bg-[#1C1917]"
          }`}
        >
          {isChecked && <Check size={14} strokeWidth={3} className="text-[#0a0a0a]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${palette.chip}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${palette.dot} mr-1`} />
              {t.categoria_intencion.replace(/_/g, " ")}
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E] truncate">
              {t.campana_nombre}
            </span>
          </div>
          <p className="text-sm font-black text-[#F5F0EB] mt-2 break-words">{t.termino}</p>
          <p className="text-[11px] text-[#A8A29E] font-medium mt-1 leading-relaxed">{t.motivo}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-bold text-[#A8A29E]">
            <span>
              Gasto · <span className="text-[#F3C3B2]">{moneyFmt(t.gasto)}</span>
            </span>
            <span>
              Clics · <span className="text-[#F5F0EB]">{t.clics}</span>
            </span>
            <span>
              Sugerido · <span className="text-[#F5F0EB]">{t.match_recomendado}</span>
            </span>
          </div>
        </div>
      </button>
    );
  };

  const renderFilaCopiada = (t: DestripadorTermino) => {
    const key = terminoKey(t);
    const palette = COLOR_CATEGORIA[t.categoria_intencion];
    return (
      <div
        key={key}
        className="rounded-2xl border border-[#F3C3B2]/30 bg-[#F3C3B2]/5 p-4 flex items-start gap-3"
      >
        <div className="mt-0.5 w-5 h-5 rounded-md border border-[#F3C3B2]/60 bg-[#F3C3B2]/15 flex items-center justify-center shrink-0">
          <Copy size={12} className="text-[#F3C3B2]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-[#F3C3B2]/40 bg-[#F3C3B2]/10 text-[#F3C3B2]">
              Listo para pegar en Ads
            </span>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border opacity-70 ${palette.chip}`}>
              {t.categoria_intencion.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm font-black text-[#F5F0EB] mt-2 break-words">{t.termino}</p>
          <p className="text-[10px] text-[#A8A29E] mt-1">{t.campana_nombre} · {moneyFmt(t.gasto)}</p>
        </div>
      </div>
    );
  };

  const renderFilaAplicada = (t: DestripadorTermino) => {
    const key = terminoKey(t);
    const palette = COLOR_CATEGORIA[t.categoria_intencion];
    return (
      <div
        key={key}
        className="rounded-2xl border border-[#10B981]/25 bg-[#10B981]/5 p-4 flex items-start gap-3 opacity-75"
      >
        <div className="mt-0.5 w-5 h-5 rounded-md border border-[#10B981] bg-[#10B981]/20 flex items-center justify-center shrink-0">
          <CheckCircle2 size={14} className="text-[#10B981]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]">
              Aplicado desde Mora
            </span>
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border opacity-60 ${palette.chip}`}>
              {t.categoria_intencion.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm font-black text-[#A8A29E] mt-2 break-words line-through decoration-[#10B981]/60">
            {t.termino}
          </p>
          <p className="text-[10px] text-[#A8A29E] mt-1">{t.campana_nombre} · {moneyFmt(t.gasto)}</p>
        </div>
      </div>
    );
  };

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
              <div className="w-11 h-11 rounded-2xl bg-[#F3C3B2]/15 border border-[#F3C3B2]/30 flex items-center justify-center shadow-inner">
                <Trash2 size={20} className="text-[#F3C3B2]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#F3C3B2]">N-Gramos · Destripador</p>
                <h2 className="text-xl font-black text-[#F5F0EB]">Destripador de Búsquedas</h2>
                {auditId != null && (
                  <p className="text-[9px] text-[#A8A29E] font-bold mt-0.5">Seguimiento guardado para esta auditoría</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={cerrarPanel}
              className="w-9 h-9 rounded-xl bg-[#1C1917] border border-[#44403C] flex items-center justify-center text-[#A8A29E] hover:text-[#F5F0EB] hover:border-[#A8A29E] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Pendiente</p>
              <p className="text-2xl font-black text-[#F3C3B2] mt-1">{moneyFmt(ahorroPendiente)}</p>
              {ahorroAplicado > 0 && (
                <p className="text-[9px] text-[#10B981] font-bold mt-1">
                  +{moneyFmt(ahorroAplicado)} aplicado
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Pendientes</p>
              <p className="text-2xl font-black text-[#F5F0EB] mt-1">{terminosPendientes.length}</p>
            </div>
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Copiados</p>
              <p className="text-2xl font-black text-[#F3C3B2] mt-1">{terminosCopiados.length}</p>
            </div>
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Aplicados</p>
              <p className="text-2xl font-black text-[#10B981] mt-1">{terminosAplicados.length}</p>
            </div>
          </div>

          {categoriasResumen.length > 0 && terminosPendientes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFiltroCategoria("todas")}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors ${
                  filtroCategoria === "todas"
                    ? "bg-[#F5F0EB] text-[#0a0a0a] border-[#F5F0EB]"
                    : "bg-[#1C1917] text-[#A8A29E] border-[#44403C] hover:border-[#A8A29E]"
                }`}
              >
                Todas · {conteoPorCategoria.get("todas") ?? 0}
              </button>
              {categoriasResumen.map(cat => {
                const pendientesEnCat = conteoPorCategoria.get(cat.id) ?? 0;
                if (pendientesEnCat === 0) return null;
                const palette = COLOR_CATEGORIA[cat.id];
                const activo = filtroCategoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFiltroCategoria(cat.id)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 ${
                      activo ? palette.chip : "bg-[#1C1917] text-[#A8A29E] border-[#44403C] hover:border-[#A8A29E]"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
                    {cat.label} · {pendientesEnCat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 flex flex-col gap-5 bg-[#1C1917]">
          <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/5 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#10B981]" />
              <p className="text-xs font-black uppercase tracking-widest text-[#10B981]">Guardrails activos</p>
            </div>
            <p className="text-xs text-[#A8A29E] font-medium leading-relaxed">
              Mora descartó automáticamente ítems de marca o con conversiones históricas. Los que aplicás o copiás
              quedan registrados en esta auditoría hasta que corras una nueva.
            </p>
          </div>

          {terminosPendientes.length === 0 && (terminosAplicados.length > 0 || terminosCopiados.length > 0) ? (
            <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/10 p-8 text-center flex flex-col items-center gap-3">
              <CheckCircle2 size={40} className="text-[#10B981]" />
              <h3 className="text-lg font-black text-[#F5F0EB]">¡Sin pendientes en esta auditoría!</h3>
              <p className="text-sm text-[#A8A29E] font-medium max-w-sm">
                Revisá las secciones de Copiados y Aplicados acá abajo. Si el gasto vuelve en la próxima corrida,
                Mora te lo avisará de nuevo.
              </p>
            </div>
          ) : terminosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-[#44403C] bg-[#292524] p-6 text-center text-[#A8A29E] text-sm">
              No hay términos pendientes en esta categoría.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] px-1">
                Pendientes ({terminosFiltrados.length})
              </p>
              {terminosFiltrados.map(renderFilaPendiente)}
            </div>
          )}

          {terminosCopiados.length > 0 && (
            <div className="rounded-2xl border border-[#F3C3B2]/30 bg-[#292524] overflow-hidden">
              <button
                type="button"
                onClick={() => setCopiadosAbierto(v => !v)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#F3C3B2]/5 transition-colors"
              >
                <span className="text-xs font-black uppercase tracking-widest text-[#F3C3B2] flex items-center gap-2">
                  <Copy size={14} /> Copiados ({terminosCopiados.length})
                </span>
                <ChevronDown
                  size={16}
                  className={`text-[#F3C3B2] transition-transform ${copiadosAbierto ? "rotate-180" : ""}`}
                />
              </button>
              {copiadosAbierto && (
                <div className="border-t border-[#F3C3B2]/15">
                  <div className="px-4 py-3 max-h-[560px] overflow-y-auto flex flex-col gap-2">
                    {terminosCopiados.map(renderFilaCopiada)}
                  </div>
                </div>
              )}
            </div>
          )}

          {terminosAplicados.length > 0 && (
            <div className="rounded-2xl border border-[#10B981]/25 bg-[#292524] overflow-hidden">
              <button
                type="button"
                onClick={() => setAplicadosAbierto(v => !v)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#10B981]/5 transition-colors"
              >
                <span className="text-xs font-black uppercase tracking-widest text-[#10B981] flex items-center gap-2">
                  <CheckCircle2 size={14} /> Aplicados ({terminosAplicados.length})
                </span>
                <ChevronDown
                  size={16}
                  className={`text-[#10B981] transition-transform ${aplicadosAbierto ? "rotate-180" : ""}`}
                />
              </button>
              {aplicadosAbierto && (
                <div className="border-t border-[#10B981]/15">
                  <div className="px-4 py-3 max-h-[560px] overflow-y-auto flex flex-col gap-2">
                    {terminosAplicados.map(renderFilaAplicada)}
                  </div>
                </div>
              )}
            </div>
          )}

          {terminosProtegidos.length > 0 && (
            <details className="rounded-2xl border border-[#44403C] bg-[#292524] p-4">
              <summary className="cursor-pointer flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#A8A29E] hover:text-[#F5F0EB]">
                <Lock size={14} /> Ver términos protegidos ({terminosProtegidos.length})
              </summary>
              <div className="mt-3 flex flex-col gap-2">
                {terminosProtegidos.map(t => (
                  <div key={t.termino} className="rounded-xl border border-[#44403C] bg-[#1C1917] p-3 flex flex-col gap-1">
                    <p className="text-sm text-[#F5F0EB] font-bold break-words">{t.termino}</p>
                    <p className="text-[10px] text-[#10B981] font-bold">
                      {t.motivo_proteccion || "Protegido por Mora."}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        <div className="px-6 md:px-8 py-4 border-t border-[#44403C] bg-[#292524] flex flex-col gap-3">
          {terminosPendientes.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="text-[11px] font-bold text-[#A8A29E]">
                  <span className="text-[#F5F0EB] font-black">{seleccionados.size}</span> seleccionados ·
                  <span className="text-[#F3C3B2] font-black"> {moneyFmt(ahorroSeleccionado)}</span> recuperables
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={seleccionarTodos}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-[#1C1917] border border-[#44403C] text-[#A8A29E] hover:border-[#A8A29E] hover:text-[#F5F0EB] transition-colors"
                  >
                    Seleccionar todos
                  </button>
                  <button
                    type="button"
                    onClick={limpiar}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg bg-[#1C1917] border border-[#44403C] text-[#A8A29E] hover:border-[#A8A29E] hover:text-[#F5F0EB] transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#44403C] bg-[#1C1917] p-2 flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E] px-2">Match</span>
                  <div className="flex gap-1 flex-1">
                    {(["FRASE", "EXACTA"] as NegativoMatchType[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMatchType(m)}
                        className={`flex-1 text-[10px] font-black uppercase tracking-widest px-2 py-2 rounded-lg transition-colors ${
                          matchType === m
                            ? "bg-[#F3C3B2] text-[#0a0a0a]"
                            : "bg-[#292524] text-[#A8A29E] hover:text-[#F5F0EB]"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-[#44403C] bg-[#1C1917] p-2 flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E] px-2">Nivel</span>
                  <div className="flex gap-1 flex-1">
                    {(["campana", "cuenta"] as NegativoScope[]).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScope(s)}
                        className={`flex-1 text-[10px] font-black uppercase tracking-widest px-2 py-2 rounded-lg transition-colors ${
                          scope === s
                            ? "bg-[#F3C3B2] text-[#0a0a0a]"
                            : "bg-[#292524] text-[#A8A29E] hover:text-[#F5F0EB]"
                        }`}
                      >
                        {s === "campana" ? "Por campaña" : "Cuenta entera"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!plan}
                  onClick={copiarLista}
                  className={`flex-1 min-w-[180px] flex justify-center items-center gap-2 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all ${
                    plan
                      ? copiadoBtn
                        ? "bg-[#10B981] text-[#0a0a0a]"
                        : "bg-[#1C1917] border border-[#44403C] text-[#F5F0EB] hover:border-[#F3C3B2]"
                      : "bg-[#1C1917] border border-[#44403C] text-[#44403C] cursor-not-allowed"
                  }`}
                >
                  {copiadoBtn ? <Check size={16} /> : <Copy size={16} />}
                  {copiadoBtn ? "Copiado" : "Copiar para Google Ads"}
                </button>
                <button
                  type="button"
                  disabled={!plan}
                  onClick={() => {
                    setResultado(null);
                    setMostrarConfirmacion(true);
                  }}
                  className={`flex-1 min-w-[180px] flex justify-center items-center gap-2 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all ${
                    plan
                      ? "bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1]"
                      : "bg-[#1C1917] border border-[#44403C] text-[#44403C] cursor-not-allowed"
                  }`}
                >
                  <Sparkles size={16} />
                  Aplicar en Google Ads
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-xs text-[#A8A29E] font-bold py-2">
              No hay acciones pendientes. Cerrá el panel o ejecutá una nueva auditoría más adelante.
            </p>
          )}
        </div>
      </div>

      {mostrarConfirmacion && plan && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-sm"
            onClick={() => !aplicando && setMostrarConfirmacion(false)}
          />
          <div className="relative w-full max-w-lg bg-[#1C1917] border border-[#E07070]/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-[#44403C] bg-[#292524] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E07070]/15 border border-[#E07070]/30 flex items-center justify-center">
                <AlertTriangle size={18} className="text-[#E07070]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#E07070]">Cambio sensible</p>
                <h3 className="text-lg font-black text-[#F5F0EB]">Confirmar aplicación de negativos</h3>
              </div>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-[#A8A29E] font-medium leading-relaxed">{plan.consentLabel}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#44403C] bg-[#292524] p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Total</p>
                  <p className="text-xl font-black text-[#F5F0EB]">{plan.totales.cantidad}</p>
                </div>
                <div className="rounded-xl border border-[#44403C] bg-[#292524] p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Recuperable</p>
                  <p className="text-xl font-black text-[#F3C3B2]">{moneyFmt(plan.totales.ahorro_estimado)}</p>
                </div>
                <div className="rounded-xl border border-[#44403C] bg-[#292524] p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Match</p>
                  <p className="text-sm font-black text-[#F5F0EB]">{matchType}</p>
                </div>
                <div className="rounded-xl border border-[#44403C] bg-[#292524] p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Nivel</p>
                  <p className="text-sm font-black text-[#F5F0EB]">{scope === "campana" ? "Por campaña" : "Cuenta entera"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#44403C] bg-[#292524] p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 flex items-center gap-2">
                  <Target size={12} /> Preview ({Math.min(plan.items.length, 6)} de {plan.items.length})
                </p>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {plan.items.slice(0, 6).map(item => (
                    <p key={`${item.campana_id || "cuenta"}-${item.termino}`} className="text-xs text-[#F5F0EB] font-mono break-all">
                      {matchType === "EXACTA" ? `[${item.termino}]` : `"${item.termino}"`}
                      <span className="text-[#A8A29E]"> · {item.campana_nombre || "cuenta entera"}</span>
                    </p>
                  ))}
                  {plan.items.length > 6 && (
                    <p className="text-[10px] text-[#A8A29E] font-bold">y {plan.items.length - 6} más...</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#E07070]/30 bg-[#E07070]/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#E07070] mb-1">Aviso</p>
                <p className="text-xs text-[#A8A29E] leading-relaxed">
                  Al confirmar, los términos pasan a <span className="text-[#10B981] font-black">Aplicados</span> en esta
                  auditoría. Mora registra tu decisión; la escritura directa en Google Ads se conecta cuando esté activa la API.
                </p>
              </div>

              {resultado && (
                <div
                  className={`rounded-xl border p-3 ${
                    resultado.status === "aplicado"
                      ? "border-[#10B981]/30 bg-[#10B981]/5"
                      : "border-[#E07070]/30 bg-[#E07070]/5"
                  }`}
                >
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                      resultado.status === "aplicado" ? "text-[#10B981]" : "text-[#E07070]"
                    }`}
                  >
                    {resultado.status === "aplicado" ? "Registrado en Mora" : "No aplicado"}
                  </p>
                  <p className="text-xs text-[#A8A29E] leading-relaxed">{resultado.message}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#44403C] bg-[#292524] flex gap-2 justify-end">
              <button
                type="button"
                disabled={aplicando}
                onClick={() => {
                  if (resultado?.status === "aplicado") {
                    setMostrarConfirmacion(false);
                    setResultado(null);
                  } else {
                    setMostrarConfirmacion(false);
                  }
                }}
                className="text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-[#1C1917] border border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB] hover:border-[#A8A29E] transition-colors disabled:opacity-50"
              >
                {resultado?.status === "aplicado" ? "Listo" : "Cancelar"}
              </button>
              {!resultado && (
                <button
                  type="button"
                  disabled={aplicando}
                  onClick={aplicar}
                  className="text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1] transition-colors disabled:opacity-50"
                >
                  {aplicando ? "Registrando..." : "Confirmar aplicación"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
