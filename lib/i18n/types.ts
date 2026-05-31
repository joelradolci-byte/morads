export type Locale = "es" | "en";

export const LOCALES: Locale[] = ["es", "en"];

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : "es";
}
