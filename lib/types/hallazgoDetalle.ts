import type { AccionResumenPanel } from "../resumenFacil";
import type { NivelSalud } from "../saludMora";

export type TipoHallazgo = "critico" | "mejora" | "saludable";

export type KeywordProblematicaItem = {
  nombre: string;
  gasto: string | number;
  clics: number;
  conversiones: number;
};

export type KeywordSugeridaItem = {
  keyword: string;
  razon: string;
};

export type DetalleHallazgo = {
  id_rastreo: string;
  titulo: string;
  tipo: TipoHallazgo;
  problema_detalle: string;
  descripcion_simple?: string;
  descripcion_tecnica?: string;
  sugerencia: string;
  razonamiento: string;
  resultado_esperado: string;
  /** Cuando la campaña/cuenta está bien: nota opcional de escalar (no urgente) */
  nota_escala_opcional?: string | null;
  sin_accion_requerida?: boolean;
  nivel_salud?: NivelSalud;
  items: KeywordProblematicaItem[];
  sugerencias: KeywordSugeridaItem[];
  reporteData?: Record<string, unknown>;
};

export const LABEL_HERRAMIENTA_POR_ACCION: Record<
  Exclude<AccionResumenPanel, "detalle_hallazgo" | "robin_hood">,
  string
> = {
  destripador: "Abrir destripador de búsquedas",
  dayparting: "Abrir mapa de horarios",
  simulador: "Abrir simulador de presupuesto",
};

export function accionTieneHerramienta(
  accion: AccionResumenPanel
): accion is keyof typeof LABEL_HERRAMIENTA_POR_ACCION {
  return accion in LABEL_HERRAMIENTA_POR_ACCION;
}
