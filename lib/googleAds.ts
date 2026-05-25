// /lib/googleAds.ts
// Mock que imita la respuesta real de la Google Ads API
// Estructura alineada con CampanaMora y DatosAuditoriaInput de motorMora.ts

import type {
  CampanaMora,
  TerminoBusqueda,
  DatosAuditoriaInput,
  DatoHorarioCampana,
} from "./motorMora";

// ============================================================================
// TIPOS QUE IMITAN LA RESPUESTA CRUDA DE LA API DE GOOGLE ADS
// ============================================================================
interface GoogleAdsCampaignRaw {
  campaign: {
    id: string;
    name: string;
    status: "ENABLED" | "PAUSED" | "REMOVED";
  };
  campaignBudget: {
    amountMicros: string;
  };
  metrics: {
    clicks: string;
    impressions: string;
    costMicros: string;
    conversions: string;
  };
  targetCpaMicros?: string;
  qualityScore?: {
    score: number;
    ctrExpected: "ABOVE_AVERAGE" | "AVERAGE" | "BELOW_AVERAGE" | "UNKNOWN";
    adRelevance: "ABOVE_AVERAGE" | "AVERAGE" | "BELOW_AVERAGE" | "UNKNOWN";
    landingPageExp: "ABOVE_AVERAGE" | "AVERAGE" | "BELOW_AVERAGE" | "UNKNOWN";
  };
}

interface GoogleAdsSearchTermRaw {
  text: string;
  campaignId: string;
  clicks: string;
  costMicros: string;
  conversions: string;
}

interface GoogleAdsHourlyRaw {
  campaignId: string;
  dia_semana: number;
  hora: number;
  clicks: string;
  costMicros: string;
  conversions: string;
}

/** Simula ~60 días de histórico agregable por (día de semana × hora). */
const SEMANAS_HISTORICO_MOCK = 8;

// ============================================================================
// DATOS MOCK LIVIANOS — 10 campañas + 22 términos (free tier / pruebas)
// Cubre: estrella, basura, media, QS bajo, dayparting
// ============================================================================

