/** Catálogo de campañas seed — nombres base (sin prefijo "Mora Seed — "). */
export const SEED_NAME_PREFIX = "Mora Seed — ";

export type SeedKeyword = {
  text: string;
  match: "EXACT" | "PHRASE" | "BROAD";
};

export type SeedCampaignDef = {
  baseName: string;
  budgetMicros: number;
  targetCpaMicros?: number;
  keywords: SeedKeyword[];
  /** Mock campaign id en lib/googleAds.ts para fixture términos/horarios */
  mockCampaignId: string;
};

export const SEED_CAMPAIGNS: SeedCampaignDef[] = [
  {
    baseName: "Search - Marca Exacta",
    budgetMicros: 600_000_000,
    targetCpaMicros: 10_000_000,
    mockCampaignId: "101",
    keywords: [
      { text: "mora academia ingles", match: "EXACT" },
      { text: "academia mora", match: "EXACT" },
    ],
  },
  {
    baseName: "Search - Producto Principal Exacta",
    budgetMicros: 800_000_000,
    targetCpaMicros: 10_000_000,
    mockCampaignId: "102",
    keywords: [
      { text: "curso ingles online", match: "EXACT" },
      { text: "clases ingles adultos", match: "EXACT" },
    ],
  },
  {
    baseName: "Search - Competidores Amplia",
    budgetMicros: 1_200_000_000,
    targetCpaMicros: 20_000_000,
    mockCampaignId: "104",
    keywords: [
      { text: "competidor ingles", match: "BROAD" },
      { text: "alternativa curso ingles", match: "BROAD" },
    ],
  },
  {
    baseName: "Search - Genérica Amplia Modificada",
    budgetMicros: 900_000_000,
    targetCpaMicros: 20_000_000,
    mockCampaignId: "105",
    keywords: [
      { text: "curso ingles", match: "BROAD" },
      { text: "aprender ingles online", match: "PHRASE" },
    ],
  },
  {
    baseName: "Search - Categoría Secundaria Frase",
    budgetMicros: 700_000_000,
    targetCpaMicros: 20_000_000,
    mockCampaignId: "109",
    keywords: [
      { text: "ingles certificado online", match: "PHRASE" },
      { text: "curso ingles empresas", match: "PHRASE" },
    ],
  },
  {
    baseName: "Search - Oferta Flash Sin Optimizar",
    budgetMicros: 400_000_000,
    targetCpaMicros: 20_000_000,
    mockCampaignId: "118",
    keywords: [
      { text: "ingles barato", match: "BROAD" },
      { text: "oferta curso ingles", match: "BROAD" },
    ],
  },
  {
    baseName: "Search - Marca Frase",
    budgetMicros: 500_000_000,
    targetCpaMicros: 10_000_000,
    mockCampaignId: "120",
    keywords: [
      { text: "mora academia", match: "PHRASE" },
      { text: "ingles corporativo", match: "PHRASE" },
    ],
  },
  {
    baseName: "Search - Basura Control",
    budgetMicros: 500_000_000,
    targetCpaMicros: 20_000_000,
    mockCampaignId: "105",
    keywords: [
      { text: "ingles gratis", match: "BROAD" },
      { text: "trabajo desde casa", match: "BROAD" },
      { text: "descargar curso gratis", match: "BROAD" },
    ],
  },
];

export function seedCampaignName(baseName: string): string {
  return `${SEED_NAME_PREFIX}${baseName}`;
}
