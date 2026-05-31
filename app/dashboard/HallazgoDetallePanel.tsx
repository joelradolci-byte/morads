"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  X,
  Target,
  CheckCircle2,
  BookOpen,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Zap,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ListChecks,
  Info,
  Wrench,
} from "lucide-react";
import MoraOverlay from "./MoraOverlay";
import type { DetalleHallazgo } from "../../lib/types/hallazgoDetalle";
import {
  LABEL_HERRAMIENTA_POR_ACCION,
  accionTieneHerramienta,
} from "../../lib/types/hallazgoDetalle";
import { resolverAccionHallazgo } from "../../lib/resumenFacil";
import { copyResumen } from "../../lib/copyResumen";
import type { Locale } from "../../lib/i18n/types";
import {
  etiquetaBadgeSalud,
  tituloSeccionSaludable,
  type NivelSalud,
} from "../../lib/saludMora";
import type { AdGeneratorContext } from "./AdGeneratorPanel";
import { moraAuthHeaders } from "../../lib/auth/client-headers";
import {
  construirPlanHallazgo,
  type HallazgoApplyPlan,
  type HallazgoApplyResult,
} from "../../lib/hallazgoSafeApply";

interface HallazgoDetallePanelProps {
  detalle: DetalleHallazgo | null;
  open: boolean;
  isClosing?: boolean;
  locale?: Locale;
  onClose: () => void;
  onAbrirResumen?: () => void;
  onAbrirHerramienta: (idRastreo: string) => void;
  onGenerarAnuncios: (ctx: AdGeneratorContext) => void;
}

function moneyFmt(gasto: string | number): string {
  if (typeof gasto === "number") return `$${Math.round(gasto).toLocaleString()}`;
  return String(gasto);
}

