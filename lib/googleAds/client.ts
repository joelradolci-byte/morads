import { GoogleAdsApi } from "google-ads-api";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type GoogleAdsAccessibleAccount = {
  id: string;
  name: string;
  manager: boolean;
};

export type GoogleAdsChildAccount = {
  id: string;
  name: string;
  manager: boolean;
  level: number;
  status?: string;
};

function normalizeCustomerId(id: string): string {
  return id.replace(/-/g, "");
}

export class GoogleAdsConfigError extends Error {
  constructor(message = "Google Ads API no configurada en el servidor.") {
    super(message);
    this.name = "GoogleAdsConfigError";
  }
}

export class GoogleAdsNotConnectedError extends Error {
  constructor(message = "Google Ads no conectado.") {
    super(message);
    this.name = "GoogleAdsNotConnectedError";
  }
}

let apiClient: GoogleAdsApi | null = null;

function getEnvConfig() {
  const client_id = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const client_secret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  const developer_token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  if (!client_id || !client_secret || !developer_token) {
    throw new GoogleAdsConfigError();
  }
  return { client_id, client_secret, developer_token };
}

export function getGoogleAdsApiClient(): GoogleAdsApi {
  if (!apiClient) {
    const cfg = getEnvConfig();
    apiClient = new GoogleAdsApi(cfg);
  }
  return apiClient;
}

export function parseCustomerResourceName(resourceName: string): string | null {
  const match = /^customers\/(\d+)$/.exec(resourceName.trim());
  return match ? match[1] : null;
}

export async function getUserGoogleAdsToken(userId: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("google_ads_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[googleAds/client] getUserGoogleAdsToken", error);
    throw error;
  }

  const token =
    typeof data?.refresh_token === "string" ? data.refresh_token.trim() : "";
  return token.length > 0 ? token : null;
}

export async function getUserGoogleAdsLink(userId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("google_ads_tokens")
    .select("refresh_token, customer_id, login_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[googleAds/client] getUserGoogleAdsLink", error);
    throw error;
  }

  const refresh_token =
    typeof data?.refresh_token === "string" ? data.refresh_token.trim() : "";
  const customer_id =
    typeof data?.customer_id === "string" ? data.customer_id.trim() : "";
  const login_customer_id =
    typeof data?.login_customer_id === "string"
      ? data.login_customer_id.trim()
      : "";

  return {
    connected: refresh_token.length > 0,
    accountLinked: customer_id.length > 0,
    customer_id: customer_id || null,
    login_customer_id: login_customer_id || null,
    refresh_token: refresh_token || null,
  };
}

export function createCustomerClient(
  refreshToken: string,
  customerId: string,
  loginCustomerId?: string | null
) {
  const client = getGoogleAdsApiClient();
  return client.Customer({
    customer_id: customerId.replace(/-/g, ""),
    refresh_token: refreshToken,
    ...(loginCustomerId
      ? { login_customer_id: loginCustomerId.replace(/-/g, "") }
      : {}),
  });
}

async function fetchAccountMeta(
  refreshToken: string,
  customerId: string
): Promise<GoogleAdsAccessibleAccount | null> {
  try {
    const customer = createCustomerClient(refreshToken, customerId);
    const rows = await customer.query<
      Array<{
        customer?: {
          id?: string | number;
          descriptive_name?: string;
          manager?: boolean;
        };
      }>
    >(
      `SELECT customer.id, customer.descriptive_name, customer.manager FROM customer`
    );
    const row = rows[0]?.customer;
    if (!row?.id) return null;
    return {
      id: String(row.id).replace(/-/g, ""),
      name: row.descriptive_name?.trim() || `Cuenta ${customerId}`,
      manager: Boolean(row.manager),
    };
  } catch (err) {
    console.error("[googleAds/client] fetchAccountMeta", customerId, err);
    return {
      id: customerId.replace(/-/g, ""),
      name: `Cuenta ${customerId}`,
      manager: false,
    };
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

export async function listAccessibleAccountsForUser(
  userId: string
): Promise<GoogleAdsAccessibleAccount[]> {
  getEnvConfig();
  const refreshToken = await getUserGoogleAdsToken(userId);
  if (!refreshToken) {
    throw new GoogleAdsNotConnectedError();
  }

  const client = getGoogleAdsApiClient();
  const response = await client.listAccessibleCustomers(refreshToken);
  const resourceNames = response.resource_names ?? [];
  const customerIds = resourceNames
    .map(parseCustomerResourceName)
    .filter((id): id is string => Boolean(id));

  if (customerIds.length === 0) return [];

  const accounts = await mapPool(customerIds, 5, (id) =>
    fetchAccountMeta(refreshToken, id)
  );

  return accounts.filter((a): a is GoogleAdsAccessibleAccount => a !== null);
}

export async function listChildAccountsUnderManager(
  userId: string,
  managerCustomerId: string
): Promise<GoogleAdsChildAccount[]> {
  getEnvConfig();
  const refreshToken = await getUserGoogleAdsToken(userId);
  if (!refreshToken) {
    throw new GoogleAdsNotConnectedError();
  }

  const managerId = normalizeCustomerId(managerCustomerId);
  const customer = createCustomerClient(refreshToken, managerId, managerId);

  const rows = await customer.query<
    Array<{
      customer_client?: {
        id?: string | number;
        client_customer?: string;
        descriptive_name?: string;
        manager?: boolean;
        level?: number;
        status?: string | number;
      };
    }>
  >(
    `SELECT
      customer_client.id,
      customer_client.client_customer,
      customer_client.descriptive_name,
      customer_client.manager,
      customer_client.level,
      customer_client.status
    FROM customer_client
    WHERE customer_client.level = 1`
  );

  const clients: GoogleAdsChildAccount[] = [];

  for (const row of rows) {
    const cc = row.customer_client;
    if (!cc) continue;

    const id = cc.id
      ? normalizeCustomerId(String(cc.id))
      : cc.client_customer
        ? parseCustomerResourceName(cc.client_customer)
        : null;

    if (!id || id === managerId) continue;

    clients.push({
      id,
      name: cc.descriptive_name?.trim() || `Cuenta ${id}`,
      manager: Boolean(cc.manager),
      level: typeof cc.level === "number" ? cc.level : 1,
      status: cc.status !== undefined ? String(cc.status) : undefined,
    });
  }

  clients.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return clients;
}
