"use client";

import { useMemo } from "react";
import { X, BookOpen, ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  fraseSaludCuenta,
  tituloHumanoHallazgo,
  textoHallazgoParaUsuario,
} from "../../lib/resumenFacil";

export type ItemResumenHallazgo = {
  id_rastreo: string;
  titulo: string;
  descripcion_simple?: string;
  descripcion_tecnica?: string;
  descripcion?: string;
  tipo: "critico" | "mejora";
};

interface ResumenFacilPanelProps {
  open: boolean;
  onClose: () => void;
  score: number;
  gastoDesperdiciado: number;
  porcentajeDesperdiciado: number;
  items: ItemResumenHallazgo[];
  lenguajeClaro: boolean;
  onResolver: (item: ItemResumenHallazgo) => void;
}

export default function ResumenFacilPanel({
  open,
  onClose,
  score,
  gastoDesperdiciado,
  porcentajeDesperdiciado,
  items,
  lenguajeClaro,
  onResolver,
}: ResumenFacilPanelProps) {
  const [copiadoIdx, setCopiadoIdx] = useState<number | null>(null);

  const fraseSalud = useMemo(
    () => fraseSaludCuenta(score, gastoDesperdiciado, porcentajeDesperdiciado),
    [score, gastoDesperdiciado, porcentajeDesperdiciado]
  );

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

  return (
    <div className="fixed inset-0 z-[130] flex justify-end print:hidden">
      <div
        className="absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl h-full bg-[#F4F4F5] border-l border-[#E5E7EB] shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 md:px-8 py-6 border-b border-[#E5E7EB] bg-white shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#E0E7FF] flex items-center justify-center">
                <BookOpen size={22} className="text-[#0a0a0a]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#4B5563]">
                  Resumen fácil
                </p>
                <h2 className="text-xl font-black text-[#0a0a0a]">Tu cuenta en criollo</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-[#E5E7EB] flex items-center justify-center text-[#4B5563] hover:bg-[#F4F4F5]"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-[#4B5563] mt-4 leading-relaxed font-medium">{fraseSalud}</p>
          <p className="text-[10px] text-[#8A968C] mt-2 font-bold">
            Los números del dashboard no cambian. Acá te explicamos qué hacer.
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-8 py-6 flex flex-col gap-5">
          {items.length === 0 ? (
            <p className="text-sm text-[#4B5563] text-center py-12">
              Corré una auditoría para ver tu resumen en lenguaje claro.
            </p>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#4B5563]">
                Lo más urgente
              </p>
              {items.map((item, idx) => {
                const titulo = lenguajeClaro
                  ? tituloHumanoHallazgo(item.id_rastreo, item.titulo)
                  : item.titulo;
                const cuerpo = textoHallazgoParaUsuario(item, lenguajeClaro);
                return (
                  <div
                    key={item.id_rastreo}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
                  >
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                        item.tipo === "critico"
                          ? "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]"
                          : "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]"
                      }`}
                    >
                      {item.tipo === "critico" ? "Urgente" : "Mejora"}
                    </span>
                    <h3 className="text-base font-black text-[#0a0a0a] mt-3 leading-snug">
                      {titulo}
                    </h3>
                    <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">{cuerpo}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => onResolver(item)}
                        className="flex-1 min-w-[140px] py-3 px-4 rounded-xl bg-[#0a0a0a] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#292524] flex items-center justify-center gap-2"
                      >
                        Resolver esto <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => copiarItem(idx, `${titulo}\n\n${cuerpo}`)}
                        className="py-3 px-4 rounded-xl border border-[#E5E7EB] text-[10px] font-black uppercase tracking-widest text-[#4B5563] hover:bg-[#F4F4F5] flex items-center gap-1"
                      >
                        {copiadoIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                        {copiadoIdx === idx ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#E5E7EB] text-[#4B5563] hover:bg-[#F4F4F5]"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
