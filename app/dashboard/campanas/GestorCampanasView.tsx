"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Folder, Sparkles } from "lucide-react";
import {
  colorClassesPorTag,
  etiquetaScoreCampana,
  filtrarYOrdenarCampanas,
  formatearCpaCampana,
  type CampanasSubVista,
  type FiltroCampanaEstado,
  type FiltroCampanaSalud,
  type FiltroCampanaTag,
  type OrdenCampanas,
} from "../../../lib/campanasEvaluacion";
import { useCampanasEvaluadas } from "../../../lib/useCampanasEvaluadas";
import { detalleHallazgoDesdeCampana, etiquetaBadgeSalud } from "../../../lib/saludMora";
import type { DiagnosticoSaludReporte } from "../../../lib/saludMora";
import type { CampanaMora } from "../../../lib/motorMora";
import type { TipoHallazgo } from "../../../lib/types/hallazgoDetalle";
import type { AdGeneratorContext } from "../AdGeneratorPanel";
import CampanasToolbar from "./CampanasToolbar";
import MatrizCampanas from "./MatrizCampanas";
import PacingCampanasVista, { type PacingAccionPendiente } from "./PacingCampanasVista";

type Props = {
  campanas: (CampanaMora & { id: string; nombre: string })[];
  cargando: boolean;
  error?: string | null;
  diagnosticoSalud?: DiagnosticoSaludReporte | null;
  reporteJson?: Record<string, unknown> | null;
  initialSubVista?: CampanasSubVista;
  initialBusqueda?: string;
  initialTag?: FiltroCampanaTag;
  initialCampanaId?: string;
  onRefresh: () => void;
  onSubVistaChange?: (v: CampanasSubVista) => void;
  onAbrirDetalle: (hallazgo: unknown, tipo: TipoHallazgo, reporte: Record<string, unknown>) => void;
  onAbrirGenerador: (ctx: AdGeneratorContext) => void;
  onPacingAccion: (accion: PacingAccionPendiente) => void;
  pacingUndoIds: string[];
};

