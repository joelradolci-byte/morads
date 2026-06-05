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
  { id: "testear", label: "Dar tiempo", color: "text-blue-600", border: "border-blue-400/40" },
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
        <h3 className="mb-2 flex items-center gap-2 text-lg font-black text-[#262B27]">
          <LayoutGrid className="text-[#D4A843]" size={22} /> Matriz de Rendimiento
        </h3>
        <div className="rounded-2xl border border-[#CFD6C4] bg-white/80 p-8 text-center text-base text-[#657166]">
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
      <div className="mb-4 flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black text-[#262B27]">
            <LayoutGrid className="text-[#D4A843]" size={22} /> Matriz de Rendimiento
          </h3>
          <p className="mt-1 text-sm font-bold uppercase tracking-widest text-[#8A968C]">
            Resumen · CPA cuenta ${cpaPromedio.toFixed(2)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAbrirMatriz}
          className="flex items-center gap-2 rounded-xl border border-[#D4A843]/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#D4A843] transition-colors hover:bg-[#D4A843]/10"
        >
          Abrir matriz completa <ArrowRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {BLOQUES.map(bloque => {
          const items = buckets[bloque.id];
          const top = items[0];
          return (
            <div
              key={bloque.id}
              className={`rounded-2xl border bg-white/85 p-4 ${bloque.border} ${items.length === 0 ? "opacity-50" : ""}`}
            >
              <span className={`text-sm font-black uppercase tracking-widest ${bloque.color}`}>
                {bloque.label}
              </span>
              <p className="mt-1 text-3xl font-black text-[#262B27]">{items.length}</p>
              <p className="text-sm font-bold text-[#657166]">campañas</p>
              {items.length > 0 && (
                <>
                  <p className={`mt-2 text-sm font-bold ${bloque.color}`}>
                    ${impacto(bloque.id, items).toLocaleString()}/mes
                  </p>
                  {top && (
                    <p className="mt-2 truncate text-sm font-bold text-[#262B27]" title={top.campana.nombre}>
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
