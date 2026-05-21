// lib/googleAds.ts

// 1. EL FRANKENSTEIN DE DATOS (Simulando la API de Google Ads)
const mockGoogleAdsResponse = {
  campaigns: [
    {
      // CAMPAÑA ESTRELLA: CPA bajísimo ($5), muchas conversiones. Mora debería sugerir escalarla.
      "campaign": { "id": "101", "name": "Search - Marca Exacta", "status": "ENABLED" },
      "campaignBudget": { "amountMicros": "500000000" }, // Presupuesto: $500
      "metrics": { "clicks": "800", "impressions": "5000", "costMicros": "200000000", "conversions": "40" }, // Gastó $200
      // Notas de Calidad Simuladas (Top)
      "qualityScore": { "score": 9, "ctrExpected": "ABOVE_AVERAGE", "adRelevance": "ABOVE_AVERAGE", "landingPageExp": "AVERAGE" }
    },
    {
      // CAMPAÑA BASURA: CPA altísimo ($80), gastando fortunas. Mora debería sugerir apagarla o robarle presupuesto.
      "campaign": { "id": "102", "name": "Search - Competidores Amplia", "status": "ENABLED" },
      "campaignBudget": { "amountMicros": "1000000000" }, // Presupuesto: $1000
      "metrics": { "clicks": "1200", "impressions": "15000", "costMicros": "800000000", "conversions": "10" }, // Gastó $800
      // Notas de Calidad Simuladas (Críticas por Landing Page deficiente)
      "qualityScore": { "score": 3, "ctrExpected": "AVERAGE", "adRelevance": "AVERAGE", "landingPageExp": "BELOW_AVERAGE" }
    },
    {
      // CAMPAÑA DUDOSA: CPA promedio ($16.6). Ni muy buena ni muy mala. Mora sugerirá observarla.
      "campaign": { "id": "103", "name": "PMax - General Ecommerce", "status": "ENABLED" },
      "campaignBudget": { "amountMicros": "1500000000" }, // Presupuesto: $1500
      "metrics": { "clicks": "2000", "impressions": "40000", "costMicros": "500000000", "conversions": "30" }, // Gastó $500
      "qualityScore": { "score": 6, "ctrExpected": "AVERAGE", "adRelevance": "AVERAGE", "landingPageExp": "AVERAGE" }
    },
    {
      // CAMPAÑA POTENCIAL: Muy pocas conversiones (1) para evaluarla. Mora pedirá más tiempo.
      "campaign": { "id": "104", "name": "Display - Retargeting 30d", "status": "ENABLED" },
      "campaignBudget": { "amountMicros": "100000000" }, // Presupuesto: $100
      "metrics": { "clicks": "150", "impressions": "8000", "costMicros": "50000000", "conversions": "1" }, // Gastó $50
      "qualityScore": { "score": 7, "ctrExpected": "ABOVE_AVERAGE", "adRelevance": "AVERAGE", "landingPageExp": "AVERAGE" }
    },
    {
      // CAMPAÑA PAUSADA CON GASTO: Dejamos el gasto en video para que Mora lo evalúe
      "campaign": { "id": "105", "name": "Video - YouTube Awareness", "status": "PAUSED" },
      "campaignBudget": { "amountMicros": "300000000" }, // Presupuesto: $300
      "metrics": { "clicks": "50", "impressions": "12000", "costMicros": "150000000", "conversions": "0" }, // Gastó $150
      "qualityScore": { "score": 5, "ctrExpected": "AVERAGE", "adRelevance": "BELOW_AVERAGE", "landingPageExp": "AVERAGE" }
    }
  ],
  // Términos de búsqueda falsos
  searchTerms: [
    { "text": "curso de ingles gratis", "campaignId": "102", "clicks": "95", "costMicros": "150000000", "conversions": "0" },
    { "text": "descargar pdf ingles bbc", "campaignId": "102", "clicks": "75", "costMicros": "120000000", "conversions": "0" },
    { "text": "academia ingles barata", "campaignId": "102", "clicks": "80", "costMicros": "130000000", "conversions": "0" },
    { "text": "curso ingles online certificado", "campaignId": "101", "clicks": "400", "costMicros": "100000000", "conversions": "25" }
  ]
};

// 2. FUNCIÓN EXTRACTORA DE CAMPAÑAS
export const extraerDatosGoogle = async () => {
  // Simulamos la latencia de la API (800ms)
  await new Promise(resolve => setTimeout(resolve, 800));

  const datosCrudos = mockGoogleAdsResponse.campaigns;

  // Limpieza y cálculo de métricas secundarias
  const campañasLimpias = datosCrudos.map((item: any) => {
    const presupuestoReal = parseInt(item.campaignBudget.amountMicros) / 1000000;
    const gastoReal = parseInt(item.metrics.costMicros) / 1000000;
    const clics = parseInt(item.metrics.clicks);
    const conversiones = parseFloat(item.metrics.conversions);
    const impresiones = parseInt(item.metrics.impressions) || 1; 

    return {
      id: item.campaign.id,
      nombre: item.campaign.name,
      estado: item.campaign.status,
      presupuesto: presupuestoReal,      
      gasto: gastoReal,                  
      clics: clics,
      impresiones: impresiones,
      conversiones: conversiones,
      cpa: conversiones > 0 ? parseFloat((gastoReal / conversiones).toFixed(2)) : gastoReal, 
      ctr: parseFloat(((clics / impresiones) * 100).toFixed(2)),
      cpaObjetivo: 20,
      // LO NUEVO: Pasamos las notas de Quality Score limpias hacia el backend
      quality_score: item.qualityScore.score,
      quality_ctr: item.qualityScore.ctrExpected,
      quality_relevance: item.qualityScore.adRelevance,
      quality_landing: item.qualityScore.landingPageExp
    };
  });

  return campañasLimpias;
};

// 3. FUNCIÓN EXTRACTORA DE ALERTAS INMEDIATAS
export const extraerAlertas = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    { 
      id: 'rh-1', 
      titulo: 'Estrategia Robin Hood', 
      mensaje: 'La campaña "Competidores Amplia" gasta $800 con un CPA de $80. Sugerimos transferir $300 a "Marca Exacta".', 
      accion: 'Aplicar Estrategia' 
    },
    { 
      id: 'can-1', 
      titulo: 'Canibalización Activa', 
      mensaje: 'Dos de tus campañas están compitiendo por el término "abogados laborales", inflando el CPC un 35%.', 
      accion: 'Ver Hallazgo' 
    },
    { 
      id: 'dp-1', 
      titulo: 'Fuga Horaria (Dayparting)', 
      mensaje: 'Se detectó un drenaje constante de $120 entre las 02:00 y 04:00 AM sin conversiones asociadas.', 
      accion: 'Ajustar Horarios' 
    }
  ];
};

// 4. FUNCIÓN EXTRACTORA DE TÉRMINOS DE BÚSQUEDA
export const extraerTerminosGoogle = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockGoogleAdsResponse.searchTerms.map((item: any) => ({
    termino_exacto: item.text,
    id_campana_asociada: item.campaignId,
    gasto: parseInt(item.costMicros) / 1000000,
    clics: parseInt(item.clicks),
    conversiones: parseFloat(item.conversions)
  }));
};