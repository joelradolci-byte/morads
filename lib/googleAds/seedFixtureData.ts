import type { CampanaMora, DatoHorarioCampana, TerminoBusqueda } from "../motorMora";
import { SEED_CAMPAIGNS, seedCampaignName } from "./seedCatalog";

type QsComponents = {
  score: number;
  ctrExpected: CampanaMora["quality_ctr"];
  adRelevance: CampanaMora["quality_relevance"];
  landingPageExp: CampanaMora["quality_landing"];
};

/** Métricas de campaña por mock id (lib/googleAds.ts). */
const MOCK_CAMPAIGN_METRICS: Record<
  string,
  {
    presupuesto_mensual: number;
    gasto_mensual: number;
    clics: number;
    conversiones: number;
    cpa_objetivo: number;
    quality?: QsComponents;
    search_lost_is_budget?: number;
  }
> = {
  "101": {
    presupuesto_mensual: 600,
    gasto_mensual: 240,
    clics: 1200,
    conversiones: 48,
    cpa_objetivo: 10,
    quality: {
      score: 9,
      ctrExpected: "ABOVE_AVERAGE",
      adRelevance: "ABOVE_AVERAGE",
      landingPageExp: "ABOVE_AVERAGE",
    },
    search_lost_is_budget: 0.24,
  },
  "102": {
    presupuesto_mensual: 800,
    gasto_mensual: 190,
    clics: 950,
    conversiones: 35,
    cpa_objetivo: 10,
    quality: {
      score: 8,
      ctrExpected: "ABOVE_AVERAGE",
      adRelevance: "ABOVE_AVERAGE",
      landingPageExp: "AVERAGE",
    },
    search_lost_is_budget: 0.24,
  },
  "104": {
    presupuesto_mensual: 1200,
    gasto_mensual: 960,
    clics: 1800,
    conversiones: 12,
    cpa_objetivo: 20,
    quality: {
      score: 3,
      ctrExpected: "AVERAGE",
      adRelevance: "AVERAGE",
      landingPageExp: "BELOW_AVERAGE",
    },
  },
  "105": {
    presupuesto_mensual: 900,
    gasto_mensual: 750,
    clics: 2200,
    conversiones: 8,
    cpa_objetivo: 20,
    quality: {
      score: 4,
      ctrExpected: "BELOW_AVERAGE",
      adRelevance: "BELOW_AVERAGE",
      landingPageExp: "AVERAGE",
    },
  },
  "109": {
    presupuesto_mensual: 700,
    gasto_mensual: 330,
    clics: 1100,
    conversiones: 18,
    cpa_objetivo: 20,
    quality: {
      score: 6,
      ctrExpected: "AVERAGE",
      adRelevance: "AVERAGE",
      landingPageExp: "AVERAGE",
    },
  },
  "118": {
    presupuesto_mensual: 400,
    gasto_mensual: 290,
    clics: 750,
    conversiones: 9,
    cpa_objetivo: 20,
    quality: {
      score: 2,
      ctrExpected: "BELOW_AVERAGE",
      adRelevance: "BELOW_AVERAGE",
      landingPageExp: "BELOW_AVERAGE",
    },
  },
  "120": {
    presupuesto_mensual: 500,
    gasto_mensual: 175,
    clics: 880,
    conversiones: 30,
    cpa_objetivo: 10,
    quality: {
      score: 8,
      ctrExpected: "ABOVE_AVERAGE",
      adRelevance: "ABOVE_AVERAGE",
      landingPageExp: "AVERAGE",
    },
    search_lost_is_budget: 0.24,
  },
};

