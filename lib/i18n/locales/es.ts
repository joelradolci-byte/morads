export const es = {
  settings: {
    title: "Configuración",
    experience: "Experiencia en Mora",
    language: "Idioma",
    languageHint: "Aplica a la app y a las próximas auditorías con IA.",
    languageEs: "Español",
    languageEn: "English",
    resumenAutoAbrir: "Abrir resumen al terminar una auditoría",
    pdfBrand: "Tu marca en el PDF",
    businessName: "Nombre de tu negocio",
    businessNameHint: "Aparece en la portada del reporte PDF.",
    website: "Sitio web",
    websitePlaceholder: "Ej: www.tunegocio.com",
    logo: "Logo",
    footer: "Texto al pie del PDF",
    footerHint: "Confidencialidad, disclaimer legal, etc.",
    save: "Guardar cambios",
    saving: "Guardando…",
    saved: "Cambios guardados",
    account: "Cuenta y plan",
    currencyBadge: (code: string) => `Montos en ${code}`,
  },
  common: {
    cancel: "Cancelar",
  },
};

export type SettingsDict = typeof es.settings;
export type EsDict = { settings: SettingsDict; common: { cancel: string } };
