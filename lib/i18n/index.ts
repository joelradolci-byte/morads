import { en } from "./locales/en";
import { es } from "./locales/es";
import type { EsDict } from "./locales/es";
import type { Locale } from "./types";

const dictionaries: Record<Locale, EsDict> = { es, en };

export type Dictionary = EsDict;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export { normalizeLocale, LOCALES } from "./types";
export type { Locale } from "./types";