const MOCK_SEARCH_TERMS: Array<{
  text: string;
  mockCampaignId: string;
  clicks: number;
  gasto: number;
  conversiones: number;
}> = [
  { text: "curso de ingles gratis", mockCampaignId: "104", clicks: 95, gasto: 148, conversiones: 0 },
  { text: "ingles gratis online", mockCampaignId: "105", clicks: 120, gasto: 180, conversiones: 0 },
  { text: "trabajo desde casa sin experiencia", mockCampaignId: "105", clicks: 145, gasto: 195, conversiones: 0 },
  { text: "competidor marca descuento", mockCampaignId: "104", clicks: 115, gasto: 168, conversiones: 0 },
  { text: "ingles gratis para siempre", mockCampaignId: "105", clicks: 145, gasto: 208, conversiones: 0 },
  { text: "descargar ingles gratis apk", mockCampaignId: "104", clicks: 88, gasto: 128, conversiones: 0 },
  { text: "alternativa barata a producto", mockCampaignId: "105", clicks: 98, gasto: 144, conversiones: 0 },
  {
    text: "curso ingles online certificado internacional",
    mockCampaignId: "109",
    clicks: 85,
    gasto: 195,
    conversiones: 3,
  },
  { text: "agencia marketing digital precios", mockCampaignId: "109", clicks: 72, gasto: 165, conversiones: 2 },
  { text: "consultor marketing freelance", mockCampaignId: "109", clicks: 55, gasto: 126, conversiones: 1 },
  { text: "curso ingles online certificado", mockCampaignId: "101", clicks: 420, gasto: 98, conversiones: 25 },
  { text: "academia ingles online", mockCampaignId: "101", clicks: 380, gasto: 88, conversiones: 22 },
  { text: "clases ingles online adultos", mockCampaignId: "102", clicks: 310, gasto: 72, conversiones: 19 },
  { text: "ingles para profesionales", mockCampaignId: "120", clicks: 220, gasto: 51, conversiones: 14 },
  { text: "ingles corporativo empresas", mockCampaignId: "120", clicks: 160, gasto: 58, conversiones: 10 },
];

const SEMANAS = 8;

function buildHourlyRows(): Array<{
  mockCampaignId: string;
  dia_semana: number;
  hora: number;
  clicks: number;
  gasto: number;
  conversiones: number;
}> {
  const rows: Array<{
    mockCampaignId: string;
    dia_semana: number;
    hora: number;
    clicks: number;
    gasto: number;
    conversiones: number;
  }> = [];

  const pushProfile = (
    mockCampaignId: string,
    profile: (dow: number, h: number) => { clicks: number; cost: number; conv: number }
  ) => {
    for (let sem = 0; sem < SEMANAS; sem++) {
      for (let dow = 0; dow < 7; dow++) {
        for (let h = 0; h < 24; h++) {
          const p = profile(dow, h);
          if (p.clicks <= 0 && p.cost <= 0) continue;
          const jitter = 0.85 + (sem % 3) * 0.08;
          rows.push({
            mockCampaignId,
            dia_semana: dow,
            hora: h,
            clicks: Math.round(p.clicks * jitter),
            gasto: p.cost * jitter,
            conversiones: p.conv,
          });
        }
      }
    }
  };

  ["104", "105"].forEach((id) => {
    pushProfile(id, (dow, h) => {
      const madrugada = h >= 1 && h <= 5;
      const jueVieNoche = (dow === 3 || dow === 4) && h >= 22;
      if (madrugada || jueVieNoche) return { clicks: 55 + h * 6, cost: 42 + h * 8, conv: 0 };
      if (h >= 10 && h <= 17) return { clicks: 20, cost: 14, conv: dow % 3 === 0 ? 1 : 0 };
      return { clicks: 6, cost: 4, conv: 0 };
    });
  });

  ["101", "102"].forEach((id) => {
    pushProfile(id, (dow, h) => {
      const laboral = dow >= 0 && dow <= 4;
      const peak = laboral && h >= 9 && h <= 19;
      if (peak) return { clicks: 28 + (h % 4) * 3, cost: 12 + (h % 2), conv: h % 2 === 0 ? 2 : 1 };
      if (dow === 5 && h >= 10 && h <= 14) return { clicks: 15, cost: 8, conv: 1 };
      return { clicks: 3, cost: 1.5, conv: 0 };
    });
  });

  ["109"].forEach((id) => {
    pushProfile(id, (_dow, h) => {
      if (h >= 11 && h <= 18) return { clicks: 14, cost: 9, conv: 1 };
      return { clicks: 2, cost: 1, conv: 0 };
    });
  });

  return rows;
}

