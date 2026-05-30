"use client";

import { Search, RefreshCcw } from "lucide-react";
import type {
  CampanasSubVista,
  FiltroCampanaEstado,
  FiltroCampanaSalud,
  FiltroCampanaTag,
  OrdenCampanas,
} from "../../../lib/campanasEvaluacion";

type Props = {
  busqueda: string;
  onBusqueda: (v: string) => void;
  estado: FiltroCampanaEstado;
  onEstado: (v: FiltroCampanaEstado) => void;
  tag: FiltroCampanaTag;
  onTag: (v: FiltroCampanaTag) => void;
  salud: FiltroCampanaSalud;
  onSalud: (v: FiltroCampanaSalud) => void;
  orden: OrdenCampanas;
  onOrden: (v: OrdenCampanas) => void;
  subVista: CampanasSubVista;
  onSubVista: (v: CampanasSubVista) => void;
  mostrando: number;
  total: number;
  onRefresh: () => void;
  cargando: boolean;
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-colors ${
        active
          ? "bg-[#F3C3B2]/15 border-[#F3C3B2]/40 text-[#F3C3B2]"
          : "border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB]"
      }`}
    >
      {children}
    </button>
  );
}

export default function CampanasToolbar({
  busqueda,
  onBusqueda,
  estado,
  onEstado,
  tag,
  onTag,
  salud,
  onSalud,
  orden,
  onOrden,
  subVista,
  onSubVista,
  mostrando,
  total,
  onRefresh,
  cargando,
}: Props) {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={16} />
          <input
            type="search"
            value={busqueda}
            onChange={e => onBusqueda(e.target.value)}
            placeholder="Buscar campaña por nombre…"
            className="w-full bg-[#1C1917] border border-[#44403C] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F5F0EB] placeholder:text-[#78716c] focus:border-[#F3C3B2]/50 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={cargando}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-[#44403C] text-[#A8A29E] hover:text-[#F5F0EB] disabled:opacity-50"
        >
          <RefreshCcw size={14} className={cargando ? "animate-spin" : ""} /> Actualizar
        </button>
        <p className="text-[10px] text-[#A8A29E] font-bold lg:ml-auto">
          Mostrando {mostrando} de {total}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#78716c] mr-1">Vista</span>
        <Chip active={subVista === "lista"} onClick={() => onSubVista("lista")}>
          Lista
        </Chip>
        <Chip active={subVista === "matriz"} onClick={() => onSubVista("matriz")}>
          Matriz
        </Chip>
        <Chip active={subVista === "pacing"} onClick={() => onSubVista("pacing")}>
          Pacing
        </Chip>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#78716c] mr-1">Estado</span>
        <Chip active={estado === "todas"} onClick={() => onEstado("todas")}>
          Todas
        </Chip>
        <Chip active={estado === "activas"} onClick={() => onEstado("activas")}>
          Activas
        </Chip>
        <Chip active={estado === "pausadas"} onClick={() => onEstado("pausadas")}>
          Pausadas
        </Chip>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#78716c] mr-1">Tag</span>
        {(["todos", "ESTRELLA", "POTENCIAL", "DUDOSO", "BASURA"] as FiltroCampanaTag[]).map(t => (
          <Chip key={t} active={tag === t} onClick={() => onTag(t)}>
            {t === "todos" ? "Todos" : t}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[9px] font-black uppercase tracking-widest text-[#78716c] mr-1">Salud</span>
        <Chip active={salud === "todas"} onClick={() => onSalud("todas")}>
          Todas
        </Chip>
        <Chip active={salud === "accion"} onClick={() => onSalud("accion")}>
          Requiere acción
        </Chip>
        <Chip active={salud === "bien"} onClick={() => onSalud("bien")}>
          En buen estado
        </Chip>
        <select
          value={orden}
          onChange={e => onOrden(e.target.value as OrdenCampanas)}
          className="ml-auto bg-[#1C1917] border border-[#44403C] text-[#F5F0EB] text-[10px] font-black uppercase tracking-widest rounded-lg px-3 py-1.5"
        >
          <option value="score_desc">Orden: Score ↓</option>
          <option value="gasto_desc">Orden: Gasto ↓</option>
          <option value="cpa_asc">Orden: CPA ↑</option>
        </select>
      </div>
    </div>
  );
}
