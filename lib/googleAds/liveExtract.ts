import type {
  CampanaMora,
  DatosAuditoriaInput,
  DatoHorarioCampana,
  TerminoBusqueda,
} from "../motorMora";

function resolverCpaCampana(
  gasto: number,
  clics: number,
  conversiones: number
): number | null {
  if (gasto <= 0 && clics <= 0 && conversiones <= 0) return null;
  if (conversiones > 0) return parseFloat((gasto / conversiones).toFixed(2));
  if (gasto > 0) return 9999;
  return null;
}
import { createCustomerClient } from "./client";
import {
  applyFixtureToCampaigns,
  buildFixtureHorarios,
  buildFixtureTerminos,
  buildManifestFromCampaigns,
  type CampaignManifestEntry,
} from "./seedFixtureData";

export type LiveExtractOptions = {
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string | null;
  marca_cliente?: string | string[];
  tipo_negocio?: DatosAuditoriaInput["tipo_negocio"];
  manifest?: CampaignManifestEntry[];
  /** Solo scripts de verificación (verify-audit-seed); la app usa false. */
  useFixtureMetrics?: boolean;
};

function microsToUnits(micros: unknown): number {
  const n = typeof micros === "number" ? micros : Number(micros ?? 0);
  return n / 1_000_000;
}

function mapGoogleDayOfWeek(value: unknown): number {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  if (n >= 2 && n <= 8) return n - 2;
  return Math.max(0, Math.min(6, n));
}

function normalizeCampaignStatus(status: unknown): string {
  const s = String(status ?? "ENABLED").toUpperCase();
  if (s === "2" || s.includes("ENABLED")) return "ENABLED";
  if (s === "3" || s.includes("PAUSED")) return "PAUSED";
  return s;
}

export async function fetchCampaignsFromGoogle(
  refreshToken: string,
  customerId: string,
  loginCustomerId?: string | null
): Promise<CampanaMora[]> {
  const customer = createCustomerClient(refreshToken, customerId, loginCustomerId);

  const rows = await customer.query<
    Array<{
      campaign?: {
        id?: string | number;
        name?: string;
        status?: string | number;
      };
      campaign_budget?: { amount_micros?: string | number };
      metrics?: {
        clicks?: string | number;
        cost_micros?: string | number;
        conversions?: string | number;
        search_budget_lost_impression_share?: number;
      };
    }>
  >(
    `SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.amount_micros,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.search_budget_lost_impression_share
    FROM campaign
    WHERE campaign.status != 'REMOVED'
      AND segments.date DURING LAST_30_DAYS`
  );

  const byId = new Map<string, CampanaMora>();

  for (const row of rows) {
    const id = row.campaign?.id ? String(row.campaign.id).replace(/-/g, "") : "";
    if (!id) continue;

    const gasto = microsToUnits(row.metrics?.cost_micros);
    const clics = Number(row.metrics?.clicks ?? 0);
    const conversiones = Number(row.metrics?.conversions ?? 0);
    const presupuesto = microsToUnits(row.campaign_budget?.amount_micros);

    const existing = byId.get(id);
    if (existing) {
      existing.gasto_mensual += gasto;
      existing.clics += clics;
      existing.conversiones += conversiones;
      existing.cpa_actual = resolverCpaCampana(
        existing.gasto_mensual,
        existing.clics,
        existing.conversiones
      );
      continue;
    }

    byId.set(id, {
      id,
      nombre: row.campaign?.name?.trim() || `Campaña ${id}`,
      estado: normalizeCampaignStatus(row.campaign?.status),
      presupuesto_mensual: presupuesto,
      gasto_mensual: gasto,
      clics,
      conversiones,
      cpa_actual: resolverCpaCampana(gasto, clics, conversiones),
      search_lost_is_budget:
        row.metrics?.search_budget_lost_impression_share !== undefined
          ? Number(row.metrics.search_budget_lost_impression_share)
          : undefined,
    });
  }

  return [...byId.values()];
}

export async function fetchSearchTermsFromGoogle(
  refreshToken: string,
  customerId: string,
  loginCustomerId?: string | null
): Promise<TerminoBusqueda[]> {
  const customer = createCustomerClient(refreshToken, customerId, loginCustomerId);

  try {
    const rows = await customer.query<
      Array<{
        search_term_view?: { search_term?: string };
        campaign?: { id?: string | number };
        metrics?: {
          clicks?: string | number;
          cost_micros?: string | number;
          conversions?: string | number;
        };
      }>
    >(
      `SELECT
        search_term_view.search_term,
        campaign.id,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM search_term_view
      WHERE segments.date DURING LAST_30_DAYS
        AND metrics.clicks > 0`
    );

    return rows
      .map((row) => {
        const term = row.search_term_view?.search_term?.trim();
        const campId = row.campaign?.id
          ? String(row.campaign.id).replace(/-/g, "")
          : "";
        if (!term || !campId) return null;
        return {
          termino_exacto: term,
          id_campana_asociada: campId,
          gasto: microsToUnits(row.metrics?.cost_micros),
          clics: Number(row.metrics?.clicks ?? 0),
          conversiones: Number(row.metrics?.conversions ?? 0),
        };
      })
      .filter((t): t is TerminoBusqueda => t !== null);
  } catch (err) {
    console.warn("[liveExtract] search_term_view no disponible:", err);
    return [];
  }
}

