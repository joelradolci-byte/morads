"use client";

import { useMemo, useState } from "react";
import {
  X,
  Calculator,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import type {
  SimuladorPresupuestoReporte,
  SimuladorEscenarioId,
  SimuladorEscenario,
} from "../../lib/motorMora";

interface PresupuestoSimulatorPanelProps {
  simulador: SimuladorPresupuestoReporte | null;
  open: boolean;
  auditId?: string | number | null;
  introDesdeResumen?: string | null;
  tituloLenguajeClaro?: boolean;
  onClose: () => void;
}

function moneyFmt(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

const SALUD_LABEL: Record<string, string> = {
  eficiente: "Eficiente",
  mejorable: "Mejorable",
  ineficiente: "Ineficiente",
};

const ROL_COLOR: Record<string, string> = {
  origen: "text-[#E07070]",
  destino: "text-[#10B981]",
  mantener: "text-[#A8A29E]",
  observar: "text-[#EAB308]",
  bloqueada: "text-[#A8A29E]",
};

export default function PresupuestoSimulatorPanel({
  simulador,
  open,
  auditId,
  introDesdeResumen,
  tituloLenguajeClaro = false,
  onClose,
}: PresupuestoSimulatorPanelProps) {
  const [escenarioId, setEscenarioId] = useState<SimuladorEscenarioId>("esperado");
  const [inversionExtra, setInversionExtra] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const [supuestosAbierto, setSupuestosAbierto] = useState(true);

  const escenarioActivo: SimuladorEscenario | null = useMemo(() => {
    if (!simulador) return null;
    const found = simulador.escenarios.find(e => e.id === escenarioId);
    return found ?? simulador.escenarios[1] ?? null;
  }, [simulador, escenarioId]);

  const escenarioPersonalizado = useMemo(() => {
    if (!escenarioActivo || !simulador) return null;
    const factor = 1 + inversionExtra / Math.max(simulador.inversion_actual, 1);
    const reasignar = Math.round(escenarioActivo.presupuesto_reasignable * factor);
    const mult = reasignar / Math.max(escenarioActivo.presupuesto_reasignable, 1);
    return {
      ...escenarioActivo,
      presupuesto_reasignable: reasignar,
      conversiones_extra: {
        pesimista: parseFloat((escenarioActivo.conversiones_extra.pesimista * mult * 0.85).toFixed(1)),
        esperado: parseFloat((escenarioActivo.conversiones_extra.esperado * mult).toFixed(1)),
        optimista: parseFloat((escenarioActivo.conversiones_extra.optimista * mult * 1.1).toFixed(1)),
      },
    };
  }, [escenarioActivo, simulador, inversionExtra]);

  const esc = escenarioPersonalizado ?? escenarioActivo;

  const origenes = useMemo(
    () => simulador?.campanas.filter(c => c.rol === "origen") ?? [],
    [simulador]
  );
  const destinos = useMemo(
    () => simulador?.campanas.filter(c => c.rol === "destino") ?? [],
    [simulador]
  );

  const copiarPlan = async () => {
    if (!simulador || !esc) return;
    const texto = [
      `SIMULADOR MORA — Auditoría ${auditId ?? "—"}`,
      simulador.mensaje_resumen,
      "",
      `Escenario: ${esc.label}`,
      `Reasignación: ${moneyFmt(esc.presupuesto_reasignable)}/mes`,
      `Conversiones extra (esperado): +${esc.conversiones_extra.esperado}`,
      `Rango: +${esc.conversiones_extra.pesimista} a +${esc.conversiones_extra.optimista}`,
      `CPA estimado: $${esc.cpa_estimado}`,
      "",
      "Origen:",
      ...origenes.map(o => `  - ${o.nombre}: ${moneyFmt(Math.abs(o.monto_movimiento))}`),
      "Destino:",
      ...destinos.map(d => `  - ${d.nombre}: +${moneyFmt(d.monto_movimiento)}`),
      "",
      "Supuestos:",
      ...esc.supuestos.map(s => `  • ${s}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!open || !simulador) return null;

  const salud = SALUD_LABEL[simulador.salud_presupuesto] ?? simulador.salud_presupuesto;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end print:hidden">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl h-full bg-[#1C1917] border-l border-[#44403C] shadow-[0_0_50px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-[#44403C] bg-[#292524] flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center">
                <Calculator size={20} className="text-[#10B981]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                  Simulador
                </p>
                <h2 className="text-xl font-black text-[#F5F0EB]">
                  {tituloLenguajeClaro ? "Cómo repartir mejor tu inversión" : "Proyección de presupuesto"}
                </h2>
                {auditId != null && (
                  <p className="text-[9px] text-[#A8A29E] font-bold mt-0.5">Auditoría #{auditId}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#1C1917] border border-[#44403C] flex items-center justify-center text-[#A8A29E] hover:text-[#F5F0EB]"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-[#F5F0EB] font-medium leading-relaxed">{simulador.mensaje_resumen}</p>

          {introDesdeResumen && (
            <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-[11px] text-[#F5F0EB] font-medium leading-snug">
              {introDesdeResumen}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Salud</p>
              <p className="text-lg font-black text-[#F5F0EB] mt-1">{salud}</p>
            </div>
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Mal asignado</p>
              <p className="text-lg font-black text-[#E07070] mt-1">
                {moneyFmt(simulador.diagnostico.presupuesto_mal_asignado)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#1C1917] border border-[#44403C] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">Escalable</p>
              <p className="text-lg font-black text-[#10B981] mt-1">
                {moneyFmt(simulador.diagnostico.presupuesto_escalable)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-8 py-4 flex flex-col gap-4">
          {!simulador.tiene_senal_suficiente && (
            <div className="rounded-xl border border-[#EAB308]/30 bg-[#EAB308]/10 px-4 py-3 flex gap-2">
              <AlertTriangle size={16} className="text-[#EAB308] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#A8A29E] leading-snug">
                Poca señal estadística en la cuenta. Usá las proyecciones como orientación, no como
                garantía.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {simulador.escenarios.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEscenarioId(e.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                  escenarioId === e.id
                    ? "bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]"
                    : "bg-[#292524] border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB]"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-[#44403C] bg-[#292524] p-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">
              Ajuste de inversión simulada (+$ sobre escenario)
            </label>
            <input
              type="range"
              min={0}
              max={Math.max(5000, simulador.diagnostico.presupuesto_mal_asignado)}
              step={100}
              value={inversionExtra}
              onChange={ev => setInversionExtra(Number(ev.target.value))}
              className="w-full mt-2 accent-[#10B981]"
            />
            <p className="text-sm font-black text-[#F5F0EB] mt-1">+{moneyFmt(inversionExtra)}</p>
          </div>

          {esc && (
            <div className="rounded-2xl border border-[#10B981]/30 bg-[#10B981]/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-[#10B981]" />
                <h3 className="text-sm font-black text-[#F5F0EB] uppercase tracking-widest">
                  Resultado — {esc.label}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] text-[#A8A29E] uppercase font-bold">Conversiones extra</p>
                  <p className="text-2xl font-black text-[#10B981]">
                    +{esc.conversiones_extra.pesimista} a +{esc.conversiones_extra.optimista}
                  </p>
                  <p className="text-[10px] text-[#A8A29E] mt-0.5">
                    Esperado: +{esc.conversiones_extra.esperado}/mes
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#A8A29E] uppercase font-bold">Reasignación</p>
                  <p className="text-2xl font-black text-[#F5F0EB]">
                    {moneyFmt(esc.presupuesto_reasignable)}
                  </p>
                  <p className="text-[10px] text-[#A8A29E] mt-0.5">
                    CPA est. ${esc.cpa_estimado} · Conf. {esc.confianza}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2">
              Antes vs después por campaña
            </p>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {simulador.campanas
                .filter(c => c.rol === "origen" || c.rol === "destino")
                .map(c => (
                  <div
                    key={c.campana_id}
                    className="rounded-xl border border-[#44403C] bg-[#1C1917] px-3 py-2.5 flex justify-between items-start gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#F5F0EB] truncate">{c.nombre}</p>
                      <p className={`text-[9px] font-black uppercase ${ROL_COLOR[c.rol]}`}>
                        {c.rol}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-[#A8A29E]">
                        {moneyFmt(c.presupuesto_actual)} →{" "}
                        {c.presupuesto_propuesto != null
                          ? moneyFmt(c.presupuesto_propuesto)
                          : "—"}
                      </p>
                      {c.monto_movimiento !== 0 && (
                        <p
                          className={`text-[10px] font-bold ${
                            c.monto_movimiento > 0 ? "text-[#10B981]" : "text-[#E07070]"
                          }`}
                        >
                          {c.monto_movimiento > 0 ? "+" : ""}
                          {moneyFmt(c.monto_movimiento)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSupuestosAbierto(v => !v)}
            className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest text-[#A8A29E]"
          >
            De dónde sale este número
            <ChevronDown
              size={14}
              className={`transition-transform ${supuestosAbierto ? "rotate-180" : ""}`}
            />
          </button>
          {supuestosAbierto && esc && (
            <div className="rounded-xl border border-[#44403C] bg-[#292524] p-4 text-[11px] text-[#A8A29E] space-y-2">
              <p className="text-[#F5F0EB] font-bold">{simulador.diagnostico.principal_cuello_botella}</p>
              <ul className="list-disc pl-4 space-y-1">
                {esc.supuestos.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              {esc.riesgos.length > 0 && (
                <>
                  <p className="text-[#E07070] font-black uppercase text-[9px] mt-2">Riesgos</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {esc.riesgos.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 px-3 py-2.5 flex gap-2">
            <ShieldCheck size={14} className="text-[#10B981] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#A8A29E] font-medium leading-snug">
              Simulación basada en rendimiento histórico. No es garantía de resultado. La aplicación
              automática de presupuesto llegará en una versión posterior con confirmación por
              campaña.
            </p>
          </div>
        </div>

        <div className="shrink-0 px-6 md:px-8 py-4 border-t border-[#44403C] bg-[#292524]">
          <button
            type="button"
            onClick={copiarPlan}
            className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#10B981] text-[#0a0a0a] hover:bg-[#0d9f6e] flex items-center justify-center gap-2"
          >
            {copiado ? <Check size={16} /> : <Copy size={16} />}
            {copiado ? "Copiado" : "Copiar plan para cliente"}
          </button>
        </div>
      </div>
    </div>
  );
}