export default function GestorCampanasView({
  campanas,
  cargando,
  error = null,
  diagnosticoSalud,
  reporteJson,
  initialSubVista = "lista",
  initialBusqueda = "",
  initialTag = "todos",
  initialCampanaId = "",
  onRefresh,
  onSubVistaChange,
  onAbrirDetalle,
  onAbrirGenerador,
  onPacingAccion,
  pacingUndoIds,
}: Props) {
  const [modoVista, setModoVista] = useState<"grid" | "list">("grid");
  const [subVista, setSubVista] = useState<CampanasSubVista>(initialSubVista);
  const [busqueda, setBusqueda] = useState(initialBusqueda);
  const [filtroEstado, setFiltroEstado] = useState<FiltroCampanaEstado>("todas");
  const [filtroTag, setFiltroTag] = useState<FiltroCampanaTag>(initialTag ?? "todos");
  const [filtroSalud, setFiltroSalud] = useState<FiltroCampanaSalud>("todas");
  const [orden, setOrden] = useState<OrdenCampanas>("score_desc");
  const [campanaDeepLinkHecho, setCampanaDeepLinkHecho] = useState(false);

  const { cpaPromedio, evaluadas } = useCampanasEvaluadas(campanas, diagnosticoSalud);

  const filtradas = useMemo(
    () =>
      filtrarYOrdenarCampanas(evaluadas, {
        busqueda,
        estado: filtroEstado,
        tag: filtroTag,
        salud: filtroSalud,
        orden,
      }),
    [evaluadas, busqueda, filtroEstado, filtroTag, filtroSalud, orden]
  );

  const activasMatriz = useMemo(
    () => filtradas.filter(e => e.campana.estado === "ENABLED"),
    [filtradas]
  );

  const resumen = useMemo(() => {
    const basura = evaluadas.filter(e => e.evaluacion.tag === "BASURA");
    const accion = evaluadas.filter(e => e.requiereAccion);
    const optimas = evaluadas.filter(e => e.nivelSalud === "optima" || e.nivelSalud === "estable");
    const gastoBasura = basura.reduce((a, e) => a + (e.campana.gasto_mensual || 0), 0);
    return { basura: basura.length, accion: accion.length, optimas: optimas.length, gastoBasura };
  }, [evaluadas]);

  const abrirCampana = (c: (typeof filtradas)[0]["campana"]) => {
    const payload = detalleHallazgoDesdeCampana(c, cpaPromedio);
    onAbrirDetalle(payload, payload.tipo, (reporteJson ?? {}) as Record<string, unknown>);
  };

  useEffect(() => {
    setSubVista(initialSubVista);
  }, [initialSubVista]);

  useEffect(() => {
    if (initialBusqueda) setBusqueda(initialBusqueda);
  }, [initialBusqueda]);

  useEffect(() => {
    if (initialCampanaId && !campanaDeepLinkHecho && evaluadas.length > 0) {
      const found = evaluadas.find(e => String(e.campana.id) === initialCampanaId);
      if (found) {
        abrirCampana(found.campana);
        setCampanaDeepLinkHecho(true);
      }
    }
  }, [initialCampanaId, campanaDeepLinkHecho, evaluadas, cpaPromedio]);

  const handleSubVista = (v: CampanasSubVista) => {
    setSubVista(v);
    onSubVistaChange?.(v);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("todas");
    setFiltroTag("todos");
    setFiltroSalud("todas");
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-[#F5F0EB] text-3xl font-black uppercase tracking-tight">Gestor de Campañas</h2>
          <p className="text-[#A8A29E] text-sm mt-1 font-medium">
            Detalle por línea de inversión · filtros y pacing accionable
          </p>
        </div>
        {subVista === "lista" && (
          <div className="bg-[#1C1917] p-1 rounded-lg border border-[#44403C] flex gap-1">
            <button
              type="button"
              onClick={() => setModoVista("grid")}
              className={`p-2 rounded md transition-all ${modoVista === "grid" ? "bg-[#292524] text-[#E07070] shadow" : "text-[#A8A29E] hover:text-[#F5F0EB]"}`}
              aria-label="Vista grid"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setModoVista("list")}
              className={`p-2 rounded md transition-all ${modoVista === "list" ? "bg-[#292524] text-[#E07070] shadow" : "text-[#A8A29E] hover:text-[#F5F0EB]"}`}
              aria-label="Vista lista"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {!cargando && campanas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#1C1917] border border-[#44403C] rounded-xl px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Requieren acción</p>
            <p className="text-2xl font-black text-[#E07070]">{resumen.accion}</p>
          </div>
          <div className="bg-[#1C1917] border border-[#44403C] rounded-xl px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">En buen estado</p>
            <p className="text-2xl font-black text-[#10B981]">{resumen.optimas}</p>
          </div>
          <div className="bg-[#1C1917] border border-[#44403C] rounded-xl px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">BASURA</p>
            <p className="text-2xl font-black text-[#F5F0EB]">{resumen.basura}</p>
          </div>
          <div className="bg-[#1C1917] border border-[#44403C] rounded-xl px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Gasto en BASURA</p>
            <p className="text-xl font-black text-[#E07070]">${resumen.gastoBasura.toLocaleString()}</p>
          </div>
        </div>
      )}

      <CampanasToolbar
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        estado={filtroEstado}
        onEstado={setFiltroEstado}
        tag={filtroTag}
        onTag={setFiltroTag}
        salud={filtroSalud}
        onSalud={setFiltroSalud}
        orden={orden}
        onOrden={setOrden}
        subVista={subVista}
        onSubVista={handleSubVista}
        mostrando={filtradas.length}
        total={evaluadas.length}
        onRefresh={onRefresh}
        cargando={cargando}
      />

      {cargando && (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F3C3B2]" />
        </div>
      )}

      {!cargando && error && (
        <div className="bg-[#1C1917] border border-[#B91C1C]/40 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <AlertCircle size={48} className="text-[#F87171] mb-4" />
          <h3 className="text-xl font-bold text-[#F5F0EB]">No se pudieron cargar las campañas</h3>
          <p className="text-[#A8A29E] mt-2 max-w-md">{error}</p>
          <Link
            href="/configuracion"
            className="mt-6 text-[10px] font-black uppercase tracking-widest text-[#F3C3B2] hover:underline"
          >
            Ir a Configuración
          </Link>
        </div>
      )}

      {!cargando && !error && campanas.length === 0 && (
        <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Folder size={48} className="text-[#44403C] mb-4" />
          <h3 className="text-xl font-bold text-[#F5F0EB]">Sin campañas en la cuenta</h3>
          <p className="text-[#A8A29E] mt-2 max-w-sm">
            No hay campañas activas con datos en los últimos 30 días. Si acabás de crear campañas, puede
            tardar hasta que Google Ads registre métricas.
          </p>
        </div>
      )}

      {!cargando && campanas.length > 0 && filtradas.length === 0 && (
        <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-10 text-center">
          <p className="text-[#F5F0EB] font-bold">Ninguna campaña coincide con tu búsqueda</p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#F3C3B2] hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {!cargando && filtradas.length > 0 && subVista === "matriz" && (
        <MatrizCampanas evaluaciones={activasMatriz} cpaPromedio={cpaPromedio} />
      )}

      {!cargando && filtradas.length > 0 && subVista === "pacing" && (
        <PacingCampanasVista
          items={filtradas}
          pacingUndoIds={pacingUndoIds}
          onAccion={onPacingAccion}
        />
      )}

      {!cargando && filtradas.length > 0 && subVista === "lista" && modoVista === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtradas.map(({ campana, evaluacion, nivelSalud }) => {
            const { score, tag, penalizacion, cpaActual, gasto } = evaluacion;
            const sinDatos = tag === "SIN_DATOS";
            const presupuesto = Math.max(evaluacion.presupuesto, 1);
            const colorClasses = colorClassesPorTag(tag);
            const cpaObjetivo = campana.cpa_objetivo ?? cpaPromedio;
            const scoreLabel = etiquetaScoreCampana(evaluacion);
            const scoreRing = score ?? 0;

            return (
              <div
                key={campana.id}
                onClick={() => abrirCampana(campana)}
                className={`bg-[#292524] border border-[#44403C] rounded-xl p-5 transition-colors relative group cursor-pointer ${colorClasses.border}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1.5 max-w-[75%]">
                    <h3 className="text-[#F5F0EB] font-bold text-sm truncate" title={campana.nombre}>
                      {campana.nombre}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 rounded w-max border ${
                          campana.estado === "ENABLED"
                            ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                            : "bg-[#78716c]/10 text-[#A8A29E] border-[#78716c]/30"
                        }`}
                      >
                        {campana.estado === "ENABLED" ? "Activa" : "Pausada"}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#44403C] text-[#A8A29E]">
                        {sinDatos ? "Sin datos suficientes" : etiquetaBadgeSalud(nivelSalud)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="relative w-10 h-10 flex items-center justify-center"
                    title={sinDatos ? "Sin datos suficientes en el período" : undefined}
                  >
                    {!sinDatos && (
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#1C1917]" />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray="100.5"
                          strokeDashoffset={100.5 - (100.5 * scoreRing) / 100}
                          className={colorClasses.text}
                        />
                      </svg>
                    )}
                    <span
                      className={`absolute text-[10px] font-black ${sinDatos ? "text-[#78716C]" : "text-[#F5F0EB]"}`}
                    >
                      {scoreLabel}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#A8A29E]">Gasto</span>
                      <span className="text-[#F5F0EB] font-mono">
                        ${gasto.toLocaleString()} / ${presupuesto.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-[#1C1917] rounded-full overflow-hidden">
                      <div className="h-full bg-[#A8A29E]" style={{ width: `${Math.min((gasto / presupuesto) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between items-end border-t border-[#44403C] pt-4">
                    <div>
                      <p className="text-[#A8A29E] text-[10px] uppercase tracking-wider mb-1">CPA Actual</p>
                      <p
                        className={`font-mono text-lg font-black ${
                          sinDatos || cpaActual == null
                            ? "text-[#78716C]"
                            : cpaActual > cpaObjetivo * 1.2
                              ? "text-[#E07070]"
                              : "text-[#22c55e]"
                        }`}
                      >
                        {formatearCpaCampana(cpaActual)}
                      </p>
                      <p className={`text-[9px] font-bold mt-0.5 ${sinDatos ? "text-[#57534E]" : "text-[#78716c]"}`}>
                        {sinDatos ? "Sin conversiones en 30 días" : `Obj. ${formatearCpaCampana(cpaObjetivo)}`}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${colorClasses.bg} ${colorClasses.text}`}>
                      {sinDatos ? "SIN DATOS" : tag}
                    </span>
                  </div>
                  {(tag === "ESTRELLA" || tag === "POTENCIAL") && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onAbrirGenerador({
                          tipo_negocio:
                            ((reporteJson?.perfil_aplicado as { tipo_negocio?: string })?.tipo_negocio as
                              | "ecommerce"
                              | "lead_gen"
                              | "high_ticket") || "ecommerce",
                          tono: "directo",
                          objetivo: "escalar",
                          campana_nombre: campana.nombre,
                          hallazgo_titulo: `Escalar campaña ${tag}: ${campana.nombre}`,
                          hallazgo_descripcion: penalizacion,
                          angulo_comercial:
                            cpaActual != null
                              ? `CPA $${cpaActual.toFixed(2)} vs objetivo $${cpaObjetivo.toFixed(2)}.`
                              : `Sin datos de CPA; objetivo $${cpaObjetivo.toFixed(2)}.`,
                          keywords_buenas: [],
                          hallazgo_id: `campana_${campana.id}`,
                        });
                      }}
                      className="w-full mt-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#F3C3B2]/30 text-[#F3C3B2] hover:bg-[#F3C3B2]/10 flex items-center justify-center gap-1"
                    >
                      <Sparkles size={12} /> Crear variantes
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!cargando && filtradas.length > 0 && subVista === "lista" && modoVista === "list" && (
        <div className="bg-[#292524] border border-[#44403C] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#1C1917] border-b border-[#44403C] text-[#A8A29E] text-[10px] uppercase tracking-widest">
              <tr>
                <th className="p-4 font-black">Campaña & Salud</th>
                <th className="p-4 font-black">Gasto Mensual</th>
                <th className="p-4 font-black">CPA Actual</th>
                <th className="p-4 font-black">CPA Objetivo</th>
                <th className="p-4 font-black text-right">Veredicto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#44403C]">
              {filtradas.map(({ campana, evaluacion, nivelSalud }) => {
                const { score, tag, cpaActual, gasto } = evaluacion;
                const sinDatos = tag === "SIN_DATOS";
                const colorClasses = colorClassesPorTag(tag);
                const cpaObjetivo = campana.cpa_objetivo ?? cpaPromedio;
                const scoreLabel = etiquetaScoreCampana(evaluacion);

                return (
                  <tr
                    key={campana.id}
                    className="hover:bg-[#1C1917]/50 transition-colors cursor-pointer"
                    onClick={() => abrirCampana(campana)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[#F5F0EB] font-bold text-sm">{campana.nombre}</p>
                            <span className="text-[8px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded border border-[#44403C] text-[#A8A29E]">
                              {sinDatos ? "Sin datos suficientes" : etiquetaBadgeSalud(nivelSalud)}
                            </span>
                          </div>
                          {!sinDatos && (
                            <div className="w-48 h-1 bg-[#1C1917] mt-1.5 rounded-full overflow-hidden relative">
                              <div
                                className={`h-full ${colorClasses.bar}`}
                                style={{ width: `${score ?? 0}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <span className={`text-xs font-black w-6 ${sinDatos ? "text-[#78716C]" : "text-[#A8A29E]"}`}>
                          {scoreLabel}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-[#A8A29E] font-mono text-sm">${gasto.toLocaleString()}</td>
                    <td className={`p-4 font-mono font-bold text-sm ${sinDatos ? "text-[#78716C]" : ""}`}>
                      <span className={sinDatos ? "" : colorClasses.text}>
                        {formatearCpaCampana(cpaActual)}
                      </span>
                    </td>
                    <td className="p-4 text-[#A8A29E] font-mono text-sm">
                      {formatearCpaCampana(cpaObjetivo)}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded inline-block ${colorClasses.bg} ${colorClasses.text}`}>
                        {sinDatos ? "SIN DATOS" : tag}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