export async function fetchHorariosFromGoogle(
  refreshToken: string,
  customerId: string,
  loginCustomerId?: string | null
): Promise<DatoHorarioCampana[]> {
  const customer = createCustomerClient(refreshToken, customerId, loginCustomerId);

  try {
    const rows = await customer.query<
      Array<{
        campaign?: { id?: string | number; name?: string };
        segments?: { day_of_week?: string | number; hour?: number };
        metrics?: {
          clicks?: string | number;
          cost_micros?: string | number;
          conversions?: string | number;
        };
      }>
    >(
      `SELECT
        campaign.id,
        campaign.name,
        segments.day_of_week,
        segments.hour,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status = 'ENABLED'`
    );

    const agg = new Map<string, DatoHorarioCampana>();

    for (const row of rows) {
      const campId = row.campaign?.id
        ? String(row.campaign.id).replace(/-/g, "")
        : "";
      const dow = mapGoogleDayOfWeek(row.segments?.day_of_week);
      const hora = Number(row.segments?.hour ?? 0);
      if (!campId) continue;

      const key = `${campId}-${dow}-${hora}`;
      const prev = agg.get(key);
      const gasto = microsToUnits(row.metrics?.cost_micros);
      const clics = Number(row.metrics?.clicks ?? 0);
      const conv = Number(row.metrics?.conversions ?? 0);

      if (prev) {
        prev.gasto += gasto;
        prev.clics += clics;
        prev.conversiones += conv;
      } else {
        agg.set(key, {
          campana_id: campId,
          campana_nombre: row.campaign?.name?.trim() || `Campaña ${campId}`,
          dia_semana: dow,
          hora,
          gasto,
          clics,
          conversiones: conv,
        });
      }
    }

    return [...agg.values()];
  } catch (err) {
    console.warn("[liveExtract] horarios no disponibles:", err);
    return [];
  }
}

function aggregateAccountTotals(campanas: CampanaMora[]) {
  const activas = campanas.filter((c) => c.gasto_mensual > 0 && c.clics > 0);
  const gastoTotal = activas.reduce((a, c) => a + c.gasto_mensual, 0);
  const conversionesTotales = activas.reduce((a, c) => a + c.conversiones, 0);
  const clicsTotales = activas.reduce((a, c) => a + c.clics, 0);
  const cpaPromedio =
    conversionesTotales > 0
      ? parseFloat((gastoTotal / conversionesTotales).toFixed(2))
      : 20;

  return { gastoTotal, conversionesTotales, clicsTotales, cpaPromedio };
}

export async function buildDatosAuditoriaFromGoogleAds(
  options: LiveExtractOptions
): Promise<DatosAuditoriaInput> {
  const { refreshToken, customerId, loginCustomerId } = options;
  const useFixture = options.useFixtureMetrics === true;

  let campanas = await fetchCampaignsFromGoogle(
    refreshToken,
    customerId,
    loginCustomerId
  );

  let manifest =
    options.manifest ?? buildManifestFromCampaigns(campanas);

  if (useFixture && campanas.length === 0 && manifest.length > 0) {
    campanas = manifest.map((m) => ({
      id: m.id,
      nombre: m.name,
      estado: "ENABLED",
      presupuesto_mensual: 0,
      gasto_mensual: 0,
      clics: 0,
      conversiones: 0,
      cpa_actual: null,
    }));
  }

  if (useFixture) {
    campanas = applyFixtureToCampaigns(campanas, manifest);
  }

  let terminos = await fetchSearchTermsFromGoogle(
    refreshToken,
    customerId,
    loginCustomerId
  );
  let horarios = await fetchHorariosFromGoogle(
    refreshToken,
    customerId,
    loginCustomerId
  );

  if (useFixture) {
    if (manifest.length === 0) {
      manifest = buildManifestFromCampaigns(campanas);
    }
    if (terminos.length === 0) {
      terminos = buildFixtureTerminos(manifest);
    }
    if (horarios.length === 0) {
      horarios = buildFixtureHorarios(manifest);
    }
  }

  const { gastoTotal, conversionesTotales, clicsTotales, cpaPromedio } =
    aggregateAccountTotals(campanas);

  return {
    tipo_negocio: options.tipo_negocio ?? "ecommerce",
    cpa_promedio_cuenta: cpaPromedio,
    gasto_total_cuenta: parseFloat(gastoTotal.toFixed(2)),
    conversiones_totales: conversionesTotales,
    clics_totales: clicsTotales,
    campanas,
    terminos,
    horarios,
    marca_cliente: options.marca_cliente,
    currency_code: "USD",
  };
}
