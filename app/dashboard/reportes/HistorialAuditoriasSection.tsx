"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Loader2,
} from "lucide-react";
import HistorialAuditoriaRow, { type HistorialRowItem } from "./HistorialAuditoriaRow";
import {
  agruparHistorialPorCuenta,
  HISTORIAL_PAGE_SIZE,
} from "./agruparHistorial";

export type FiltroEstadoHistorial = "todos" | "critico" | "atencion" | "optimo";

type DashboardStatus = {
  color: string;
};

type HistorialAuditoriasSectionProps = {
  cargando: boolean;
  totalHistorial: number;
  items: HistorialRowItem[];
  historialCompleto: HistorialRowItem[];
  filtroEstado: FiltroEstadoHistorial;
  onFiltroEstado: (f: FiltroEstadoHistorial) => void;
  busqueda: string;
  onBusqueda: (q: string) => void;
  comparacionIds: (number | string)[];
  comparacionMismaCuenta: boolean;
  hintComparacionMax: boolean;
  onToggleComparacion: (id: number | string) => void;
  onCompararSeleccion: () => void;
  onCompararConAnterior: (item: HistorialRowItem) => void;
  pdfDescargandoId: number | string | null;
  pdfExportDisabled?: boolean;
  pdfQuotaLabel?: string | null;
  onDescargarPdf: (item: HistorialRowItem) => void;
  onBorrar: (id: number | string) => void;
  onAbrirAuditoria: (item: HistorialRowItem) => void;
  onIrAEjecutarAuditoria: () => void;
  getDashboardStatus: (score: number) => DashboardStatus;
  parseDate: (dateString: string) => string;
};

const FILTROS: { id: FiltroEstadoHistorial; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "critico", label: "Crítico" },
  { id: "atencion", label: "Atención" },
  { id: "optimo", label: "Óptimo" },
];

