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

export const INTERES_KEYS = [
  "multi_cuenta",
  "alertas_email",
  "meta_ads",
  "informes_cliente",
  "automatizar_mas",
] as const;

export type InteresKey = (typeof INTERES_KEYS)[number];

export const INTERES_OPTIONS: { key: InteresKey; label: string }[] = [
  { key: "multi_cuenta", label: "Varias cuentas / modo agencia" },
  { key: "alertas_email", label: "Alertas cuando algo se rompe" },
  { key: "meta_ads", label: "Soporte para Meta Ads" },
  { key: "informes_cliente", label: "Informes listos para clientes" },
  { key: "automatizar_mas", label: "Más automatización con tu OK" },
];

export const USAGE_LABELS: Record<FeatureUsage, string> = {
  mucho: "Mucho",
  algo: "Algo",
  poco: "Poco o nada",
  no_usado: "No lo usé",
};
