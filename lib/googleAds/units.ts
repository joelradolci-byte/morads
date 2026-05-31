/** Convierte amount_micros de Google Ads a unidades de moneda (mismo criterio que liveExtract). */
export function microsToUnits(micros: unknown): number {
  const n = typeof micros === "number" ? micros : Number(micros ?? 0);
  return n / 1_000_000;
}

export function unitsToMicros(units: number): number {
  return Math.round(units * 1_000_000);
}