export default function HistorialAuditoriasSection({
  cargando,
  totalHistorial,
  items,
  historialCompleto,
  filtroEstado,
  onFiltroEstado,
  busqueda,
  onBusqueda,
  comparacionIds,
  comparacionMismaCuenta,
  hintComparacionMax,
  onToggleComparacion,
  onCompararSeleccion,
  onCompararConAnterior,
  pdfDescargandoId,
  pdfExportDisabled = false,
  pdfQuotaLabel,
  onDescargarPdf,
  onBorrar,
  onAbrirAuditoria,
  onIrAEjecutarAuditoria,
  getDashboardStatus,
  parseDate,
}: HistorialAuditoriasSectionProps) {
  const [visibleCount, setVisibleCount] = useState(HISTORIAL_PAGE_SIZE);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setVisibleCount(HISTORIAL_PAGE_SIZE);
  }, [filtroEstado, busqueda, totalHistorial]);

  const paginatedItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );

  const grupos = useMemo(
    () => agruparHistorialPorCuenta(paginatedItems),
    [paginatedItems]
  );

  useEffect(() => {
    setCollapsed({});
  }, [filtroEstado, busqueda]);

  const puedeComparar =
    comparacionIds.length === 2 && comparacionMismaCuenta;
  const hayMas = items.length > visibleCount;
  const restantes = items.length - visibleCount;
  const pdfTitle = pdfExportDisabled
    ? "Alcanzaste el límite mensual de PDFs"
    : undefined;

  const toggleGrupo = (cuenta: string) => {
    setCollapsed((prev) => ({ ...prev, [cuenta]: !prev[cuenta] }));
  };

  return (
    <div className="animate-fade-custom print:hidden relative z-10 w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start mb-2">
        <div>
          <h2 className="text-3xl font-black text-[#F5F0EB]">Historial de Auditorías</h2>
          <p className="text-[#A8A29E] text-sm mt-1 font-medium">
            Agrupado por cuenta. Compará dos auditorías de la misma cuenta.
          </p>
          {pdfQuotaLabel && (
            <p className="text-[11px] font-bold text-[#A8A29E] mt-2 uppercase tracking-widest">
              {pdfQuotaLabel}
            </p>
          )}
        </div>
        {comparacionIds.length === 2 && (
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            <button
              type="button"
              onClick={onCompararSeleccion}
              disabled={!puedeComparar}
              title={
                !comparacionMismaCuenta
                  ? "Las dos auditorías deben ser de la misma cuenta"
                  : undefined
              }
              className="animate-fade-custom flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1] transition-all shadow-lg uppercase tracking-widest border border-[#F3C3B2]/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#F3C3B2]"
            >
              <BarChart3 size={18} /> Comparar selección
            </button>
            {!comparacionMismaCuenta && (
              <p className="text-[11px] font-bold text-[#E07070] text-right max-w-xs">
                Elegí dos auditorías de la misma cuenta para comparar.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFiltroEstado(f.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                filtroEstado === f.id
                  ? "bg-[#F3C3B2] text-[#0a0a0a] border-[#F3C3B2]"
                  : "bg-[#292524] text-[#A8A29E] border-[#44403C] hover:border-[#A8A29E]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex md:hidden items-center bg-[#292524] border border-[#44403C] px-4 py-2.5 rounded-xl shadow-sm w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Buscar cuenta..."
            value={busqueda}
            onChange={(e) => onBusqueda(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-[#F5F0EB] placeholder-[#A8A29E] w-full font-bold"
          />
        </div>
      </div>

      {comparacionIds.length === 2 && comparacionMismaCuenta && (
        <p className="text-[11px] font-bold text-[#A8A29E]">
          2 auditorías seleccionadas. Usá «Comparar selección» o desmarcá una para cambiar.
        </p>
      )}
      {hintComparacionMax && (
        <p className="text-[11px] font-bold text-[#D4A843]">
          Solo podés comparar 2 auditorías. Desmarcá una para elegir otra.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {cargando ? (
          <div className="bg-[#1C1917] border border-[#44403C] rounded-[2rem] p-16 flex flex-col items-center justify-center gap-4">
            <Loader2 size={32} className="text-[#F3C3B2] animate-spin" />
            <p className="text-[#A8A29E] text-sm font-bold uppercase tracking-widest">
              Cargando historial…
            </p>
          </div>
        ) : totalHistorial === 0 ? (
          <div className="bg-[#1C1917] border border-[#44403C] rounded-[2rem] p-16 text-center flex flex-col items-center gap-6">
            <p className="text-[#A8A29E] text-base font-medium max-w-md">
              Todavía no tenés auditorías guardadas. Ejecutá la primera desde el panel principal.
            </p>
            <button
              type="button"
              onClick={onIrAEjecutarAuditoria}
              className="px-8 py-4 rounded-2xl text-sm uppercase tracking-widest font-black bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1] transition-colors"
            >
              Ir al panel principal
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[#1C1917] border border-[#44403C] rounded-[2rem] p-16 text-center text-[#A8A29E] text-base font-medium">
            No hay auditorías con estos filtros. Probá otro estado o búsqueda.
          </div>
        ) : (
          <>
            {grupos.map((grupo, grupoIndex) => {
              const isCollapsed = collapsed[grupo.cuenta] ?? grupoIndex > 0;
              const ultimoScore = grupo.items[0]?.score ?? 0;
              const st = getDashboardStatus(ultimoScore);

              return (
                <div
                  key={grupo.cuenta}
                  className="border border-[#44403C] rounded-[1.75rem] overflow-hidden bg-[#1C1917]/50"
                >
                  <button
                    type="button"
                    onClick={() => toggleGrupo(grupo.cuenta)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-[#292524] hover:bg-[#44403C]/40 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[#F5F0EB] text-lg truncate">
                        {grupo.cuenta}
                      </p>
                      <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-widest mt-1">
                        {grupo.items.length}{" "}
                        {grupo.items.length === 1 ? "auditoría" : "auditorías"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-2xl font-black ${st.color}`}
                        title="Última auditoría visible"
                      >
                        {ultimoScore}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-[#A8A29E] transition-transform ${
                          isCollapsed ? "" : "rotate-180"
                        }`}
                      />
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="p-4 flex flex-col gap-4">
                      {grupo.items.map((item) => (
                        <HistorialAuditoriaRow
                          key={String(item.id)}
                          item={item}
                          historialCompleto={historialCompleto}
                          isSelected={comparacionIds.includes(item.id)}
                          pdfLoading={pdfDescargandoId === item.id}
                          pdfDisabled={
                            pdfExportDisabled || pdfDescargandoId !== null
                          }
                          pdfTitle={pdfTitle}
                          showCuentaNombre={false}
                          onToggleComparacion={onToggleComparacion}
                          onCompararConAnterior={onCompararConAnterior}
                          onBorrar={onBorrar}
                          onDescargarPdf={onDescargarPdf}
                          onAbrirAuditoria={onAbrirAuditoria}
                          getDashboardStatus={getDashboardStatus}
                          parseDate={parseDate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {hayMas && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((n) => n + HISTORIAL_PAGE_SIZE)
                  }
                  className="px-8 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black bg-[#292524] border border-[#44403C] text-[#F5F0EB] hover:border-[#F3C3B2]/50 transition-colors"
                >
                  Cargar más ({Math.min(restantes, HISTORIAL_PAGE_SIZE)} de{" "}
                  {restantes})
                </button>
                <p className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-widest">
                  Mostrando {paginatedItems.length} de {items.length} con filtros
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
