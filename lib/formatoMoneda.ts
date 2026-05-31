/** Formato de montos según moneda de cuenta (Google Ads) y locale de UI. */

export type CurrencyCode = string;

const FALLBACK_CURRENCY = "USD";

export function normalizeCurrencyCode(code: string | undefined | null): CurrencyCode {
  if (!code || typeof code !== "string") return FALLBACK_CURRENCY;
  const trimmed = code.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(trimmed) ? trimmed : FALLBACK_CURRENCY;
}

export function localeForUi(idiomaUi: string | undefined): string {
  return idiomaUi === "en" ? "en-US" : "es-AR";
}

export function getCurrencyCodeFromReporte(reporte: unknown): CurrencyCode {
  if (!reporte || typeof reporte !== "object") return FALLBACK_CURRENCY;
  const r = reporte as Record<string, unknown>;
  const meta = r.meta as Record<string, unknown> | undefined;
  if (meta?.currency_code) return normalizeCurrencyCode(String(meta.currency_code));
  if (r.currency_code) return normalizeCurrencyCode(String(r.currency_code));
  return FALLBACK_CURRENCY;
}

export function formatMonto(
  amount: number | undefined | null,
  currencyCode: string | undefined | null,
  idiomaUi?: string
): string {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return "—";
  const currency = normalizeCurrencyCode(currencyCode);
  const locale = localeForUi(idiomaUi);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `$${Math.round(Number(amount)).toLocaleString(locale)}`;
  }
}

/** Moneda mock: NEXT_PUBLIC_MOCK_CURRENCY=ARS en .env.local para probar. */
export function getMockCurrencyCode(): CurrencyCode {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_MOCK_CURRENCY) {
    return normalizeCurrencyCode(process.env.NEXT_PUBLIC_MOCK_CURRENCY);
  }
  return FALLBACK_CURRENCY;
}
