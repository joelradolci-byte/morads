"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { buscarGlosario } from "../../lib/glosarioMetricas";

interface GlosarioTipProps {
  termino: string;
  className?: string;
}

export default function GlosarioTip({ termino, className = "" }: GlosarioTipProps) {
  const [abierto, setAbierto] = useState(false);
  const entrada = buscarGlosario(termino);
  if (!entrada) return null;

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setAbierto(v => !v)}
        className="inline-flex items-center gap-0.5 text-[#A8A29E] hover:text-[#F3C3B2] transition-colors"
        aria-label={`Qué es ${entrada.termino}`}
      >
        <HelpCircle size={12} />
      </button>
      {abierto && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[200] cursor-default"
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
          />
          <span className="absolute left-0 top-full mt-1 z-[201] w-56 p-3 rounded-xl bg-[#292524] border border-[#44403C] shadow-xl text-[11px] text-[#F5F0EB] font-medium leading-snug">
            <span className="font-black text-[#F3C3B2] block mb-1">{entrada.termino}</span>
            {entrada.definicion}
          </span>
        </>
      )}
    </span>
  );
}
