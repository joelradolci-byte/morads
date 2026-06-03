/** Normaliza customer ID de Google Ads para comparación (sin guiones). */
export function normalizeCustomerId(id: string | null | undefined): string {
  if (!id || typeof id !== "string") return "";
  return id.replace(/-/g, "").trim();
}

export function googleAdsAccountChanged(
  priorId: string | null | undefined,
  nextId: string | null | undefined
): boolean {
  const prior = normalizeCustomerId(priorId);
  const next = normalizeCustomerId(nextId);
  if (!prior || !next) return false;
  return prior !== next;
}