const MOCK_HOURLY = buildHourlyRows();

export type CampaignManifestEntry = {
  id: string;
  name: string;
  mockCampaignId: string;
};

export function applyFixtureToCampaigns(
  campaigns: CampanaMora[],
  manifest: CampaignManifestEntry[]
): CampanaMora[] {
  const mockByName = new Map(
    manifest.map((m) => [m.name, m.mockCampaignId])
  );
  const baseByName = new Map(
    SEED_CAMPAIGNS.map((c) => [seedCampaignName(c.baseName), c.mockCampaignId])
  );

  return campaigns.map((camp) => {
    const mockId =
      mockByName.get(camp.nombre) ??
      baseByName.get(camp.nombre) ??
      SEED_CAMPAIGNS.find((c) => camp.nombre.includes(c.baseName))?.mockCampaignId;
    if (!mockId) return camp;

    const m = MOCK_CAMPAIGN_METRICS[mockId];
    if (!m) return camp;

    const cpaActual =
      m.conversiones > 0
        ? parseFloat((m.gasto_mensual / m.conversiones).toFixed(2))
        : 9999;

    return {
      ...camp,
      presupuesto_mensual: m.presupuesto_mensual,
      gasto_mensual: m.gasto_mensual,
      clics: m.clics,
      conversiones: m.conversiones,
      cpa_actual: cpaActual,
      cpa_objetivo: m.cpa_objetivo,
      quality_score: m.quality?.score,
      quality_ctr: m.quality?.ctrExpected,
      quality_relevance: m.quality?.adRelevance,
      quality_landing: m.quality?.landingPageExp,
      search_lost_is_budget: m.search_lost_is_budget,
      estado: "ENABLED",
    };
  });
}

export function buildFixtureTerminos(
  manifest: CampaignManifestEntry[]
): TerminoBusqueda[] {
  const idByMock = new Map<string, string>();
  for (const m of manifest) {
    idByMock.set(m.mockCampaignId, m.id);
  }
  for (const c of SEED_CAMPAIGNS) {
    const name = seedCampaignName(c.baseName);
    const entry = manifest.find((m) => m.name === name);
    if (entry) idByMock.set(c.mockCampaignId, entry.id);
  }

  return MOCK_SEARCH_TERMS.map((t) => ({
    termino_exacto: t.text,
    id_campana_asociada: idByMock.get(t.mockCampaignId) ?? t.mockCampaignId,
    gasto: t.gasto,
    clics: t.clicks,
    conversiones: t.conversiones,
  })).filter((t) => t.id_campana_asociada.length > 0);
}

export function buildFixtureHorarios(
  manifest: CampaignManifestEntry[]
): DatoHorarioCampana[] {
  const metaByMock = new Map<string, { id: string; name: string }>();
  for (const m of manifest) {
    metaByMock.set(m.mockCampaignId, { id: m.id, name: m.name });
  }
  for (const c of SEED_CAMPAIGNS) {
    const name = seedCampaignName(c.baseName);
    const entry = manifest.find((m) => m.name === name);
    if (entry) metaByMock.set(c.mockCampaignId, { id: entry.id, name: entry.name });
  }

  return MOCK_HOURLY.map((row) => {
    const meta = metaByMock.get(row.mockCampaignId);
    if (!meta) return null;
    return {
      campana_id: meta.id,
      campana_nombre: meta.name,
      dia_semana: row.dia_semana,
      hora: row.hora,
      gasto: row.gasto,
      clics: row.clicks,
      conversiones: row.conversiones,
    };
  }).filter((r): r is DatoHorarioCampana => r !== null);
}

export function buildManifestFromCampaigns(
  campaigns: CampanaMora[]
): CampaignManifestEntry[] {
  return campaigns
    .map((c) => {
      const def = SEED_CAMPAIGNS.find(
        (s) => c.nombre === seedCampaignName(s.baseName) || c.nombre.includes(s.baseName)
      );
      if (!def) return null;
      return {
        id: c.id,
        name: c.nombre,
        mockCampaignId: def.mockCampaignId,
      };
    })
    .filter((e): e is CampaignManifestEntry => e !== null);
}
