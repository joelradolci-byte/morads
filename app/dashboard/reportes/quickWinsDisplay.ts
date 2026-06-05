import { textoHallazgoParaUsuario } from "../../../lib/resumenFacil";

/** Texto breve por Quick Win: solo la descripción del hallazgo, sin fallback a `descripcion`. */
export function textoQuickWin(hallazgo: {
  descripcion_simple?: string;
  descripcion_tecnica?: string;
}): string {
  const texto = textoHallazgoParaUsuario(hallazgo, true);
  if (texto.length > 360) {
    return `${texto.slice(0, 357).trimEnd()}…`;
  }
  return texto;
}

const QUICK_WIN_TOOL_IDS = new Set([
  "GENERADOR_NEGATIVOS_URGENTE",
  "DAYPARTING_FUGAS_HORARIAS",
  "SIMULADOR_PRESUPUESTO",
]);

export function esQuickWinTool(idRastreo: string | undefined): boolean {
  return idRastreo != null && QUICK_WIN_TOOL_IDS.has(idRastreo);
}

export function quickWinPrimaryLabel(idRastreo: string | undefined): string {
  if (idRastreo === "GENERADOR_NEGATIVOS_URGENTE") return "Abrir Destripador";
  if (idRastreo === "DAYPARTING_FUGAS_HORARIAS") return "Abrir Dayparting";
  if (idRastreo === "SIMULADOR_PRESUPUESTO") return "Abrir Simulador";
  return "Ver detalle";
}