export default function HallazgoDetallePanel({
  detalle,
  open,
  isClosing = false,
  locale = "es",
  onClose,
  onAbrirResumen,
  onAbrirHerramienta,
  onGenerarAnuncios,
}: HallazgoDetallePanelProps) {
  const [copiedKw, setCopiedKw] = useState<string | null>(null);
  const [verTecnico, setVerTecnico] = useState(false);
  const copyR = copyResumen(locale);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [applyResult, setApplyResult] = useState<HallazgoApplyResult | null>(null);

  const accion = useMemo(
    () => (detalle ? resolverAccionHallazgo(detalle.id_rastreo) : "detalle_hallazgo"),
    [detalle]
  );

  const rutaGoogleAds = useMemo(() => {
    if (!detalle) return null;
    switch (accion) {
      case "destripador":
        return "Google Ads → Palabras clave → Términos de búsqueda → Agregar negativas";
      case "dayparting":
        return "Google Ads → Programación de anuncios → Ajustes por franja horaria";
      case "simulador":
        return "Google Ads → Campañas → Presupuestos → Ajustes sugeridos";
      case "robin_hood":
        return "Google Ads → Campañas → Presupuesto/ROAS → Reasignación";
      default:
        return "Google Ads → Campañas / Palabras clave → Revisar configuración y aplicar cambios";
    }
  }, [accion, detalle]);

  const pasos = useMemo(() => {
    if (!detalle) return [];
    const base = [
      "Abrí Google Ads y entrá a la cuenta correcta.",
      `Ubicá la sección: ${rutaGoogleAds ?? "Google Ads"} .`,
      "Revisá el elemento afectado (campaña, grupo de anuncios, keyword o término).",
      `Aplicá este cambio: ${detalle.sugerencia}`,
      "Guardá, esperá unos minutos y verificá el impacto en métricas clave.",
    ];

    if (accion === "destripador") {
      return [
        "Abrí Google Ads y entrá a la cuenta correcta.",
        "Andá a Palabras clave → Términos de búsqueda.",
        "Identificá términos con gasto y baja intención.",
        "Agregá negativos (match de frase o exacta) según corresponda.",
        "Guardá y verificá que el gasto se redirija a búsquedas de alta intención.",
      ];
    }
    if (accion === "dayparting") {
      return [
        "Abrí Google Ads y entrá a la cuenta correcta.",
        "Andá a Programación de anuncios (Ad schedule).",
        "Detectá franjas con gasto y pocas conversiones.",
        "Reducí puja o pausá el tráfico en esas franjas.",
        "Guardá y verificá cambios en CPA/ROAS en 7–14 días.",
      ];
    }
    if (accion === "simulador") {
      return [
        "Abrí Google Ads y entrá a la cuenta correcta.",
        "Andá a Campañas → Presupuestos.",
        "Identificá campañas con baja eficiencia (alto CPA/bajo ROAS).",
        "Mové presupuesto hacia campañas más eficientes según recomendación.",
        "Guardá y monitoreá cambios en volumen vs eficiencia.",
      ];
    }
    if (accion === "robin_hood") {
      return [
        "Abrí Google Ads y entrá a la cuenta correcta.",
        "Andá a Campañas y ordená por gasto y performance.",
        "Reducí inversión en campañas que gastan sin retorno.",
        "Aumentá inversión en campañas con margen (buen CPA/ROAS).",
        "Guardá y monitoreá el cambio durante 7 días antes de iterar.",
      ];
    }
    return base;
  }, [accion, detalle, rutaGoogleAds]);

  const topDrivers = useMemo(() => {
    if (!detalle) return [];
    return detalle.items
      .filter((it) => typeof it.gasto === "number")
      .slice()
      .sort((a, b) => (Number(b.gasto) || 0) - (Number(a.gasto) || 0))
      .slice(0, 3);
  }, [detalle]);

  const mostrarGenerador = useMemo(() => {
    if (!detalle) return false;
    if (detalle.sin_accion_requerida || detalle.tipo === "saludable") return false;
    if (detalle.id_rastreo?.startsWith("QS_")) return true;
    if (accion === "destripador") return true;
    if (detalle.sugerencias.length > 0) return true;
    const rep = detalle.reporteData as Record<string, unknown> | undefined;
    const destripador = rep?.destripador as
      | { tokens?: Array<{ protegido?: boolean; token: string }> }
      | undefined;
    if ((destripador?.tokens?.filter((t) => !t.protegido).length ?? 0) > 0) return true;
    return false;
  }, [accion, detalle]);

  const problemaTexto = useMemo(() => {
    if (!detalle) return "";
    if (verTecnico) {
      return (
        detalle.descripcion_tecnica ||
        detalle.problema_detalle ||
        detalle.descripcion_simple ||
        ""
      );
    }
    return (
      detalle.descripcion_simple ||
      detalle.problema_detalle ||
      detalle.descripcion_tecnica ||
      ""
    );
  }, [detalle, verTecnico]);

  if (!detalle || (!open && !isClosing)) return null;

  const esSaludable = detalle.tipo === "saludable" || detalle.sin_accion_requerida === true;
  const nivelSalud: NivelSalud =
    detalle.nivel_salud ?? (esSaludable ? "estable" : "mejorable");
  const etiquetaSalud = esSaludable ? etiquetaBadgeSalud(nivelSalud) : null;
  const esCritico = detalle.tipo === "critico";
  const tieneItemsReales =
    detalle.items.length > 0 &&
    !(
      detalle.items.length === 1 &&
      detalle.items[0].nombre === "Sin datos de keywords disponibles"
    );

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiedKw(texto);
      setTimeout(() => setCopiedKw(null), 2000);
    });
  };

  const construirPlan = (): HallazgoApplyPlan => {
    // Risk heuristic: critical findings are “alto”, tool-backed are “medio”, others “medio”.
    const risk = detalle.tipo === "critico" ? "alto" : accionTieneHerramienta(accion) ? "medio" : "medio";
    return construirPlanHallazgo({
      hallazgo_id: detalle.id_rastreo,
      title: detalle.titulo,
      riskLevel: risk,
      steps: pasos,
      reason: detalle.razonamiento,
      expectedImpact: detalle.resultado_esperado,
      payload: {
        accion: accion === "detalle_hallazgo" ? undefined : accion,
        id_rastreo: detalle.id_rastreo,
        sugerencia: detalle.sugerencia,
        tipo: detalle.tipo,
      },
    });
  };

  const aplicar = async () => {
    const plan = construirPlan();
    setAplicando(true);
    setApplyResult(null);
    try {
      const res = await fetch("/api/hallazgos/aplicar", {
        method: "POST",
        headers: await moraAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ plan, userConfirmed: true }),
      });
      const data = (await res.json()) as
        | HallazgoApplyResult
        | { error?: string; message?: string; status?: string };
      if (res.status === 409) {
        const msg =
          typeof data === "object" && data && "message" in data && typeof data.message === "string"
            ? data.message
            : "Abrí la herramienta indicada para aplicar este cambio.";
        setApplyResult({ status: "cancelado", message: msg });
        return;
      }
      if (!res.ok) {
        const errorMessage =
          (typeof data === "object" && data && "message" in data && typeof data.message === "string"
            ? data.message
            : null) ||
          (typeof data === "object" && data && "error" in data && typeof data.error === "string"
            ? data.error
            : "No se pudo aplicar el hallazgo.");
        setApplyResult({
          status:
            typeof data === "object" && data && data.status === "bloqueado_sin_conexion"
              ? "bloqueado_sin_conexion"
              : "cancelado",
          message: errorMessage,
        });
        return;
      }
      setApplyResult(data as HallazgoApplyResult);
      setMostrarConfirmacion(false);
    } catch {
      setApplyResult({
        status: "bloqueado_sin_conexion",
        message: "No se pudo conectar con el servidor.",
      });
    } finally {
      setAplicando(false);
    }
  };

  const abrirGenerador = () => {
    const reporte = detalle.reporteData ?? {};
    const destripador = reporte.destripador as
      | { tokens?: Array<{ protegido?: boolean; token: string }> }
      | undefined;
    const tokens = destripador?.tokens?.filter((t) => !t.protegido) ?? [];
    const perfil = reporte.perfil_aplicado as { tipo_negocio?: string } | undefined;

    const tipoNegocio = perfil?.tipo_negocio;
    const tipoNegocioValido: AdGeneratorContext["tipo_negocio"] =
      tipoNegocio === "lead_gen" || tipoNegocio === "high_ticket" ? tipoNegocio : "ecommerce";

    onGenerarAnuncios({
      tipo_negocio: tipoNegocioValido,
      tono: "directo",
      objetivo:
        detalle.id_rastreo?.startsWith("QS_") || detalle.tipo === "critico"
          ? "recuperar_relevancia"
          : "escalar",
      hallazgo_titulo: detalle.titulo,
      hallazgo_descripcion: detalle.problema_detalle,
      angulo_comercial: detalle.razonamiento,
      keywords_buenas: tokens.slice(0, 6).map((t) => t.token),
      terminos_evitar: tokens.slice(0, 8).map((t) => t.token),
      hallazgo_id: detalle.id_rastreo,
    });
  };

  return (
    <MoraOverlay open={open} isClosing={isClosing} variant="split" onClose={onClose} zIndex={125}>
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 px-6 md:px-8 py-5 border-b border-[#E5E7EB] bg-white flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  esSaludable
                    ? "bg-[#D1FAE5] border border-[#A7F3D0]"
                    : esCritico
                      ? "bg-[#FEE2E2] border border-[#FECACA]"
                      : "bg-[#FEF3C7] border border-[#FDE68A]"
                }`}
              >
                {esSaludable ? (
                  <CheckCircle2 size={20} className="text-[#047857]" />
                ) : esCritico ? (
                  <AlertTriangle size={20} className="text-[#B91C1C]" />
                ) : (
                  <Zap size={20} className="text-[#B45309]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                      esSaludable
                        ? "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]"
                        : esCritico
                          ? "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]"
                          : "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
                    }`}
                  >
                    {etiquetaSalud ?? (esCritico ? "Fuga crítica" : "Oportunidad")}
                  </span>
                  <span className="text-[11px] font-mono text-[#8A968C] truncate max-w-[220px]">
                    {detalle.id_rastreo}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[#0a0a0a] leading-tight mt-1">
                  {detalle.titulo}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-10 h-10 rounded-xl border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] hover:bg-[#F4F4F5]"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {onAbrirResumen && (
            <nav className="flex items-center gap-1.5 text-xs font-bold text-[#8A968C]">
              <button
                type="button"
                onClick={onAbrirResumen}
                className="hover:text-[#0a0a0a] transition-colors"
              >
                {copyR.breadcrumbResumen}
              </button>
              <ChevronRight size={14} />
              <span className="text-[#4B5563]">Detalle del hallazgo</span>
            </nav>
          )}
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] overflow-hidden">
          <div className="min-h-0 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-[#F4F4F5] border-r border-[#E5E7EB]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#4B5563]">
                Guía paso a paso
              </p>
              {(detalle.descripcion_simple || detalle.descripcion_tecnica) && (
                <button
                  type="button"
                  onClick={() => setVerTecnico((v) => !v)}
                  className="text-[11px] font-black uppercase tracking-widest text-[#6366F1] hover:underline"
                >
                  {verTecnico ? copyR.verPalabrasSimple : copyR.verDetalleTecnico}
                </button>
              )}
            </div>

            <StepCard
              step={1}
              icon={
                <Target
                  size={16}
                  className={
                    esSaludable ? "text-[#047857]" : esCritico ? "text-[#E66767]" : "text-[#EAB308]"
                  }
                />
              }
              title={esSaludable ? tituloSeccionSaludable(nivelSalud) : "Qué encontró Mora"}
              accent={
                esSaludable
                  ? "border-[#A7F3D0]/50"
                  : esCritico
                    ? "border-[#E66767]/30"
                    : "border-[#EAB308]/30"
              }
            >
              <p className="text-sm md:text-base text-[#4B5563] font-medium leading-relaxed">
                {problemaTexto}
              </p>
              <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B5563] flex items-center gap-2">
                  <Info size={14} /> Cómo Mora lo calculó
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <p className="text-xs text-[#4B5563] font-medium leading-relaxed">
                    <span className="font-black text-[#0a0a0a]">Señal detectada:</span>{" "}
                    {esSaludable
                      ? nivelSalud === "optima"
                        ? "rendimiento muy sólido: CPA en objetivo, score alto y sin señales de fuga."
                        : "rendimiento alineado con el objetivo de CPA y score de salud de la campaña."
                      : tieneItemsReales && topDrivers.length > 0
                        ? `los mayores drivers por gasto aparecen en la evidencia (ej: “${topDrivers[0]?.nombre}”).`
                        : "una ineficiencia con impacto en performance o presupuesto."}
                  </p>
                  {rutaGoogleAds && (
                    <p className="text-xs text-[#4B5563] font-medium leading-relaxed">
                      <span className="font-black text-[#0a0a0a]">Dónde mirarlo:</span> {rutaGoogleAds}
                    </p>
                  )}
                  <p className="text-xs text-[#4B5563] font-medium leading-relaxed">
                    <span className="font-black text-[#0a0a0a]">Guardrails:</span> Mora no escribe sin tu
                    confirmación explícita, y deja un recibo de la acción.
                  </p>
                </div>
              </div>
            </StepCard>

            <StepCard
              step={2}
              icon={<CheckCircle2 size={16} className="text-[#10B981]" />}
              title={esSaludable ? "Recomendación de Mora" : "Qué hacer en Google Ads"}
              accent="border-[#10B981]/30"
            >
              <p className="text-sm md:text-base text-[#0a0a0a] font-bold leading-relaxed">
                {detalle.sugerencia}
              </p>
              {esSaludable && detalle.nota_escala_opcional && (
                <div className="mt-4 rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#047857] mb-2">
                    Opcional — no es necesario
                  </p>
                  <p className="text-sm text-[#4B5563] font-medium leading-relaxed">
                    {detalle.nota_escala_opcional}
                  </p>
                </div>
              )}
              {!esSaludable && (
                <>
                  <ul className="mt-3 space-y-2">
                    {pasos.slice(0, 6).map((p, idx) => (
                      <li key={idx} className="flex gap-2 text-xs md:text-sm text-[#4B5563] font-medium">
                        <span className="mt-0.5 w-5 h-5 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-[10px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => copiar(pasos.join("\n"))}
                    className={`mt-4 w-full flex justify-center items-center gap-2 text-[11px] font-black uppercase tracking-widest py-3 rounded-xl transition-all ${
                      copiedKw === pasos.join("\n")
                        ? "bg-[#10B981] text-[#0a0a0a]"
                        : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F4F4F5]"
                    }`}
                  >
                    {copiedKw === pasos.join("\n") ? <Check size={16} /> : <Copy size={16} />}
                    {copiedKw === pasos.join("\n") ? "Paso a paso copiado" : "Copiar paso a paso"}
                  </button>
                </>
              )}
            </StepCard>

            <StepCard
              step={3}
              icon={<BookOpen size={16} className="text-[#8A968C]" />}
              title="Por qué importa"
              accent="border-[#E5E7EB]"
            >
              <p className="text-sm md:text-base text-[#0a0a0a] font-semibold leading-relaxed italic">
                &ldquo;{detalle.razonamiento}&rdquo;
              </p>
            </StepCard>

            <StepCard
              step={4}
              icon={<TrendingUp size={16} className="text-[#6366F1]" />}
              title="Resultado esperado"
              accent="border-[#E0E7FF]/50"
              className="bg-[#E0E7FF]/10"
            >
              <p className="text-lg md:text-xl font-black text-[#0a0a0a] leading-snug">
                {detalle.resultado_esperado}
              </p>
            </StepCard>
          </div>

          <div className="min-h-0 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 bg-white">
            <div className="rounded-xl border border-[#E0E7FF]/60 bg-[#E0E7FF]/15 px-4 py-3 flex gap-3">
              <ShieldCheck size={18} className="text-[#6366F1] shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-[#4B5563] font-medium leading-relaxed">
                {esSaludable
                  ? "No hay cambios urgentes que aplicar. Seguí monitoreando; Mora solo sugiere actuar cuando detecta impacto real."
                  : "Mora no modifica tu cuenta sola. Copiá o aplicá los cambios cuando vos lo confirmes en Google Ads."}
              </p>
            </div>

            {!esSaludable && (
            <section className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#4B5563] flex items-center gap-2">
                    <ListChecks size={14} /> Aplicar con Mora
                  </p>
                  <p className="text-xs text-[#4B5563] font-medium mt-2 leading-relaxed">
                    Te mostramos el paso a paso. Si el cambio es automático, Mora lo aplica en Google Ads al
                    confirmar; si no, te indica qué herramienta usar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarConfirmacion((v) => !v);
                    setApplyResult(null);
                  }}
                  className="shrink-0 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-[10px] font-black uppercase tracking-widest text-[#0a0a0a] hover:bg-[#F4F4F5]"
                >
                  {mostrarConfirmacion ? "Ocultar" : "Ver confirmación"}
                </button>
              </div>

              {mostrarConfirmacion && (
                <div className="mt-4 rounded-xl border border-[#E0E7FF]/60 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#6366F1]">
                    Confirmación explícita
                  </p>
                  <p className="text-xs text-[#4B5563] font-medium mt-2 leading-relaxed">
                    {construirPlan().consentLabel}
                  </p>
                  <div className="mt-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#4B5563]">
                      Preview del plan
                    </p>
                    <ul className="mt-2 space-y-1">
                      {pasos.slice(0, 5).map((p, idx) => (
                        <li key={idx} className="text-xs text-[#4B5563] font-medium">
                          {idx + 1}. {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={aplicando}
                    onClick={aplicar}
                    className={`mt-4 w-full flex justify-center items-center gap-2 text-sm font-black py-3.5 rounded-xl transition-all ${
                      aplicando ? "bg-[#E5E7EB] text-[#8A968C]" : "bg-[#0a0a0a] text-white hover:bg-[#292524]"
                    }`}
                  >
                    {aplicando ? "Aplicando…" : "Confirmar y aplicar con Mora"}
                  </button>

                  {applyResult && (
                    <div
                      className={`mt-3 rounded-xl border px-3 py-2 text-xs font-medium ${
                        applyResult.status === "aplicado"
                          ? "border-[#A7F3D0] bg-[#D1FAE5] text-[#047857]"
                          : "border-[#FDE68A] bg-[#FEF3C7] text-[#B45309]"
                      }`}
                    >
                      {applyResult.message}
                      {applyResult.receiptId && (
                        <span className="block mt-1 font-mono text-[10px] opacity-80">
                          Recibo: {applyResult.receiptId}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
            )}

            {tieneItemsReales && (
              <section>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#4B5563] mb-3">
                  Evidencia en la cuenta
                </h3>
                <div className="rounded-2xl border border-[#E5E7EB] overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F4F4F5] text-[11px] font-black uppercase tracking-widest text-[#4B5563]">
                      <tr>
                        <th className="px-3 py-2.5">Término / keyword</th>
                        <th className="px-3 py-2.5 text-right">Gasto</th>
                        <th className="px-3 py-2.5 text-right hidden sm:table-cell">Clics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {detalle.items.slice(0, 12).map((item, i) => (
                        <tr key={`${item.nombre}-${i}`} className="bg-white">
                          <td className="px-3 py-2.5 font-bold text-[#0a0a0a] break-words">
                            {item.nombre}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-[#4B5563]">
                            {moneyFmt(item.gasto)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-[#8A968C] hidden sm:table-cell">
                            {item.clics}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {detalle.items.length > 12 && (
                    <p className="text-[11px] text-[#8A968C] font-bold px-3 py-2 bg-[#F4F4F5]">
                      +{detalle.items.length - 12} más en el reporte completo
                    </p>
                  )}
                </div>
              </section>
            )}

            {detalle.sugerencias.length > 0 && (
              <section>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#4B5563] mb-3">
                  Keywords sugeridas
                </h3>
                <ul className="flex flex-col gap-2">
                  {detalle.sugerencias.slice(0, 8).map((s) => (
                    <li
                      key={s.keyword}
                      className="rounded-xl border border-[#E5E7EB] bg-[#F4F4F5] px-3 py-2.5"
                    >
                      <p className="text-sm font-black text-[#0a0a0a]">{s.keyword}</p>
                      <p className="text-xs text-[#4B5563] mt-0.5">{s.razon}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-col gap-2 mt-auto pt-2">
              <button
                type="button"
                onClick={() => copiar(detalle.sugerencia)}
                className={`w-full flex justify-center items-center gap-2 text-sm font-black py-3.5 rounded-xl transition-all ${
                  copiedKw === detalle.sugerencia
                    ? "bg-[#10B981] text-[#0a0a0a]"
                    : "bg-[#0a0a0a] text-white hover:bg-[#292524]"
                }`}
              >
                {copiedKw === detalle.sugerencia ? <Check size={18} /> : <Copy size={18} />}
                {copiedKw === detalle.sugerencia
                  ? "Instrucción copiada"
                  : "Copiar instrucción para Google Ads"}
              </button>

              {accionTieneHerramienta(accion) && (
                <button
                  type="button"
                  onClick={() => onAbrirHerramienta(detalle.id_rastreo)}
                  className="w-full flex justify-center items-center gap-2 text-sm font-black py-3.5 rounded-xl border-2 border-[#F3C3B2] bg-[#F3C3B2]/15 text-[#0a0a0a] hover:bg-[#F3C3B2]/30"
                >
                  <Wrench size={18} />
                  {LABEL_HERRAMIENTA_POR_ACCION[accion]}
                </button>
              )}

              {mostrarGenerador && (
                <button
                  type="button"
                  onClick={abrirGenerador}
                  className="w-full flex justify-center items-center gap-2 text-sm font-black py-3.5 rounded-xl border border-[#E5E7EB] text-[#0a0a0a] hover:bg-[#F4F4F5]"
                >
                  <Sparkles size={18} /> Generar anuncios para esta oportunidad
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MoraOverlay>
  );
}

function StepCard({
  step,
  icon,
  title,
  accent,
  className = "",
  children,
}: {
  step: number;
  icon: ReactNode;
  title: string;
  accent: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 md:p-6 shadow-sm ${accent} ${className}`}
    >
      <p className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 text-[#0a0a0a]">
        <span className="w-7 h-7 rounded-lg bg-[#F4F4F5] flex items-center justify-center text-xs font-black">
          {step}
        </span>
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}
