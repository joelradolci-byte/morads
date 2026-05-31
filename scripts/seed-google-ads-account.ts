/**
 * Pobla la cuenta test con campañas Search (estructura) para Mora.
 *
 * Uso:
 *   npx tsx --env-file=.env.local scripts/seed-google-ads-account.ts --dry-run
 *   npx tsx --env-file=.env.local scripts/seed-google-ads-account.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import {
  enums,
  resources,
  toMicros,
  ResourceNames,
  type MutateOperation,
} from "google-ads-api";
import { createCustomerClient, getGoogleAdsApiClient } from "../lib/googleAds/client";
import {
  SEED_CAMPAIGNS,
  SEED_NAME_PREFIX,
  seedCampaignName,
  type SeedKeyword,
} from "../lib/googleAds/seedCatalog";

const FINAL_URL = "https://example.com";

function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Falta variable de entorno: ${name}`);
  return v;
}

function matchTypeEnum(match: SeedKeyword["match"]) {
  switch (match) {
    case "EXACT":
      return enums.KeywordMatchType.EXACT;
    case "PHRASE":
      return enums.KeywordMatchType.PHRASE;
    default:
      return enums.KeywordMatchType.BROAD;
  }
}

function parseIdFromResourceName(resourceName: string): string {
  const parts = resourceName.split("/");
  return parts[parts.length - 1]?.replace(/-/g, "") ?? "";
}

async function listExistingSeedCampaigns(
  customer: ReturnType<typeof createCustomerClient>
): Promise<Map<string, string>> {
  const rows = await customer.query<
    Array<{ campaign?: { id?: string | number; name?: string } }>
  >(
    `SELECT campaign.id, campaign.name FROM campaign WHERE campaign.name LIKE '${SEED_NAME_PREFIX}%' AND campaign.status != 'REMOVED'`
  );
  const map = new Map<string, string>();
  for (const row of rows) {
    const name = row.campaign?.name;
    const id = row.campaign?.id ? String(row.campaign.id).replace(/-/g, "") : "";
    if (name && id) map.set(name, id);
  }
  return map;
}

function rsaHeadlines() {
  return [
    { text: "Curso de inglés online" },
    { text: "Mora Academia" },
    { text: "Clases con profesores" },
    { text: "Certificación incluida" },
    { text: "Empezá hoy mismo" },
  ];
}

function rsaDescriptions() {
  return [
    { text: "Aprendé inglés con Mora Academia. Clases flexibles y certificado." },
    { text: "Mejorá tu inglés profesional. Probad una clase sin compromiso." },
  ];
}

async function createCampaignBundle(
  customer: ReturnType<typeof createCustomerClient>,
  customerId: string,
  def: (typeof SEED_CAMPAIGNS)[number],
  dryRun: boolean
): Promise<{ campaignId: string; name: string; mockCampaignId: string } | null> {
  const fullName = seedCampaignName(def.baseName);
  const budgetTemp = "-1";
  const campaignTemp = "-2";
  const adGroupTemp = "-3";

  const budgetRn = ResourceNames.campaignBudget(customerId, budgetTemp);
  const campaignRn = ResourceNames.campaign(customerId, campaignTemp);
  const adGroupRn = ResourceNames.adGroup(customerId, adGroupTemp);

  const operations: MutateOperation<
    resources.ICampaignBudget | resources.ICampaign | resources.IAdGroup | resources.ICampaignCriterion
  >[] =
    [
      {
        entity: "campaign_budget",
        operation: "create",
        resource: {
          resource_name: budgetRn,
          name: `${fullName} Budget`,
          amount_micros: def.budgetMicros,
          delivery_method: enums.BudgetDeliveryMethod.STANDARD,
          explicitly_shared: false,
        },
      },
      {
        entity: "campaign",
        operation: "create",
        resource: {
          resource_name: campaignRn,
          name: fullName,
          advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
          status: enums.CampaignStatus.PAUSED,
          campaign_budget: budgetRn,
          contains_eu_political_advertising:
            enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
          manual_cpc: { enhanced_cpc_enabled: false },
          network_settings: {
            target_google_search: true,
            target_search_network: false,
            target_content_network: false,
          },
        },
      },
      {
        entity: "campaign_criterion",
        operation: "create",
        resource: {
          campaign: campaignRn,
          location: {
            geo_target_constant: "geoTargetConstants/2840",
          },
        },
      },
      {
        entity: "ad_group",
        operation: "create",
        resource: {
          resource_name: adGroupRn,
          name: `${fullName} — Ad Group`,
          campaign: campaignRn,
          status: enums.AdGroupStatus.ENABLED,
          type: enums.AdGroupType.SEARCH_STANDARD,
          cpc_bid_micros: toMicros(1.5),
        },
      },
    ];

  if (dryRun) {
    console.log(`[dry-run] Crearía campaña: ${fullName} (${def.keywords.length} keywords)`);
    return {
      campaignId: "dry-run",
      name: fullName,
      mockCampaignId: def.mockCampaignId,
    };
  }

  let result;
  try {
    result = await customer.mutateResources(operations);
  } catch (err: unknown) {
    const e = err as { errors?: Array<{ message?: string; location?: unknown }> };
    console.error(`Error creando ${fullName}:`, e.errors ?? err);
    throw err;
  }
  const responses = result.mutate_operation_responses ?? [];

  const campaignResourceName =
    responses[1]?.campaign_result?.resource_name ?? "";
  const adGroupResourceName =
    responses[3]?.ad_group_result?.resource_name ?? "";

  const campaignId = parseIdFromResourceName(campaignResourceName);
  if (!campaignId || !adGroupResourceName) {
    console.error(`No se obtuvo campaña/ad group para ${fullName}`, responses);
    return null;
  }

  const keywordOps: MutateOperation<resources.IAdGroupCriterion>[] = def.keywords.map(
    (kw) => ({
      entity: "ad_group_criterion",
      operation: "create",
      resource: {
        ad_group: adGroupResourceName,
        status: enums.AdGroupCriterionStatus.ENABLED,
        keyword: {
          text: kw.text,
          match_type: matchTypeEnum(kw.match),
        },
      },
    })
  );

  const ad = new resources.Ad({
    responsive_search_ad: {
      headlines: rsaHeadlines(),
      descriptions: rsaDescriptions(),
    },
    final_urls: [FINAL_URL],
    type: enums.AdType.RESPONSIVE_SEARCH_AD,
  });

  const adOps: MutateOperation<resources.IAdGroupAd>[] = [
    {
      entity: "ad_group_ad",
      operation: "create",
      resource: {
        ad_group: adGroupResourceName,
        status: enums.AdGroupAdStatus.ENABLED,
        ad,
      },
    },
  ];

  await customer.mutateResources(keywordOps);
  await customer.mutateResources(adOps);

  console.log(`Creada: ${fullName} (id ${campaignId})`);
  return { campaignId, name: fullName, mockCampaignId: def.mockCampaignId };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  getGoogleAdsApiClient();
  const refreshToken = env("GOOGLE_ADS_REFRESH_TOKEN");
  const customerId = env("GOOGLE_ADS_CUSTOMER_ID").replace(/-/g, "");
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");

  const customer = createCustomerClient(
    refreshToken,
    customerId,
    loginCustomerId || null
  );

  console.log(`Cliente ${customerId}${loginCustomerId ? ` (MCC ${loginCustomerId})` : ""}`);
  console.log(dryRun ? "Modo dry-run" : "Modo ejecución");

  const existing = await listExistingSeedCampaigns(customer);
  const manifest: Array<{
    id: string;
    name: string;
    mockCampaignId: string;
  }> = [];

  for (const def of SEED_CAMPAIGNS) {
    const fullName = seedCampaignName(def.baseName);
    const existingId = existing.get(fullName);
    if (existingId) {
      console.log(`Ya existe: ${fullName} (${existingId})`);
      manifest.push({
        id: existingId,
        name: fullName,
        mockCampaignId: def.mockCampaignId,
      });
      continue;
    }

    const created = await createCampaignBundle(customer, customerId, def, dryRun);
    if (created) {
      manifest.push({
        id: created.campaignId,
        name: created.name,
        mockCampaignId: created.mockCampaignId,
      });
    }
  }

  const outDir = resolve(process.cwd(), "scripts/output");
  mkdirSync(outDir, { recursive: true });
  const manifestPath = resolve(outDir, "seed-manifest.json");
  const payload = {
    customerId,
    loginCustomerId: loginCustomerId || null,
    createdAt: new Date().toISOString(),
    dryRun,
    campaigns: manifest,
  };
  writeFileSync(manifestPath, JSON.stringify(payload, null, 2));
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Campañas en manifest: ${manifest.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
