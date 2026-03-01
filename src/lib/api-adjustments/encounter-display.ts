/**
 * Encounter section content for Pokémon detail view.
 * Aligns with availability tags (Obtain: Wild, NPC Trade, Gift, Game Corner, Fossil, Event; Evolutions).
 */

import {
  GAME_CORNER_IDS,
  GAME_CORNER_FR_ONLY_IDS,
  GAME_CORNER_LG_ONLY_IDS,
  NPC_TRADE_IDS,
  NPC_TRADE_FR_IDS,
  NPC_TRADE_LG_IDS,
  FOSSIL_IDS,
  GIFT_ONLY_IDS,
  WILD_LG_ONLY_IDS,
  WILD_FR_ONLY_IDS,
} from "./availability";

const MEW_ID = 151;

export type ThemeVersion = "red" | "green";

/** Location slug + text segment to show as link (must appear in gift text). */
export type GiftLocationLink = { slug: string; textInGift: string };

type EncounterBlock =
  | { type: "wild"; locations: string[] }
  | { type: "npc-trade"; text: string }
  | { type: "gift"; text: string; locationLinks?: GiftLocationLink[] }
  | { type: "game-corner"; text: string; locationLinks?: GiftLocationLink[] }
  | { type: "fossil"; text: string }
  | { type: "event"; text: string }
  | { type: "evolution-only"; text: string };

export type EncounterDisplayResult = {
  /** When set, show "This Pokémon cannot be found in this version. Change to [link]FireRed|LeafGreen" */
  versionExclusive?: { switchTo: ThemeVersion };
  /** Obtain blocks to show (Wild locations, NPC Trade, Gift, Game Corner, Fossil, Event). */
  blocks: EncounterBlock[];
};

type EncounterEntry = {
  locationAreaName: string;
  versionDetails: Array<{ versionName: string }>;
};

/** Gift location text by Pokémon id (FRLG). */
const GIFT_LOCATIONS: Record<number, string> = {
  1: "Gift in Pallet Town",   // Bulbasaur
  4: "Gift in Pallet Town",   // Charmander
  7: "Gift in Pallet Town",   // Squirtle
  106: "Gift in Fighting Dojo", // Hitmonlee (Dojo is in Saffron City; we link to our location slug)
  107: "Gift in Fighting Dojo", // Hitmonchan
  133: "Gift in Celadon Mansion", // Eevee
  131: "Gift in Silph Co. / Surfing in Icefall Cave", // Lapras
};

/** Gift Pokémon id -> location slugs in our base; textInGift is the substring in GIFT_LOCATIONS to turn into a link. */
const GIFT_LOCATION_LINKS: Record<number, GiftLocationLink[]> = {
  1: [{ slug: "pallet-town-area", textInGift: "Pallet Town" }],
  4: [{ slug: "pallet-town-area", textInGift: "Pallet Town" }],
  7: [{ slug: "pallet-town-area", textInGift: "Pallet Town" }],
  106: [{ slug: "saffron-city-fighting-dojo", textInGift: "Fighting Dojo" }],
  107: [{ slug: "saffron-city-fighting-dojo", textInGift: "Fighting Dojo" }],
  133: [{ slug: "celadon-city-celadon-mansion", textInGift: "Celadon Mansion" }],
  131: [
    { slug: "saffron-city-silph-co-7f", textInGift: "Silph Co." },
    { slug: "icefall-cave-waterfall", textInGift: "Icefall Cave" },
  ],
};

/** Game Corner: price text by Pokémon id. (FR / LG) in Rocket Game Corner, Celadon City. */
const GAME_CORNER_PRICES: Record<number, { fr: string; lg: string }> = {
  35: { fr: "500c", lg: "750c" },   // Clefairy
  63: { fr: "180c", lg: "120c" },   // Abra
  123: { fr: "2500c", lg: "" },     // Scyther (FR only)
  127: { fr: "", lg: "2500c" },     // Pinsir (LG only)
  137: { fr: "9999c", lg: "6500c" }, // Porygon
  147: { fr: "2800c", lg: "4600c" }, // Dratini
};

/** Text after price. Our base has "Celadon City" (celadon-city-area); no separate Game Corner slug. */
const GAME_CORNER_SUFFIX = " in the Rocket Game Corner, in Celadon City";
const GAME_CORNER_LOCATION_LINKS: GiftLocationLink[] = [
  { slug: "celadon-city-area", textInGift: "Celadon City" },
];

/** Fossil name by Pokémon id. */
const FOSSIL_NAMES: Record<number, string> = {
  138: "Helix Fossil",   // Omanyte
  140: "Dome Fossil",   // Kabuto
  142: "Old Amber",     // Aerodactyl
};

