import type { Locale } from "./i18n/types";

type ResumenCopy = {
  panelBadge: string;
  panelTitle: string;
  panelTitleHistorico: string;
  verResumenSimple: string;
  leerResumenSimple: string;
  breadcrumbResumen: string;
  verPalabrasSimple: string;
  verDetalleTecnico: string;
  loMasUrgente: string;
  loMarcadoHistorico: string;
  verHallazgosEnReporte: (n: number) => string;
  queEstaBien: string;
  sinAuditoria: string;
  gastoDesperdiciado: string;
};

const ES: ResumenCopy = {
  panelBadge: "Palabras simple",
  panelTitle: "Tu cuenta, en palabras simple",
  panelTitleHistorico: "Tu cuenta en esa auditoría",
  verResumenSimple: "Ver resumen simple",
  leerResumenSimple: "Leer resumen simple",
  breadcrumbResumen: "Resumen simple",
  verPalabrasSimple: "Ver en palabras simple",
  verDetalleTecnico: "Ver detalle técnico",
  loMasUrgente: "Lo más urgente — tocá para ver el detalle completo",
  loMarcadoHistorico: "Lo que Mora había marcado en esa auditoría",
  verHallazgosEnReporte: (n) =>
    n === 1 ? "Ver 1 hallazgo más en el reporte" : `Ver los ${n} hallazgos en el reporte`,
  queEstaBien: "Qué está bien",
  sinAuditoria: "Corré una auditoría para ver tu resumen en palabras simple.",
  gastoDesperdiciado: "Gasto desperdiciado",
};

const EN: ResumenCopy = {
  panelBadge: "Plain language",
  panelTitle: "Your account, in plain language",
  panelTitleHistorico: "Your account in that audit",
  verResumenSimple: "View simple summary",
  leerResumenSimple: "Read simple summary",
  breadcrumbResumen: "Simple summary",
  verPalabrasSimple: "View in plain language",
  verDetalleTecnico: "View technical detail",
  loMasUrgente: "Most urgent — tap for full detail",
  loMarcadoHistorico: "What Mora had flagged in that audit",
  verHallazgosEnReporte: (n) =>
    n === 1 ? "View 1 more finding in the report" : `View all ${n} findings in the report`,
  queEstaBien: "What's working well",
  sinAuditoria: "Run an audit to see your plain-language summary.",
  gastoDesperdiciado: "Wasted spend",
};

export function copyResumen(locale: Locale): ResumenCopy {
  return locale === "en" ? EN : ES;
}
