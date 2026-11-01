import { pickLocalizedName } from "@/lib/locale";

/**
 * Display names: API returns slugs (e.g. nidoran-f, mr-mime).
 * We override with the correct display form used across the site.
 */
const DISPLAY_NAME_MAP: Record<string, string> = {
  "nidoran-f": "Nidoran♀",
  "nidoran-m": "Nidoran♂",
  farfetchd: "Farfetch'd",
  "mr-mime": "Mr. Mime",
};

/**
 * Returns the display name for a Pokémon. Use everywhere we show a Pokémon name.
 * Falls back to capitalizing the first letter of each word.
 */
export function getPokemonDisplayName(apiName: string): string {
  const normalized = apiName.toLowerCase().trim();
  if (DISPLAY_NAME_MAP[normalized]) {
    return DISPLAY_NAME_MAP[normalized];
  }
  return apiName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getLocalizedPokemonName(
  apiName: string,
  localizedNames: Record<string, string> | undefined,
  locale: string
): string {
  return pickLocalizedName(localizedNames, locale, getPokemonDisplayName(apiName));
}