function getLocationsForVersion(
  encounters: EncounterEntry[],
  version: "firered" | "leafgreen"
): string[] {
  return encounters
    .filter((enc) =>
      enc.versionDetails.some((vd) => vd.versionName.toLowerCase() === version)
    )
    .map((enc) => enc.locationAreaName);
}

/**
 * Returns content for the Encounters section based on availability logic and theme.
 */
export function getEncounterDisplayContent(
  pokemonId: number,
  availability: string,
  encounters: EncounterEntry[],
  theme: ThemeVersion,
  evolvesFromSpeciesName: string | null
): EncounterDisplayResult {
  const av = availability;
  const isFR = theme === "red";
  const isLG = theme === "green";

  // Version exclusivity: available only in the other version
  if (GAME_CORNER_FR_ONLY_IDS.has(pokemonId) && isLG) {
    return { versionExclusive: { switchTo: "red" }, blocks: [] };
  }
  if (GAME_CORNER_LG_ONLY_IDS.has(pokemonId) && isFR) {
    return { versionExclusive: { switchTo: "green" }, blocks: [] };
  }
  if (NPC_TRADE_FR_IDS.has(pokemonId) && isLG) {
    return { versionExclusive: { switchTo: "red" }, blocks: [] };
  }
  if (NPC_TRADE_LG_IDS.has(pokemonId) && isFR) {
    return { versionExclusive: { switchTo: "green" }, blocks: [] };
  }
  if (WILD_FR_ONLY_IDS.has(pokemonId) && isLG) {
    return { versionExclusive: { switchTo: "red" }, blocks: [] };
  }
  if (WILD_LG_ONLY_IDS.has(pokemonId) && isFR) {
    return { versionExclusive: { switchTo: "green" }, blocks: [] };
  }

  const blocks: EncounterBlock[] = [];

  // Event (Mew)
  if (pokemonId === MEW_ID) {
    blocks.push({ type: "event", text: "Distributed at promotional events" });
    return { blocks };
  }

  const locations = getLocationsForVersion(
    encounters,
    isFR ? "firered" : "leafgreen"
  );

  // 1. Wild: locations for current theme
  if (locations.length > 0 && (av.includes("Wild") || av.includes("Wild FR") || av.includes("Wild LG"))) {
    blocks.push({ type: "wild", locations });
  }

  // 2. NPC Trade (for now just label; route/pokemon later)
  if (NPC_TRADE_IDS.has(pokemonId)) {
    blocks.push({ type: "npc-trade", text: "NPC Trade" });
  }

  // 3. Gift (location text by id; link to location if in our base)
  if (av.includes("Gift") || GIFT_ONLY_IDS.has(pokemonId)) {
    const giftText = GIFT_LOCATIONS[pokemonId];
    const locationLinks = GIFT_LOCATION_LINKS[pokemonId];
    blocks.push({
      type: "gift",
      text: giftText ?? "Gift",
      ...(locationLinks?.length ? { locationLinks } : {}),
    });
  }

  // 4. Game Corner (with prices by theme)
  if (GAME_CORNER_IDS.has(pokemonId)) {
    const prices = GAME_CORNER_PRICES[pokemonId];
    const priceStr = prices
      ? isFR
        ? prices.fr
          ? `Buy for ${prices.fr}${GAME_CORNER_SUFFIX}`
          : ""
        : prices.lg
          ? `Buy for ${prices.lg}${GAME_CORNER_SUFFIX}`
          : ""
      : "";
    if (priceStr) {
      blocks.push({
        type: "game-corner",
        text: priceStr,
        locationLinks: GAME_CORNER_LOCATION_LINKS,
      });
    }
  }

  // 5. Fossil
  if (FOSSIL_IDS.has(pokemonId)) {
    const fossilName = FOSSIL_NAMES[pokemonId] ?? "Fossil";
    blocks.push({ type: "fossil", text: fossilName });
  }

  // 6. Evolution only: no obtain in this version
  const hasObtain =
    blocks.length > 0 ||
    (av.includes("Wild") && locations.length > 0);
  if (
    !hasObtain &&
    (av.includes("Trade Evo") ||
      av.includes("Lv.") ||
      (evolvesFromSpeciesName != null && evolvesFromSpeciesName !== ""))
  ) {
    blocks.push({
      type: "evolution-only",
      text: "This Pokémon cannot be found in the wild.",
    });
  }

  if (blocks.length === 0) {
    blocks.push({
      type: "evolution-only",
      text: "This Pokémon cannot be found in the wild.",
    });
  }

  return { blocks };
}
