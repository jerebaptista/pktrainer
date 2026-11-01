import type { AppLocale } from "@/i18n/routing";

const LOCALE_TO_POKEAPI: Record<AppLocale, string> = {
  en: "en",
  ja: "ja",
  fr: "fr",
  it: "it",
  de: "de",
  es: "es",
  "pt-BR": "pt-br",
  "zh-Hant": "zh-hant",
  ko: "ko",
};

export function toPokeApiLanguage(locale: string): string {
  return LOCALE_TO_POKEAPI[locale as AppLocale] ?? "en";
}

export function pickLocalizedName(
  names: Record<string, string> | undefined,
  locale: string,
  fallback: string
): string {
  if (!names) return fallback;
  const pokeLang = toPokeApiLanguage(locale);
  return names[pokeLang] || names.en || fallback;
}

export function mapLocalizedEntries(
  entries: Array<{ name?: string; language?: { name?: string } }> | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of entries ?? []) {
    const lang = entry.language?.name;
    const value = entry.name?.trim();
    if (lang && value) result[lang] = value;
  }
  return result;
}
