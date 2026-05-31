/** API real de Google Ads: activar con NEXT_PUBLIC_GOOGLE_ADS_LIVE=true */
export function isGoogleAdsDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_LIVE !== "true";
}
