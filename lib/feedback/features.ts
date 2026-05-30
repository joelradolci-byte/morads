export const FEATURE_BLOCK_KEYS = [
  "auditoria",
  "herramientas",
  "campanas",
  "reportes",
  "anuncios",
] as const;

export type FeatureBlockKey = (typeof FEATURE_BLOCK_KEYS)[number];

export type FeatureUsage = "mucho" | "algo" | "poco" | "no_usado";

export const FEATURE_BLOCKS: {
  key: FeatureBlockKey;
  label: string;
  hint: string;
}[] = [
  {
    key: "auditoria",
    label: "Auditoría y resumen",
    hint: "Health Score, resumen fácil, quick wins",
  },
  {
    key: "herramientas",
    label: "Herramientas de optimización",
    hint: "Destripador, dayparting, simulador, Robin Hood",
  },
  {
    key: "campanas",
    label: "Campañas y pacing",
    hint: "Gestor, matriz de rendimiento, ritmo de gasto",
  },
  {
    key: "reportes",
    label: "Reportes e historial",
    hint: "Mis reportes, PDF, comparar auditorías",
  },
  {
    key: "anuncios",
    label: "Generador de anuncios",
    hint: "RSA y creativos sugeridos",
  },
];

/** Chips visibles en la encuesta (roadmap / prioridades). */
export const INTERES_ACTIVE_KEYS = [
  "multi_cuenta",
  "alertas_email",
  "meta_ads",
  "explicaciones_ia",
  "integracion_ads",
] as const;

export type InteresActiveKey = (typeof INTERES_ACTIVE_KEYS)[number];

/** Respuestas históricas; ya no se muestran en el modal. */
export const INTERES_LEGACY_KEYS = [
  "informes_cliente",
  "automatizar_mas",
] as const;

export type InteresLegacyKey = (typeof INTERES_LEGACY_KEYS)[number];

export const INTERES_KEYS = [
  ...INTERES_ACTIVE_KEYS,
  ...INTERES_LEGACY_KEYS,
] as const;

export type InteresKey = (typeof INTERES_KEYS)[number];

export const INTERES_OPTIONS: { key: InteresActiveKey; label: string }[] = [
  {
    key: "multi_cuenta",
    label: "Gestionar varias cuentas o clientes en un solo panel",
  },
  {
    key: "alertas_email",
    label: "Avisos por email si el rendimiento o el gasto se desvían",
  },
  {
    key: "meta_ads",
    label: "Auditar y optimizar Meta Ads (además de Google)",
  },
  {
    key: "explicaciones_ia",
    label: "Entender mejor por qué la IA recomienda cada cambio",
  },
  {
    key: "integracion_ads",
    label:
      "Conectar mi cuenta de Google Ads y usar datos reales sin tanto paso manual",
  },
];

export const INTERES_LEGACY_OPTIONS: {
  key: InteresLegacyKey;
  label: string;
}[] = [
  {
    key: "informes_cliente",
    label: "Informes listos para clientes (histórico)",
  },
  {
    key: "automatizar_mas",
    label: "Más automatización con tu OK (histórico)",
  },
];

/** Admin: conteos activos + legacy. */
export const INTERES_ADMIN_OPTIONS: {
  key: InteresKey;
  label: string;
  legacy?: boolean;
}[] = [
  ...INTERES_OPTIONS.map((o) => ({ ...o, legacy: false as const })),
  ...INTERES_LEGACY_OPTIONS.map((o) => ({ ...o, legacy: true as const })),
];

export const USAGE_LABELS: Record<FeatureUsage, string> = {
  mucho: "Mucho",
  algo: "Algo",
  poco: "Poco o nada",
  no_usado: "No lo usé",
};