const mockCampaigns: GoogleAdsCampaignRaw[] = [
  {
    campaign: { id: "101", name: "Search - Marca Exacta", status: "ENABLED" },
    campaignBudget: { amountMicros: "600000000" },
    metrics: { clicks: "1200", impressions: "8000", costMicros: "240000000", conversions: "48" },
    targetCpaMicros: "10000000",
    qualityScore: { score: 9, ctrExpected: "ABOVE_AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "ABOVE_AVERAGE" },
  },
  {
    campaign: { id: "102", name: "Search - Producto Principal Exacta", status: "ENABLED" },
    campaignBudget: { amountMicros: "800000000" },
    metrics: { clicks: "950", impressions: "6500", costMicros: "190000000", conversions: "35" },
    targetCpaMicros: "10000000",
    qualityScore: { score: 8, ctrExpected: "ABOVE_AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "AVERAGE" },
  },
  {
    campaign: { id: "104", name: "Search - Competidores Amplia", status: "ENABLED" },
    campaignBudget: { amountMicros: "1200000000" },
    metrics: { clicks: "1800", impressions: "22000", costMicros: "960000000", conversions: "12" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 3, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "BELOW_AVERAGE" },
  },
  {
    campaign: { id: "105", name: "Search - Genérica Amplia Modificada", status: "ENABLED" },
    campaignBudget: { amountMicros: "900000000" },
    metrics: { clicks: "2200", impressions: "35000", costMicros: "750000000", conversions: "8" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 4, ctrExpected: "BELOW_AVERAGE", adRelevance: "BELOW_AVERAGE", landingPageExp: "AVERAGE" },
  },
  {
    campaign: { id: "106", name: "Display - Red General Sin Segmentar", status: "ENABLED" },
    campaignBudget: { amountMicros: "500000000" },
    metrics: { clicks: "3500", impressions: "180000", costMicros: "420000000", conversions: "5" },
    targetCpaMicros: "25000000",
    qualityScore: { score: 4, ctrExpected: "BELOW_AVERAGE", adRelevance: "AVERAGE", landingPageExp: "BELOW_AVERAGE" },
  },
  {
    campaign: { id: "108", name: "PMax - General Ecommerce", status: "ENABLED" },
    campaignBudget: { amountMicros: "1500000000" },
    metrics: { clicks: "2800", impressions: "55000", costMicros: "700000000", conversions: "35" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 6, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" },
  },
  {
    campaign: { id: "109", name: "Search - Categoría Secundaria Frase", status: "ENABLED" },
    campaignBudget: { amountMicros: "700000000" },
    metrics: { clicks: "1100", impressions: "14000", costMicros: "330000000", conversions: "18" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 6, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" },
  },
  {
    campaign: { id: "118", name: "Search - Oferta Flash Sin Optimizar", status: "ENABLED" },
    campaignBudget: { amountMicros: "400000000" },
    metrics: { clicks: "750", impressions: "9000", costMicros: "290000000", conversions: "9" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 2, ctrExpected: "BELOW_AVERAGE", adRelevance: "BELOW_AVERAGE", landingPageExp: "BELOW_AVERAGE" },
  },
  {
    campaign: { id: "120", name: "Search - Marca Frase", status: "ENABLED" },
    campaignBudget: { amountMicros: "500000000" },
    metrics: { clicks: "880", impressions: "5500", costMicros: "175000000", conversions: "30" },
    targetCpaMicros: "10000000",
    qualityScore: { score: 8, ctrExpected: "ABOVE_AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "AVERAGE" },
  },
  {
    campaign: { id: "123", name: "Display - Retargeting 7d Alta Intención", status: "ENABLED" },
    campaignBudget: { amountMicros: "300000000" },
    metrics: { clicks: "510", impressions: "14000", costMicros: "145000000", conversions: "11" },
    targetCpaMicros: "15000000",
    qualityScore: { score: 8, ctrExpected: "ABOVE_AVERAGE", adRelevance: "AVERAGE", landingPageExp: "ABOVE_AVERAGE" },
  },
];

const mockSearchTerms: GoogleAdsSearchTermRaw[] = [
  // BASURA
  { text: "curso de ingles gratis", campaignId: "104", clicks: "95", costMicros: "148000000", conversions: "0" },
  { text: "ingles gratis online", campaignId: "105", clicks: "120", costMicros: "180000000", conversions: "0" },
  { text: "trabajo desde casa sin experiencia", campaignId: "106", clicks: "145", costMicros: "195000000", conversions: "0" },
  { text: "competidor marca descuento", campaignId: "104", clicks: "115", costMicros: "168000000", conversions: "0" },
  { text: "ingles gratis para siempre", campaignId: "105", clicks: "145", costMicros: "208000000", conversions: "0" },
  { text: "descargar ingles gratis apk", campaignId: "104", clicks: "88", costMicros: "128000000", conversions: "0" },
  { text: "ganar dinero rapido internet", campaignId: "106", clicks: "188", costMicros: "248000000", conversions: "0" },
  { text: "alternativa barata a producto", campaignId: "105", clicks: "98", costMicros: "144000000", conversions: "0" },
  // PARCIAL (CPA alto)
  { text: "curso ingles online certificado internacional", campaignId: "109", clicks: "85", costMicros: "195000000", conversions: "3" },
  { text: "agencia marketing digital precios", campaignId: "109", clicks: "72", costMicros: "165000000", conversions: "2" },
  { text: "consultor marketing freelance", campaignId: "109", clicks: "55", costMicros: "126000000", conversions: "1" },
  // ESTRELLA
  { text: "curso ingles online certificado", campaignId: "101", clicks: "420", costMicros: "98000000", conversions: "25" },
  { text: "academia ingles online", campaignId: "101", clicks: "380", costMicros: "88000000", conversions: "22" },
  { text: "clases ingles online adultos", campaignId: "102", clicks: "310", costMicros: "72000000", conversions: "19" },
  { text: "ingles para profesionales", campaignId: "120", clicks: "220", costMicros: "51000000", conversions: "14" },
  { text: "ingles corporativo empresas", campaignId: "120", clicks: "160", costMicros: "58000000", conversions: "10" },
  // NEUTRO / MEDIO
  { text: "clases ingles online precios", campaignId: "108", clicks: "340", costMicros: "78000000", conversions: "12" },
  { text: "mejor plataforma ingles online", campaignId: "108", clicks: "220", costMicros: "51000000", conversions: "7" },
  { text: "ingles online principiantes", campaignId: "109", clicks: "195", costMicros: "45000000", conversions: "6" },
  { text: "ingles conversacional online", campaignId: "108", clicks: "198", costMicros: "46000000", conversions: "6" },
  { text: "ingles para entrevistas trabajo", campaignId: "123", clicks: "185", costMicros: "43000000", conversions: "7" },
  { text: "ingles online precio mensual", campaignId: "108", clicks: "205", costMicros: "48000000", conversions: "7" },
  { text: "ingles online con profesor", campaignId: "101", clicks: "265", costMicros: "62000000", conversions: "16" },
  { text: "hablar ingles fluido rapido", campaignId: "120", clicks: "192", costMicros: "45000000", conversions: "12" },
];

const campaignNameById = new Map(
  mockCampaigns.map(c => [c.campaign.id, c.campaign.name])
);

/** Perfil por día de semana (0=L) y hora — acumulado en mock por varias semanas. */
function buildMockHourlyPerformance(): GoogleAdsHourlyRaw[] {
  const rows: GoogleAdsHourlyRaw[] = [];
  const campanasBasura = ["104", "105", "106"];
  const campanasEstrella = ["101", "102"];
  const campanasMedias = ["108", "109"];

  const pushSemanas = (
    campaignId: string,
    profile: (dow: number, h: number) => { clicks: number; cost: number; conv: number }
  ) => {
    for (let sem = 0; sem < SEMANAS_HISTORICO_MOCK; sem++) {
      for (let dow = 0; dow < 7; dow++) {
        for (let h = 0; h < 24; h++) {
          const p = profile(dow, h);
          if (p.clicks <= 0 && p.cost <= 0) continue;
          const jitter = 0.85 + (sem % 3) * 0.08;
          rows.push({
            campaignId,
            dia_semana: dow,
            hora: h,
            clicks: String(Math.round(p.clicks * jitter)),
            costMicros: String(Math.round(p.cost * jitter * 1_000_000)),
            conversions: String(p.conv),
          });
        }
      }
    }
  };

  campanasBasura.forEach(id => {
    pushSemanas(id, (dow, h) => {
      const madrugada = h >= 1 && h <= 5;
      const jueVieNoche = (dow === 3 || dow === 4) && h >= 22;
      if (madrugada || jueVieNoche) {
        return { clicks: 55 + h * 6, cost: 42 + h * 8, conv: 0 };
      }
      if (h >= 10 && h <= 17) return { clicks: 20, cost: 14, conv: dow % 3 === 0 ? 1 : 0 };
      return { clicks: 6, cost: 4, conv: 0 };
    });
  });

  campanasEstrella.forEach(id => {
    pushSemanas(id, (dow, h) => {
      const laboral = dow >= 0 && dow <= 4;
      const peak = laboral && h >= 9 && h <= 19;
      if (peak) return { clicks: 28 + (h % 4) * 3, cost: 12 + (h % 2), conv: h % 2 === 0 ? 2 : 1 };
      if (dow === 5 && h >= 10 && h <= 14) return { clicks: 15, cost: 8, conv: 1 };
      return { clicks: 3, cost: 1.5, conv: 0 };
    });
  });

  campanasMedias.forEach(id => {
    pushSemanas(id, (_dow, h) => {
      if (h >= 11 && h <= 18) return { clicks: 14, cost: 9, conv: 1 };
      return { clicks: 2, cost: 1, conv: 0 };
    });
  });

  return rows;
}

const mockHourlyPerformance = buildMockHourlyPerformance();

// ============================================================================
// FUNCIÓN EXTRACTORA PRINCIPAL
// ============================================================================
export const extraerDatosGoogle = async (): Promise<CampanaMora[]> => {
  await new Promise(resolve => setTimeout(resolve, 700));

  return mockCampaigns.map((item): CampanaMora => {
    const presupuestoMensual = parseInt(item.campaignBudget.amountMicros) / 1_000_000;
    const gastoMensual = parseInt(item.metrics.costMicros) / 1_000_000;
    const conversiones = parseFloat(item.metrics.conversions);
    const clics = parseInt(item.metrics.clicks);

    const cpaActual = conversiones > 0
      ? parseFloat((gastoMensual / conversiones).toFixed(2))
      : 9999;

    const cpaObjetivo = item.targetCpaMicros
      ? parseInt(item.targetCpaMicros) / 1_000_000
      : 20;
    const perdidaPresupuesto = ["101", "102", "120", "123"].includes(item.campaign.id)
      ? 0.24
      : undefined;

    return {
      id: item.campaign.id,
      nombre: item.campaign.name,
      estado: item.campaign.status,
      presupuesto_mensual: presupuestoMensual,
      gasto_mensual: gastoMensual,
      clics,
      conversiones,
      cpa_actual: cpaActual,
      cpa_objetivo: cpaObjetivo,
      quality_score: item.qualityScore?.score,
      quality_ctr: item.qualityScore?.ctrExpected,
      quality_relevance: item.qualityScore?.adRelevance,
      quality_landing: item.qualityScore?.landingPageExp,
      search_lost_is_budget: perdidaPresupuesto,
    };
  });
};

export const extraerDatosHorariosGoogle = async (): Promise<DatoHorarioCampana[]> => {
  await new Promise(resolve => setTimeout(resolve, 350));

  return mockHourlyPerformance.map(
    (item): DatoHorarioCampana => ({
      campana_id: item.campaignId,
      campana_nombre: campaignNameById.get(item.campaignId) || `Campaña ${item.campaignId}`,
      dia_semana: item.dia_semana,
      hora: item.hora,
      gasto: parseInt(item.costMicros) / 1_000_000,
      clics: parseInt(item.clicks),
      conversiones: parseFloat(item.conversions),
    })
  );
};

export const extraerTerminosGoogle = async (): Promise<TerminoBusqueda[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));

  return mockSearchTerms.map((item): TerminoBusqueda => ({
    termino_exacto: item.text,
    id_campana_asociada: item.campaignId,
    gasto: parseInt(item.costMicros) / 1_000_000,
    clics: parseInt(item.clicks),
    conversiones: parseFloat(item.conversions),
  }));
};

export const construirDatosAuditoria = async (): Promise<DatosAuditoriaInput> => {
  const [campanas, terminos, horarios] = await Promise.all([
    extraerDatosGoogle(),
    extraerTerminosGoogle(),
    extraerDatosHorariosGoogle(),
  ]);

  const soloActivas = campanas.filter(c =>
    c.estado === "ENABLED" && c.gasto_mensual > 0
  );

  const gastoTotal = soloActivas.reduce((acc, c) => acc + c.gasto_mensual, 0);
  const conversionesTotales = soloActivas.reduce((acc, c) => acc + c.conversiones, 0);
  const clicsTotales = soloActivas.reduce((acc, c) => acc + c.clics, 0);
  const cpaPromedioCuenta = conversionesTotales > 0
    ? parseFloat((gastoTotal / conversionesTotales).toFixed(2))
    : 20;

  return {
    tipo_negocio: "ecommerce",
    cpa_promedio_cuenta: cpaPromedioCuenta,
    gasto_total_cuenta: parseFloat(gastoTotal.toFixed(2)),
    conversiones_totales: conversionesTotales,
    clics_totales: clicsTotales,
    campanas,
    terminos,
    horarios,
  };
};
