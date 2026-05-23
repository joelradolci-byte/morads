// /lib/googleAds.ts
// Mock que imita la respuesta real de la Google Ads API
// Estructura alineada con CampanaMora y DatosAuditoriaInput de motorMora.ts

import type { CampanaMora, TerminoBusqueda, DatosAuditoriaInput } from "./motorMora";

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
    amountMicros: string; // Presupuesto mensual en micros (1 USD = 1,000,000 micros)
  };
  metrics: {
    clicks: string;
    impressions: string;
    costMicros: string; // Gasto en micros
    conversions: string;
  };
  targetCpaMicros?: string; // CPA objetivo configurado en Google Ads (puede no existir)
  qualityScore?: {
    score: number; // 1-10
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

// ============================================================================
// DATOS MOCK — 25 CAMPAÑAS + 90 TÉRMINOS DE BÚSQUEDA
// Representan una cuenta mediana de agencia con historial real
// ============================================================================

const mockCampaigns: GoogleAdsCampaignRaw[] = [
  // --- CAMPAÑAS ESTRELLA (CPA muy bajo, muchas conversiones) ---
  {
    campaign: { id: "101", name: "Search - Marca Exacta", status: "ENABLED" },
    campaignBudget: { amountMicros: "600000000" },
    metrics: { clicks: "1200", impressions: "8000", costMicros: "240000000", conversions: "48" },
    targetCpaMicros: "10000000",
    qualityScore: { score: 9, ctrExpected: "ABOVE_AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "ABOVE_AVERAGE" }
  },
  {
    campaign: { id: "102", name: "Search - Producto Principal Exacta", status: "ENABLED" },
    campaignBudget: { amountMicros: "800000000" },
    metrics: { clicks: "950", impressions: "6500", costMicros: "190000000", conversions: "35" },
    targetCpaMicros: "10000000",
    qualityScore: { score: 8, ctrExpected: "ABOVE_AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "103", name: "Search - Remarketing Lista Clientes", status: "ENABLED" },
    campaignBudget: { amountMicros: "400000000" },
    metrics: { clicks: "600", impressions: "3000", costMicros: "120000000", conversions: "28" },
    targetCpaMicros: "8000000",
    qualityScore: { score: 9, ctrExpected: "ABOVE_AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "ABOVE_AVERAGE" }
  },

  // --- CAMPAÑAS BASURA (CPA altísimo, desperdicio claro) ---
  {
    campaign: { id: "104", name: "Search - Competidores Amplia", status: "ENABLED" },
    campaignBudget: { amountMicros: "1200000000" },
    metrics: { clicks: "1800", impressions: "22000", costMicros: "960000000", conversions: "12" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 3, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "BELOW_AVERAGE" }
  },
  {
    campaign: { id: "105", name: "Search - Genérica Amplia Modificada", status: "ENABLED" },
    campaignBudget: { amountMicros: "900000000" },
    metrics: { clicks: "2200", impressions: "35000", costMicros: "750000000", conversions: "8" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 4, ctrExpected: "BELOW_AVERAGE", adRelevance: "BELOW_AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "106", name: "Display - Red General Sin Segmentar", status: "ENABLED" },
    campaignBudget: { amountMicros: "500000000" },
    metrics: { clicks: "3500", impressions: "180000", costMicros: "420000000", conversions: "5" },
    targetCpaMicros: "25000000",
    qualityScore: { score: 4, ctrExpected: "BELOW_AVERAGE", adRelevance: "AVERAGE", landingPageExp: "BELOW_AVERAGE" }
  },
  {
    campaign: { id: "107", name: "Video - YouTube Sin Conversiones", status: "ENABLED" },
    campaignBudget: { amountMicros: "600000000" },
    metrics: { clicks: "420", impressions: "95000", costMicros: "380000000", conversions: "3" },
    targetCpaMicros: "25000000",
    qualityScore: { score: 5, ctrExpected: "AVERAGE", adRelevance: "BELOW_AVERAGE", landingPageExp: "AVERAGE" }
  },

  // --- CAMPAÑAS DUDOSAS (CPA promedio, ni buenas ni malas) ---
  {
    campaign: { id: "108", name: "PMax - General Ecommerce", status: "ENABLED" },
    campaignBudget: { amountMicros: "1500000000" },
    metrics: { clicks: "2800", impressions: "55000", costMicros: "700000000", conversions: "35" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 6, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "109", name: "Search - Categoría Secundaria Frase", status: "ENABLED" },
    campaignBudget: { amountMicros: "700000000" },
    metrics: { clicks: "1100", impressions: "14000", costMicros: "330000000", conversions: "18" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 6, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "110", name: "Search - Productos Relacionados", status: "ENABLED" },
    campaignBudget: { amountMicros: "600000000" },
    metrics: { clicks: "900", impressions: "12000", costMicros: "280000000", conversions: "15" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 7, ctrExpected: "AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "111", name: "Shopping - Catálogo Completo", status: "ENABLED" },
    campaignBudget: { amountMicros: "1000000000" },
    metrics: { clicks: "1600", impressions: "28000", costMicros: "480000000", conversions: "22" },
    targetCpaMicros: "22000000",
    qualityScore: { score: 6, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" }
  },

  // --- CAMPAÑAS POTENCIAL (pocas conversiones, aún sin datos suficientes) ---
  {
    campaign: { id: "112", name: "Display - Retargeting 30d", status: "ENABLED" },
    campaignBudget: { amountMicros: "200000000" },
    metrics: { clicks: "280", impressions: "12000", costMicros: "85000000", conversions: "3" },
    targetCpaMicros: "25000000",
    qualityScore: { score: 7, ctrExpected: "ABOVE_AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "113", name: "Search - Nueva Línea Producto", status: "ENABLED" },
    campaignBudget: { amountMicros: "300000000" },
    metrics: { clicks: "190", impressions: "4500", costMicros: "95000000", conversions: "2" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 7, ctrExpected: "AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "114", name: "Display - Audiencia Similar", status: "ENABLED" },
    campaignBudget: { amountMicros: "250000000" },
    metrics: { clicks: "320", impressions: "18000", costMicros: "75000000", conversions: "2" },
    targetCpaMicros: "25000000",
    qualityScore: { score: 6, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "115", name: "PMax - Temporada Alta", status: "ENABLED" },
    campaignBudget: { amountMicros: "400000000" },
    metrics: { clicks: "150", impressions: "8000", costMicros: "60000000", conversions: "1" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 6, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" }
  },

  // --- CAMPAÑAS PAUSADAS CON GASTO HISTÓRICO ---
  {
    campaign: { id: "116", name: "Video - YouTube Awareness Q1", status: "PAUSED" },
    campaignBudget: { amountMicros: "500000000" },
    metrics: { clicks: "85", impressions: "22000", costMicros: "210000000", conversions: "0" },
    qualityScore: { score: 5, ctrExpected: "AVERAGE", adRelevance: "BELOW_AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "117", name: "Display - Banner Verano", status: "PAUSED" },
    campaignBudget: { amountMicros: "300000000" },
    metrics: { clicks: "450", impressions: "35000", costMicros: "140000000", conversions: "2" },
    qualityScore: { score: 5, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "BELOW_AVERAGE" }
  },

  // --- CAMPAÑAS CON QUALITY SCORE CRÍTICO ---
  {
    campaign: { id: "118", name: "Search - Oferta Flash Sin Optimizar", status: "ENABLED" },
    campaignBudget: { amountMicros: "400000000" },
    metrics: { clicks: "750", impressions: "9000", costMicros: "290000000", conversions: "9" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 2, ctrExpected: "BELOW_AVERAGE", adRelevance: "BELOW_AVERAGE", landingPageExp: "BELOW_AVERAGE" }
  },
  {
    campaign: { id: "119", name: "Search - Keywords Duplicadas", status: "ENABLED" },
    campaignBudget: { amountMicros: "350000000" },
    metrics: { clicks: "620", impressions: "8500", costMicros: "240000000", conversions: "7" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 3, ctrExpected: "AVERAGE", adRelevance: "BELOW_AVERAGE", landingPageExp: "BELOW_AVERAGE" }
  },

  // --- CAMPAÑAS MIXTAS (para probar casos edge) ---
  {
    campaign: { id: "120", name: "Search - Marca Frase", status: "ENABLED" },
    campaignBudget: { amountMicros: "500000000" },
    metrics: { clicks: "880", impressions: "5500", costMicros: "175000000", conversions: "30" },
    targetCpaMicros: "10000000",
    qualityScore: { score: 8, ctrExpected: "ABOVE_AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "121", name: "Shopping - Productos Premium", status: "ENABLED" },
    campaignBudget: { amountMicros: "700000000" },
    metrics: { clicks: "420", impressions: "9000", costMicros: "210000000", conversions: "14" },
    targetCpaMicros: "18000000",
    qualityScore: { score: 7, ctrExpected: "AVERAGE", adRelevance: "ABOVE_AVERAGE", landingPageExp: "ABOVE_AVERAGE" }
  },
  {
    campaign: { id: "122", name: "PMax - Captación Nuevos Usuarios", status: "ENABLED" },
    campaignBudget: { amountMicros: "800000000" },
    metrics: { clicks: "1350", impressions: "25000", costMicros: "390000000", conversions: "19" },
    targetCpaMicros: "22000000",
    qualityScore: { score: 6, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" }
  },
  {
    campaign: { id: "123", name: "Display - Retargeting 7d Alta Intención", status: "ENABLED" },
    campaignBudget: { amountMicros: "300000000" },
    metrics: { clicks: "510", impressions: "14000", costMicros: "145000000", conversions: "11" },
    targetCpaMicros: "15000000",
    qualityScore: { score: 8, ctrExpected: "ABOVE_AVERAGE", adRelevance: "AVERAGE", landingPageExp: "ABOVE_AVERAGE" }
  },
  {
    campaign: { id: "124", name: "Search - Long Tail Informacional", status: "ENABLED" },
    campaignBudget: { amountMicros: "250000000" },
    metrics: { clicks: "680", impressions: "11000", costMicros: "195000000", conversions: "6" },
    targetCpaMicros: "20000000",
    qualityScore: { score: 5, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "BELOW_AVERAGE" }
  },
  {
    campaign: { id: "125", name: "Video - Demo Producto Retargeting", status: "ENABLED" },
    campaignBudget: { amountMicros: "350000000" },
    metrics: { clicks: "290", impressions: "42000", costMicros: "160000000", conversions: "8" },
    targetCpaMicros: "22000000",
    qualityScore: { score: 6, ctrExpected: "AVERAGE", adRelevance: "AVERAGE", landingPageExp: "AVERAGE" }
  }
];

const mockSearchTerms: GoogleAdsSearchTermRaw[] = [
  // Términos BASURA de campañas con problemas (sin conversiones, con gasto)
  { text: "curso de ingles gratis", campaignId: "104", clicks: "95", costMicros: "148000000", conversions: "0" },
  { text: "descargar pdf ingles bbc", campaignId: "104", clicks: "72", costMicros: "115000000", conversions: "0" },
  { text: "academia ingles barata", campaignId: "104", clicks: "88", costMicros: "134000000", conversions: "0" },
  { text: "ingles gratis online", campaignId: "105", clicks: "120", costMicros: "180000000", conversions: "0" },
  { text: "aprender ingles sin pagar", campaignId: "105", clicks: "95", costMicros: "142000000", conversions: "0" },
  { text: "pdf ejercicios ingles gratis", campaignId: "105", clicks: "68", costMicros: "98000000", conversions: "0" },
  { text: "trabajo desde casa sin experiencia", campaignId: "106", clicks: "145", costMicros: "195000000", conversions: "0" },
  { text: "ganar dinero rapido internet", campaignId: "106", clicks: "188", costMicros: "248000000", conversions: "0" },
  { text: "descargar curso gratis", campaignId: "106", clicks: "110", costMicros: "162000000", conversions: "0" },
  { text: "que es el marketing digital wikipedia", campaignId: "105", clicks: "78", costMicros: "112000000", conversions: "0" },
  { text: "ejemplos de publicidad gratis", campaignId: "104", clicks: "65", costMicros: "95000000", conversions: "0" },
  { text: "herramientas gratis para emprendedores", campaignId: "105", clicks: "82", costMicros: "118000000", conversions: "0" },
  { text: "como hacer una pagina web gratis", campaignId: "106", clicks: "92", costMicros: "135000000", conversions: "0" },
  { text: "plantillas gratis powerpoint", campaignId: "104", clicks: "58", costMicros: "84000000", conversions: "0" },
  { text: "software barato para empresas", campaignId: "105", clicks: "74", costMicros: "108000000", conversions: "0" },
  { text: "tutoriales youtube gratis marketing", campaignId: "106", clicks: "55", costMicros: "79000000", conversions: "0" },
  { text: "libros gratis emprendimiento pdf", campaignId: "104", clicks: "48", costMicros: "69000000", conversions: "0" },
  { text: "competidor marca descuento", campaignId: "104", clicks: "115", costMicros: "168000000", conversions: "0" },
  { text: "alternativa barata a producto", campaignId: "105", clicks: "98", costMicros: "144000000", conversions: "0" },
  { text: "opiniones negativas empresa", campaignId: "104", clicks: "42", costMicros: "61000000", conversions: "0" },

  // Términos PARCIALMENTE rentables (conversiones pero CPA alto)
  { text: "curso ingles online certificado internacional", campaignId: "109", clicks: "85", costMicros: "195000000", conversions: "3" },
  { text: "agencia marketing digital precios", campaignId: "109", clicks: "72", costMicros: "165000000", conversions: "2" },
  { text: "software gestion empresas pequeñas", campaignId: "110", clicks: "68", costMicros: "155000000", conversions: "2" },
  { text: "consultor marketing freelance", campaignId: "109", clicks: "55", costMicros: "126000000", conversions: "1" },
  { text: "herramienta analisis competencia", campaignId: "110", clicks: "48", costMicros: "110000000", conversions: "1" },

  // Términos ESTRELLA (conversiones altas, CPA bajo)
  { text: "curso ingles online certificado", campaignId: "101", clicks: "420", costMicros: "98000000", conversions: "25" },
  { text: "academia ingles online", campaignId: "101", clicks: "380", costMicros: "88000000", conversions: "22" },
  { text: "aprender ingles rapido online", campaignId: "101", clicks: "290", costMicros: "67000000", conversions: "18" },
  { text: "clases ingles online adultos", campaignId: "102", clicks: "310", costMicros: "72000000", conversions: "19" },
  { text: "ingles business online", campaignId: "102", clicks: "245", costMicros: "57000000", conversions: "15" },
  { text: "curso ingles intensivo online", campaignId: "103", clicks: "198", costMicros: "46000000", conversions: "13" },
  { text: "academia ingles certificacion", campaignId: "103", clicks: "175", costMicros: "41000000", conversions: "11" },
  { text: "ingles para profesionales", campaignId: "120", clicks: "220", costMicros: "51000000", conversions: "14" },
  { text: "clases ingles ejecutivos", campaignId: "120", clicks: "185", costMicros: "43000000", conversions: "12" },
  { text: "ingles corporativo empresas", campaignId: "121", clicks: "160", costMicros: "58000000", conversions: "10" },

  // Términos NEUTROS (rendimiento promedio)
  { text: "clases ingles online precios", campaignId: "108", clicks: "340", costMicros: "78000000", conversions: "12" },
  { text: "academia ingles online opiniones", campaignId: "108", clicks: "285", costMicros: "65000000", conversions: "9" },
  { text: "mejor plataforma ingles online", campaignId: "108", clicks: "220", costMicros: "51000000", conversions: "7" },
  { text: "ingles online principiantes", campaignId: "109", clicks: "195", costMicros: "45000000", conversions: "6" },
  { text: "aprender ingles desde cero", campaignId: "109", clicks: "168", costMicros: "39000000", conversions: "5" },
  { text: "curso ingles b2", campaignId: "110", clicks: "142", costMicros: "33000000", conversions: "4" },
  { text: "preparacion examen ingles", campaignId: "110", clicks: "128", costMicros: "30000000", conversions: "4" },
  { text: "ingles conversacional online", campaignId: "111", clicks: "198", costMicros: "46000000", conversions: "6" },
  { text: "clases ingles con nativos", campaignId: "111", clicks: "175", costMicros: "41000000", conversions: "5" },
  { text: "ingles online flexible horarios", campaignId: "122", clicks: "155", costMicros: "36000000", conversions: "5" },
  { text: "aprender ingles viajes", campaignId: "122", clicks: "138", costMicros: "32000000", conversions: "4" },
  { text: "ingles para entrevistas trabajo", campaignId: "123", clicks: "185", costMicros: "43000000", conversions: "7" },
  { text: "ingles profesional certificado", campaignId: "123", clicks: "162", costMicros: "38000000", conversions: "6" },

  // Términos de campañas POTENCIAL (muy pocos datos)
  { text: "curso ingles avanzado c1", campaignId: "112", clicks: "45", costMicros: "18000000", conversions: "1" },
  { text: "ingles negocios internacionales", campaignId: "113", clicks: "38", costMicros: "15000000", conversions: "1" },
  { text: "preparacion ielts online", campaignId: "114", clicks: "52", costMicros: "21000000", conversions: "1" },
  { text: "ingles tecnico it", campaignId: "115", clicks: "28", costMicros: "11000000", conversions: "0" },

  // Términos adicionales para volumen
  { text: "academia idiomas online", campaignId: "108", clicks: "195", costMicros: "45000000", conversions: "6" },
  { text: "clases idiomas adultos", campaignId: "109", clicks: "148", costMicros: "34000000", conversions: "4" },
  { text: "aprender idioma extranjero rapido", campaignId: "110", clicks: "122", costMicros: "28000000", conversions: "3" },
  { text: "plataforma idiomas online", campaignId: "111", clicks: "168", costMicros: "39000000", conversions: "5" },
  { text: "ingles online precio mensual", campaignId: "108", clicks: "205", costMicros: "48000000", conversions: "7" },
  { text: "academia virtual ingles", campaignId: "109", clicks: "132", costMicros: "31000000", conversions: "4" },
  { text: "ingles online con profesor", campaignId: "101", clicks: "265", costMicros: "62000000", conversions: "16" },
  { text: "clases ingles personalizadas", campaignId: "102", clicks: "218", costMicros: "51000000", conversions: "13" },
  { text: "ingles intensivo 3 meses", campaignId: "103", clicks: "145", costMicros: "34000000", conversions: "9" },
  { text: "hablar ingles fluido rapido", campaignId: "120", clicks: "192", costMicros: "45000000", conversions: "12" },
  { text: "ingles para trabajo remoto", campaignId: "121", clicks: "175", costMicros: "65000000", conversions: "9" },
  { text: "certificado ingles reconocido", campaignId: "122", clicks: "142", costMicros: "33000000", conversions: "4" },
  { text: "ingles online garantia", campaignId: "123", clicks: "128", costMicros: "30000000", conversions: "5" },
  { text: "academia ingles resultados rapidos", campaignId: "101", clicks: "235", costMicros: "55000000", conversions: "14" },
  { text: "ingles desde cero adultos mayores", campaignId: "124", clicks: "98", costMicros: "38000000", conversions: "2" },
  { text: "ingles online sin nivel previo", campaignId: "124", clicks: "85", costMicros: "33000000", conversions: "2" },
  { text: "video ingles conversacion diaria", campaignId: "125", clicks: "112", costMicros: "52000000", conversions: "3" },
  { text: "clases video ingles nativos", campaignId: "125", clicks: "95", costMicros: "44000000", conversions: "3" },

  // Más términos basura para estresar el Generador de Negativos
  { text: "ingles gratis para siempre", campaignId: "105", clicks: "145", costMicros: "208000000", conversions: "0" },
  { text: "bajar aplicacion ingles sin pagar", campaignId: "106", clicks: "118", costMicros: "172000000", conversions: "0" },
  { text: "descargar ingles gratis apk", campaignId: "104", clicks: "88", costMicros: "128000000", conversions: "0" },
  { text: "ingles gratis nivel basico", campaignId: "105", clicks: "102", costMicros: "148000000", conversions: "0" },
  { text: "pagina ingles gratis sin registro", campaignId: "106", clicks: "76", costMicros: "110000000", conversions: "0" },
  { text: "competidor oferta black friday", campaignId: "104", clicks: "135", costMicros: "196000000", conversions: "0" },
  { text: "alternativa gratuita servicio", campaignId: "105", clicks: "92", costMicros: "134000000", conversions: "0" },
  { text: "como cancelar suscripcion ingles", campaignId: "104", clicks: "48", costMicros: "70000000", conversions: "0" },
  { text: "reembolso curso ingles", campaignId: "104", clicks: "35", costMicros: "51000000", conversions: "0" },
  { text: "ingles barato menos 10 euros", campaignId: "105", clicks: "68", costMicros: "99000000", conversions: "0" }
];

// ============================================================================
// FUNCIÓN EXTRACTORA PRINCIPAL
// Transforma los datos crudos de la API al formato que espera motorMora.ts
// ============================================================================
export const extraerDatosGoogle = async (): Promise<CampanaMora[]> => {
  // Simulamos latencia real de la API (600-900ms)
  await new Promise(resolve => setTimeout(resolve, 700));

  return mockCampaigns.map((item): CampanaMora => {
    const presupuestoMensual = parseInt(item.campaignBudget.amountMicros) / 1_000_000;
    const gastoMensual = parseInt(item.metrics.costMicros) / 1_000_000;
    const conversiones = parseFloat(item.metrics.conversions);
    const clics = parseInt(item.metrics.clicks);

    // CPA real: si no hay conversiones, usamos el gasto como indicador de desperdicio
    // No usamos gastoMensual directamente — dejamos que motorMora.ts lo maneje
    const cpaActual = conversiones > 0
      ? parseFloat((gastoMensual / conversiones).toFixed(2))
      : 9999; // Valor centinela: sin conversiones = CPA infinito

    // CPA objetivo: viene de Google Ads si existe, sino usamos el de la cuenta ($20 por defecto)
    // Cuando conectemos la API real, este valor vendrá de targetCpaMicros
    const cpaObjetivo = item.targetCpaMicros
      ? parseInt(item.targetCpaMicros) / 1_000_000
      : 20;

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
      quality_landing: item.qualityScore?.landingPageExp
    };
  });
};

// ============================================================================
// FUNCIÓN EXTRACTORA DE TÉRMINOS DE BÚSQUEDA
// ============================================================================
export const extraerTerminosGoogle = async (): Promise<TerminoBusqueda[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));

  return mockSearchTerms.map((item): TerminoBusqueda => ({
    termino_exacto: item.text,
    id_campana_asociada: item.campaignId,
    gasto: parseInt(item.costMicros) / 1_000_000,
    clics: parseInt(item.clicks),
    conversiones: parseFloat(item.conversions)
  }));
};

// ============================================================================
// FUNCIÓN QUE ARMA EL OBJETO COMPLETO PARA motorMora.ts
// Esta es la función principal que llama el backend
// ============================================================================
export const construirDatosAuditoria = async (): Promise<DatosAuditoriaInput> => {
  const [campanas, terminos] = await Promise.all([
    extraerDatosGoogle(),
    extraerTerminosGoogle()
  ]);

  const soloActivas = campanas.filter(c =>
    c.estado === "ENABLED" && c.gasto_mensual > 0
  );

  const gastoTotal = soloActivas.reduce((acc, c) => acc + c.gasto_mensual, 0);
  const conversionesTotales = soloActivas.reduce((acc, c) => acc + c.conversiones, 0);
  const clicsTotales = soloActivas.reduce((acc, c) => acc + c.clics, 0);
  const cpaPromedioCuenta = conversionesTotales > 0
    ? parseFloat((gastoTotal / conversionesTotales).toFixed(2))
    : 20; // Fallback si no hay conversiones

  return {
    tipo_negocio: "ecommerce", // En producción vendrá del perfil del usuario
    cpa_promedio_cuenta: cpaPromedioCuenta,
    gasto_total_cuenta: parseFloat(gastoTotal.toFixed(2)),
    conversiones_totales: conversionesTotales,
    clics_totales: clicsTotales,
    campanas,
    terminos
  };
};