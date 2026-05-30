"use client";

import { LayoutGrid, ArrowRight } from "lucide-react";
import {
  gastoEnBucket,
  impactoFinancieroApagar,
  impactoFinancieroEscalar,
  type MatrizBucketId,
} from "../../../lib/campanasEvaluacion";
import type { MatrizItemEval } from "../../../lib/campanasEvaluacion";

type Buckets = {
  escalar: MatrizItemEval[];
  testear: MatrizItemEval[];
  observar: MatrizItemEval[];
  apagar: MatrizItemEval[];
};

const BLOQUES: {
  id: MatrizBucketId;
  label: string;
  color: string;
  border: string;
}[] = [
  { id: "escalar", label: "Escalar", color: "text-[#10B981]", border: "border-[#10B981]/40" },
  { id: "testear", label: "Dar tiempo", color: "text-blue-400", border: "border-blue-400/40" },
  { id: "observar", label: "Revisar", color: "text-[#EAB308]", border: "border-[#EAB308]/40" },
  { id: "apagar", label: "Frenar", color: "text-[#E07070]", border: "border-[#E07070]/40" },
];

type Props = {
  buckets: Buckets;
  cpaPromedio: number;
  activasCount: number;
  onAbrirMatriz: () => void;
};

export default function MatrizResumenCuenta({ buckets, cpaPromedio, activasCount, onAbrirMatriz }: Props) {
  if (activasCount === 0) {
    return (
      <div className="w-full mt-6">
        <h3 className="text-base font-black text-[#F5F0EB] flex items-center gap-2 mb-2">
          <LayoutGrid className="text-[#D4A843]" size={20} /> Matriz de Rendimiento
        </h3>
        <div className="bg-[#292524] border border-[#44403C] rounded-2xl p-8 text-center text-[#A8A29E] text-sm">
          No hay campañas activas suficientes para generar la matriz.
        </div>
      </div>
    );
  }

  const impacto = (id: MatrizBucketId, items: typeof buckets.escalar) => {
    if (id === "escalar") return Math.round(impactoFinancieroEscalar(items));
    if (id === "apagar") return Math.round(impactoFinancieroApagar(items));
    return Math.round(gastoEnBucket(items));
  };

  return (
    <div className="w-full mt-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4 px-1">
        <div>
          <h3 className="text-base font-black text-[#F5F0EB] flex items-center gap-2">
            <LayoutGrid className="text-[#D4A843]" size={20} /> Matriz de Rendimiento
          </h3>
          <p className="text-[11px] text-[#A8A29E] mt-1 font-bold uppercase tracking-widest">
            Resumen · CPA cuenta ${cpaPromedio.toFixed(2)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAbrirMatriz}
          className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[#D4A843]/30 text-[#D4A843] hover:bg-[#D4A843]/10 flex items-center gap-2"
        >
          Abrir matriz completa <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {BLOQUES.map(bloque => {
          const items = buckets[bloque.id];
          const top = items[0];
          return (
            <div
              key={bloque.id}
              className={`bg-[#292524] border ${bloque.border} rounded-2xl p-4 ${items.length === 0 ? "opacity-50" : ""}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${bloque.color}`}>
                {bloque.label}
              </span>
              <p className="text-3xl font-black text-[#F5F0EB] mt-1">{items.length}</p>
              <p className="text-[10px] text-[#A8A29E] font-bold">campañas</p>
              {items.length > 0 && (
                <>
                  <p className={`text-xs font-bold mt-2 ${bloque.color}`}>
                    ${impacto(bloque.id, items).toLocaleString()}/mes
                  </p>
                  {top && (
                    <p className="text-[10px] text-[#F5F0EB] font-bold mt-2 truncate" title={top.campana.nombre}>
                      {top.campana.nombre}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
