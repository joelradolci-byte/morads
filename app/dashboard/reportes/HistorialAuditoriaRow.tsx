"use client";

import { Check, FileText, GitCompare, Loader2, Trash2 } from "lucide-react";

export type HistorialRowItem = {
  id: number | string;
  nombre_cuenta?: string | null;
  created_at?: string;
  score: number;
  reporte_json?: {
    resumen?: { gasto_desperdiciado?: number };
    hallazgos?: {
      graves_rojo?: unknown[];
      debiles_amarillo?: unknown[];
    };
  };
};

type HistorialAuditoriaRowProps = {
  item: HistorialRowItem;
  historialCompleto: HistorialRowItem[];
  isSelected: boolean;
  pdfLoading: boolean;
  pdfDisabled: boolean;
  pdfTitle?: string;
  showCuentaNombre?: boolean;
  onToggleComparacion: (id: number | string) => void;
  onCompararConAnterior?: (item: HistorialRowItem) => void;
  onBorrar: (id: number | string) => void;
  onDescargarPdf: (item: HistorialRowItem) => void;
  onAbrirAuditoria: (item: HistorialRowItem) => void;
  getDashboardStatus: (score: number) => { color: string };
  parseDate: (dateString: string) => string;
};

export default function HistorialAuditoriaRow({
  item,
  historialCompleto,
  isSelected,
  pdfLoading,
  pdfDisabled,
  pdfTitle,
  showCuentaNombre = true,
  onToggleComparacion,
  onCompararConAnterior,
  onBorrar,
  onDescargarPdf,
  onAbrirAuditoria,
  getDashboardStatus,
  parseDate,
}: HistorialAuditoriaRowProps) {
  const accountAudits = historialCompleto.filter(
    (h) => h.nombre_cuenta === item.nombre_cuenta
  );
  const currentIdxInAccount = accountAudits.findIndex((h) => h.id === item.id);
  const previousAudit =
    currentIdxInAccount !== -1 && currentIdxInAccount + 1 < accountAudits.length
      ? accountAudits[currentIdxInAccount + 1]
      : null;
  const delta = previousAudit ? item.score - previousAudit.score : null;

  const st = getDashboardStatus(item.score);
  const gastoDesperdiciado = item.reporte_json?.resumen?.gasto_desperdiciado || 0;
  const fugas = item.reporte_json?.hallazgos?.graves_rojo?.length || 0;
  const mejoras = item.reporte_json?.hallazgos?.debiles_amarillo?.length || 0;

  return (
    <div
      className={`bg-[#1C1917] border hover:border-[#F3C3B2]/50 rounded-[1.5rem] p-5 md:p-6 transition-all shadow-sm hover:shadow-lg ${
        isSelected ? "border-[#F3C3B2] bg-[#F3C3B2]/5" : "border-[#44403C]"
      }`}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-6">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <button
            type="button"
            aria-label={isSelected ? "Quitar de comparación" : "Seleccionar para comparar"}
            onClick={() => onToggleComparacion(item.id)}
            className={`shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors mt-1 ${
              isSelected
                ? "bg-[#F3C3B2] border-[#F3C3B2] text-[#0a0a0a]"
                : "border-[#44403C] hover:border-[#A8A29E]"
            }`}
          >
            {isSelected && <Check size={14} strokeWidth={3} />}
          </button>

          <div className="min-w-0 flex-1">
            {showCuentaNombre && (
              <p className="font-black text-[#F5F0EB] text-xl truncate mb-1">
                {item.nombre_cuenta || "Cuenta sin nombre"}
              </p>
            )}
            <p className="text-xs font-bold text-[#A8A29E] uppercase tracking-widest">
              {parseDate(item.created_at ?? "")}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4 md:hidden">
              <span className={`text-4xl font-black tracking-tighter ${st.color}`}>
                {item.score}
              </span>
              {delta !== null && delta !== 0 && (
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                    delta > 0
                      ? "bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]"
                      : "bg-[#E07070]/10 border-[#E07070]/20 text-[#E07070]"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta} pts
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3 md:hidden">
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                  fugas > 0
                    ? "bg-[#E07070]/10 text-[#E07070] border-[#E07070]/20"
                    : "bg-[#292524] text-[#A8A29E] border-[#44403C]"
                }`}
              >
                {fugas} {fugas === 1 ? "Fuga" : "Fugas"}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                  mejoras > 0
                    ? "bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20"
                    : "bg-[#292524] text-[#A8A29E] border-[#44403C]"
                }`}
              >
                {mejoras} {mejoras === 1 ? "Mejora" : "Mejoras"}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 shrink-0">
          <span className={`text-[52px] font-black tracking-tighter ${st.color}`}>
            {item.score}
          </span>
          {delta !== null && delta !== 0 && (
            <div
              className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg border shadow-inner ${
                delta > 0
                  ? "bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]"
                  : "bg-[#E07070]/10 border-[#E07070]/20 text-[#E07070]"
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                {delta > 0 ? "+" : ""}
                {delta} pts
              </span>
            </div>
          )}
        </div>

        <div className="hidden md:block shrink-0">
          <div className="bg-[#292524] border border-[#44403C] rounded-xl p-3">
            <p className="text-[9px] font-black text-[#A8A29E] uppercase tracking-widest mb-1">
              Gasto desperdiciado
            </p>
            <p className="text-lg font-black text-[#E07070]">
              {gastoDesperdiciado > 0
                ? `-$${gastoDesperdiciado.toLocaleString()}`
                : "$0.00"}
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-2 shrink-0">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg w-max border ${
              fugas > 0
                ? "bg-[#E07070]/10 text-[#E07070] border-[#E07070]/20"
                : "bg-[#292524] text-[#A8A29E] border-[#44403C]"
            }`}
          >
            {fugas} {fugas === 1 ? "Fuga" : "Fugas"}
          </span>
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg w-max border ${
              mejoras > 0
                ? "bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20"
                : "bg-[#292524] text-[#A8A29E] border-[#44403C]"
            }`}
          >
            {mejoras} {mejoras === 1 ? "Mejora" : "Mejoras"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end md:shrink-0">
          {previousAudit && onCompararConAnterior && (
            <button
              type="button"
              onClick={() => onCompararConAnterior(item)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black bg-[#292524] border border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB] hover:border-[#F3C3B2]/50 transition-all"
            >
              <GitCompare size={14} />
              vs anterior
            </button>
          )}
          <button
            type="button"
            onClick={() => onBorrar(item.id)}
            className="text-[#8A968C] hover:text-[#E66767] transition-colors p-3 bg-[#292524] border border-[#44403C] rounded-xl hover:border-[#E66767]/30"
            aria-label="Eliminar auditoría"
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            disabled={pdfDisabled}
            title={pdfTitle}
            onClick={() => onDescargarPdf(item)}
            className="bg-[#F3C3B2] text-[#0a0a0a] hover:bg-[#eab3a1] disabled:opacity-50 px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-all flex items-center gap-1.5"
          >
            {pdfLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            PDF
          </button>
          <button
            type="button"
            onClick={() => onAbrirAuditoria(item)}
            className="bg-[#292524] border border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB] hover:border-[#F5F0EB] px-5 py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-all"
          >
            Ver auditoría
          </button>
        </div>
      </div>

      <p className="md:hidden text-[10px] font-black text-[#A8A29E] uppercase tracking-widest mt-3">
        Gasto desperdiciado:{" "}
        <span className="text-[#E07070]">
          {gastoDesperdiciado > 0
            ? `-$${gastoDesperdiciado.toLocaleString()}`
            : "$0.00"}
        </span>
      </p>
    </div>
  );
}
