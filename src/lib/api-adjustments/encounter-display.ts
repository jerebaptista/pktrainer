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
import { getPokemonDisplayName } from "./display-names";
import { getLocationDisplayName } from "./location-display-names";

const MEW_ID = 151;

export type ThemeVersion = "red" | "green";

/** Location slug + text segment to show as link (must appear in gift text). */
export type GiftLocationLink = { slug: string; textInGift: string };

/** Fossil block link: item (fossil) or location; textInBlock must appear in fossil text. */
export type FossilLink = { slug: string; textInBlock: string; linkType: "item" | "location" };

/** NPC Trade block link: Pokémon (pokedex) or location; textInBlock must appear in block text. */
export type NpcTradeLink = { slug: string; textInBlock: string; linkType: "pokemon" | "location" };

type EncounterBlock =
  | { type: "wild"; byMethod: WildByMethod[] }
  | { type: "npc-trade"; text: string; links?: NpcTradeLink[] }
  | { type: "gift"; text: string; locationLinks?: GiftLocationLink[] }
  | { type: "game-corner"; text: string; locationLinks?: GiftLocationLink[] }
  | { type: "fossil"; text: string; links?: FossilLink[] }
  | { type: "buy"; text: string; locationLinks?: GiftLocationLink[] }
  | { type: "evolution"; text: string; links?: EvolutionLink[] }
  | { type: "event"; text: string }
  | { type: "evolution-only"; text: string }
  | { type: "static"; text: string; locationLinks?: GiftLocationLink[] };

/** Evolution block: link to pre-evolution Pokémon. */
export type EvolutionLink = { slug: string; textInBlock: string };

/** Order of obtain methods (matches Availability filter). Wild = Grass, Surf, Fishing (Old/Good/Super Rod). */
export const AVAILABILITY_BLOCK_ORDER = [
  "wild",
  "npc-trade",
  "gift",
  "game-corner",
  "buy",
  "fossil",
  "evolution",
  "event",
] as const;

const STONE_LABELS = ["Fire Stone", "Water Stone", "Thunder Stone", "Leaf Stone", "Moon Stone"];

/** Parse availability string for evolution method: "at Lv. XX", "by [Stone]", or "by Trade". */
function getEvolutionMethodFromAvailability(av: string): string | null {
  if (!av || typeof av !== "string") return null;
  if (av.includes("Trade Evo")) return "by Trade";
  const lvMatch = av.match(/Lv\.\s*(\d+)/);
  if (lvMatch) return `at Lv. ${lvMatch[1]}`;
  for (const stone of STONE_LABELS) {
    if (av.includes(stone)) return `by ${stone}`;
  }
  return null;
}

export type EncounterDisplayResult = {
  /** When set, show "This Pokémon cannot be found in this version. Change to [link]FireRed|LeafGreen" */
  versionExclusive?: { switchTo: ThemeVersion };
  /** Obtain blocks to show (Wild locations, NPC Trade, Gift, Game Corner, Fossil, Event). */
  blocks: EncounterBlock[];
};

/** Encounter entry (from API / PokemonRow). versionDetails.encounterDetails carry method per version. */
export type EncounterEntry = {
  locationAreaName: string;
  versionDetails: Array<{
    versionName: string;
    encounterDetails?: Array<{ methodName: string }>;
  }>;
};

/** Wild block grouped by method: "Walking in [locations]", "Surfing in [locations]", etc. */
export type WildByMethod = { methodLabel: string; locations: string[] };

const WILD_METHOD_ORDER: Array<{ key: string; label: string }> = [
  { key: "walk", label: "Grass" },
  { key: "surf", label: "Surf" },
  { key: "old-rod", label: "Old Rod" },
  { key: "good-rod", label: "Good Rod" },
  { key: "super-rod", label: "Super Rod" },
];

/** Gift location text by Pokémon id (FRLG). IN = town/city, AT = specific venue. */
const GIFT_LOCATIONS: Record<number, string> = {
  1: "Gift in Pallet Town",   // Bulbasaur
  4: "Gift in Pallet Town",   // Charmander
  7: "Gift in Pallet Town",   // Squirtle
  106: "Gift at the Fighting Dojo", // Hitmonlee
  107: "Gift at the Fighting Dojo", // Hitmonchan
  133: "Gift at the Celadon Mansion", // Eevee
  131: "Gift at Silph Co. 7F", // Lapras (Wild: Icefall Cave Waterfall from API)
};

/** Gift Pokémon id -> location slugs in our base; textInGift is the substring in GIFT_LOCATIONS to turn into a link. */
const GIFT_LOCATION_LINKS: Record<number, GiftLocationLink[]> = {
  1: [{ slug: "pallet-town-area", textInGift: "Pallet Town" }],
  4: [{ slug: "pallet-town-area", textInGift: "Pallet Town" }],
  7: [{ slug: "pallet-town-area", textInGift: "Pallet Town" }],
  106: [{ slug: "saffron-city-fighting-dojo", textInGift: "Fighting Dojo" }],
  107: [{ slug: "saffron-city-fighting-dojo", textInGift: "Fighting Dojo" }],
  133: [{ slug: "celadon-city-celadon-mansion", textInGift: "Celadon Mansion" }],
  131: [{ slug: "saffron-city-silph-co-7f", textInGift: "Silph Co. 7F" }],
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

/** Text after price. AT = venue, IN = city. */
const GAME_CORNER_SUFFIX = " at the Rocket Game Corner in Celadon City";
const GAME_CORNER_LOCATION_LINKS: GiftLocationLink[] = [
  { slug: "celadon-city-area", textInGift: "Celadon City" },
];

/** Fossil: display name by Pokémon id. */
const FOSSIL_NAMES: Record<number, string> = {
  138: "Helix Fossil",   // Omanyte
  140: "Dome Fossil",   // Kabuto
  142: "Old Amber",     // Aerodactyl
};

/** Cinnabar Lab (revive fossils). Our base: cinnabar-island-cinnabar-lab → "Cinnabar Lab". */
const FOSSIL_REVIVE_LOCATION_SLUG = "cinnabar-island-cinnabar-lab";
const FOSSIL_REVIVE_LOCATION_NAME = "Cinnabar Lab";

/** Fossil block text and links: "Revive from [fossil] at the [location]". */
const FOSSIL_BLOCK_BY_ID: Record<
  number,
  { text: string; links: FossilLink[] }
> = {
  138: {
    text: `Revive from Helix Fossil at the ${FOSSIL_REVIVE_LOCATION_NAME}`,
    links: [
      { slug: "helix-fossil", textInBlock: "Helix Fossil", linkType: "item" },
      { slug: FOSSIL_REVIVE_LOCATION_SLUG, textInBlock: FOSSIL_REVIVE_LOCATION_NAME, linkType: "location" },
    ],
  },
  140: {
    text: `Revive from Dome Fossil at the ${FOSSIL_REVIVE_LOCATION_NAME}`,
    links: [
      { slug: "dome-fossil", textInBlock: "Dome Fossil", linkType: "item" },
      { slug: FOSSIL_REVIVE_LOCATION_SLUG, textInBlock: FOSSIL_REVIVE_LOCATION_NAME, linkType: "location" },
    ],
  },
  142: {
    text: `Revive from Old Amber at the ${FOSSIL_REVIVE_LOCATION_NAME}`,
    links: [
      { slug: "old-amber", textInBlock: "Old Amber", linkType: "item" },
      { slug: FOSSIL_REVIVE_LOCATION_SLUG, textInBlock: FOSSIL_REVIVE_LOCATION_NAME, linkType: "location" },
    ],
  },
};

/** Static (fixed) encounters in FRLG: one per location or use Poké Flute. */
const STATIC_BLOCK_BY_ID: Record<number, { text: string; locationLinks: GiftLocationLink[] }> = {
  143: {
    text: "Use the Poké Flute in Route 12, Route 16",
    locationLinks: [
      { slug: "kanto-route-12-area", textInGift: "Route 12" },
      { slug: "kanto-route-16-area", textInGift: "Route 16" },
    ],
  },
  144: {
    text: "Only one in Seafoam Islands",
    locationLinks: [{ slug: "seafoam-islands-1f", textInGift: "Seafoam Islands" }],
  },
  145: {
    text: "Only one in Power Plant",
    locationLinks: [{ slug: "power-plant-area", textInGift: "Power Plant" }],
  },
  146: {
    text: "Only one in Mt. Ember",
    locationLinks: [{ slug: "mt-ember-summit", textInGift: "Mt. Ember" }],
  },
  150: {
    text: "Only one in Cerulean Cave",
    locationLinks: [{ slug: "cerulean-cave-1f", textInGift: "Cerulean Cave" }],
  },
};

/** NPC Trade: text and links per Pokémon; theme selects FR/LG variant where needed (e.g. Lickitung). */
function getNpcTradeBlock(
  pokemonId: number,
  theme: ThemeVersion
): { text: string; links: NpcTradeLink[] } | null {
  const isFR = theme === "red";
  const isLG = theme === "green";

  switch (pokemonId) {
    case 29: // Nidoran♀ (FR only)
      return isFR
        ? {
            text: "Trade Nidoran♂ in the Underground Path",
            links: [
              { slug: "nidoran-m", textInBlock: "Nidoran♂", linkType: "pokemon" },
              { slug: "underground-path", textInBlock: "Underground Path", linkType: "location" },
            ],
          }
        : null;
    case 30: // Nidorina (FR only)
      return isFR
        ? {
            text: "Trade Nidorino on Route 11",
            links: [
              { slug: "nidorino", textInBlock: "Nidorino", linkType: "pokemon" },
              { slug: "kanto-route-11-area", textInBlock: "Route 11", linkType: "location" },
            ],
          }
        : null;
    case 32: // Nidoran♂ (LG only)
      return isLG
        ? {
            text: "Trade Nidoran♀ in the Underground Path",
            links: [
              { slug: "nidoran-f", textInBlock: "Nidoran♀", linkType: "pokemon" },
              { slug: "underground-path", textInBlock: "Underground Path", linkType: "location" },
            ],
          }
        : null;
    case 33: // Nidorino (LG only)
      return isLG
        ? {
            text: "Trade Nidorina on Route 11",
            links: [
              { slug: "nidorina", textInBlock: "Nidorina", linkType: "pokemon" },
              { slug: "kanto-route-11-area", textInBlock: "Route 11", linkType: "location" },
            ],
          }
        : null;
    case 83: // Farfetch'd
      return {
        text: "Trade Spearow in Vermilion City",
        links: [
          { slug: "spearow", textInBlock: "Spearow", linkType: "pokemon" },
          { slug: "vermilion-city-area", textInBlock: "Vermilion City", linkType: "location" },
        ],
      };
    case 86: // Seel
      return {
        text: "Trade Ponyta at the Cinnabar Lab",
        links: [
          { slug: "ponyta", textInBlock: "Ponyta", linkType: "pokemon" },
          { slug: "cinnabar-island-cinnabar-lab", textInBlock: "Cinnabar Lab", linkType: "location" },
        ],
      };
    case 108: // Lickitung: Golduck (FR) / Slowbro (LG)
      return isFR
        ? {
            text: "Trade Golduck (FR) on Route 18",
            links: [
              { slug: "golduck", textInBlock: "Golduck (FR)", linkType: "pokemon" },
              { slug: "kanto-route-18-area", textInBlock: "Route 18", linkType: "location" },
            ],
          }
        : {
            text: "Trade Slowbro (LG) on Route 18",
            links: [
              { slug: "slowbro", textInBlock: "Slowbro (LG)", linkType: "pokemon" },
              { slug: "kanto-route-18-area", textInBlock: "Route 18", linkType: "location" },
            ],
          };
    case 122: // Mr. Mime
      return {
        text: "Trade Abra on Route 2 Towards Viridian City",
        links: [
          { slug: "abra", textInBlock: "Abra", linkType: "pokemon" },
          { slug: "kanto-route-2-south-towards-viridian-city", textInBlock: "Route 2 Towards Viridian City", linkType: "location" },
        ],
      };
    case 124: // Jynx
      return {
        text: "Trade Poliwhirl in Cerulean City",
        links: [
          { slug: "poliwhirl", textInBlock: "Poliwhirl", linkType: "pokemon" },
          { slug: "cerulean-city-area", textInBlock: "Cerulean City", linkType: "location" },
        ],
      };
    default:
      return null;
  }
}

/** Safari Zone areas in FRLG (our base). Nidorina & Nidorino can be found here in both versions; API may omit. */
const SAFARI_ZONE_SLUGS = [
  "kanto-safari-zone-area-1-east",
  "kanto-safari-zone-area-2-north",
  "kanto-safari-zone-area-3-west",
  "kanto-safari-zone-middle",
] as const;

/** Pokémon that appear in Safari Zone in both FR and LG but API may not return it – we add these locations. */
const ENRICH_SAFARI_ZONE_IDS = new Set([29, 30, 32, 33]); // Nidoran♀, Nidorina, Nidoran♂, Nidorino

function getLocationsByMethodForVersion(
  encounters: EncounterEntry[],
  version: "firered" | "leafgreen"
): Record<string, string[]> {
  const versionLower = version.toLowerCase();
  const byMethod: Record<string, string[]> = {};
  for (const enc of encounters) {
    const loc = enc.locationAreaName;
    if (!loc || loc === "—") continue;
    for (const vd of enc.versionDetails ?? []) {
      if (vd.versionName?.toLowerCase() !== versionLower) continue;
      const details = vd.encounterDetails ?? [];
      if (details.length === 0) {
        if (!byMethod["walk"]) byMethod["walk"] = [];
        if (!byMethod["walk"]!.includes(loc)) byMethod["walk"]!.push(loc);
        continue;
      }
      for (const ed of details) {
        const method = (ed.methodName ?? "").toLowerCase().trim();
        if (!method || method === "gift" || method === "trade") continue;
        if (!byMethod[method]) byMethod[method] = [];
        if (!byMethod[method]!.includes(loc)) byMethod[method]!.push(loc);
      }
    }
  }
  return byMethod;
}

function applyLocationFilters(
  locations: string[],
  pokemonId: number
): string[] {
  let list = [...locations];
  const LAPRAS_ID = 131;
  const SILPH_CO_7F_SLUG = "saffron-city-silph-co-7f";
  if (pokemonId === LAPRAS_ID) {
    list = list.filter((loc) => loc.toLowerCase() !== SILPH_CO_7F_SLUG);
  }
  const MAGIKARP_ID = 129;
  const PC_ROUTE_3_SLUG = "kanto-route-3-pokemon-center";
  const PC_ROUTE_4_SLUG = "kanto-route-4-pokemon-center";
  if (pokemonId === MAGIKARP_ID) {
    list = list.filter(
      (loc) =>
        loc.toLowerCase() !== PC_ROUTE_3_SLUG && loc.toLowerCase() !== PC_ROUTE_4_SLUG
    );
  }
  return list;
}

/** Only enrich Safari Zone for "walk" – Nidoran family are in grass there, not surf/rod. */
function enrichWithSafariZone(
  locations: string[],
  pokemonId: number,
  methodKey: string
): string[] {
  if (!ENRICH_SAFARI_ZONE_IDS.has(pokemonId) || methodKey !== "walk") return locations;
  const existing = new Set(locations.map((l) => l.toLowerCase()));
  const out = [...locations];
  for (const slug of SAFARI_ZONE_SLUGS) {
    if (!existing.has(slug)) {
      out.push(slug);
      existing.add(slug);
    }
  }
  return out;
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

  // Version exclusivity: only for truly exclusive (Game Corner FR/LG, Wild FR/LG). NPC Trade FR/LG is not exclusive – trade is version-specific but Pokémon can be caught wild in both.
  if (GAME_CORNER_FR_ONLY_IDS.has(pokemonId) && isLG) {
    return { versionExclusive: { switchTo: "red" }, blocks: [] };
  }
  if (GAME_CORNER_LG_ONLY_IDS.has(pokemonId) && isFR) {
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

  // Static (Snorlax, Articuno, Zapdos, Moltres, Mewtwo) – fixed encounter description with locations
  if (av.trim() === "Static") {
    const staticBlock = STATIC_BLOCK_BY_ID[pokemonId];
    if (staticBlock) {
      blocks.push({
        type: "static",
        text: staticBlock.text,
        locationLinks: staticBlock.locationLinks,
      });
      return { blocks };
    }
  }

  const version = isFR ? "firered" : "leafgreen";
  const byMethodRaw = getLocationsByMethodForVersion(encounters, version);
  const byMethod: WildByMethod[] = [];
  const sortLocationsByDisplayName = (slugs: string[]) =>
    [...slugs].sort((a, b) =>
      getLocationDisplayName(a).localeCompare(getLocationDisplayName(b), "en")
    );

  for (const { key, label } of WILD_METHOD_ORDER) {
    let locs = byMethodRaw[key] ?? [];
    locs = applyLocationFilters(locs, pokemonId);
    locs = enrichWithSafariZone(locs, pokemonId, key);
    locs = sortLocationsByDisplayName(locs);
    if (locs.length > 0) {
      byMethod.push({ methodLabel: label, locations: locs });
    }
  }
  // If API didn't use our method keys, add any remaining methods with formatApiName label
  const knownKeys = new Set(WILD_METHOD_ORDER.map((m) => m.key));
  for (const [key, locs] of Object.entries(byMethodRaw)) {
    if (knownKeys.has(key)) continue;
    let list = applyLocationFilters(locs, pokemonId);
    list = enrichWithSafariZone(list, pokemonId, key);
    list = sortLocationsByDisplayName(list);
    if (list.length > 0) {
      byMethod.push({
        methodLabel: key.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
        locations: list,
      });
    }
  }

  // 1. Wild: by method (Walking in [locations], Surfing in [locations], etc.)
  if (byMethod.length > 0 && (av.includes("Grass") || av.includes("Surf") || av.includes("Fishing") || av.includes("Wild"))) {
    blocks.push({ type: "wild", byMethod });
  }

  // 2. NPC Trade (only when this version has the trade; Nidoran♂ on FR has no trade block but has Wild)
  if (NPC_TRADE_IDS.has(pokemonId)) {
    const npcBlock = getNpcTradeBlock(pokemonId, theme);
    if (npcBlock) {
      blocks.push({
        type: "npc-trade",
        text: npcBlock.text,
        links: npcBlock.links,
      });
    }
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
          ? `Purchase for ${prices.fr}${GAME_CORNER_SUFFIX}`
          : ""
        : prices.lg
          ? `Purchase for ${prices.lg}${GAME_CORNER_SUFFIX}`
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

  // 4b. Purchase (e.g. Magikarp at Pokémon Center Route 4)
  const MAGIKARP_ID = 129;
  const PC_ROUTE_4_SLUG = "kanto-route-4-pokemon-center";
  if (pokemonId === MAGIKARP_ID) {
    blocks.push({
      type: "buy",
      text: "Purchase for $500 at Pokémon Center Route 4",
      locationLinks: [
        { slug: PC_ROUTE_4_SLUG, textInGift: "Pokémon Center Route 4" },
      ],
    });
  }

  // 5. Fossil (Revive from [fossil] at the [location]; both linked)
  if (FOSSIL_IDS.has(pokemonId)) {
    const fossilBlock = FOSSIL_BLOCK_BY_ID[pokemonId];
    if (fossilBlock) {
      blocks.push({
        type: "fossil",
        text: fossilBlock.text,
        links: fossilBlock.links,
      });
    } else {
      const fossilName = FOSSIL_NAMES[pokemonId] ?? "Fossil";
      blocks.push({ type: "fossil", text: fossilName });
    }
  }

  // 6. Evolution (Evolves from [parent] at Lv. XX / by [Stone] / by Trade)
  if (evolvesFromSpeciesName != null && evolvesFromSpeciesName !== "") {
    const method = getEvolutionMethodFromAvailability(av);
    const parentDisplay = getPokemonDisplayName(evolvesFromSpeciesName);
    const methodPhrase = method ? ` ${method}` : "";
    blocks.push({
      type: "evolution",
      text: `Evolves from ${parentDisplay}${methodPhrase}`,
      links: [
        { slug: evolvesFromSpeciesName, textInBlock: parentDisplay },
      ],
    });
  }

  // 7. Evolution only: no obtain in this version
  const hasObtain =
    blocks.length > 0 ||
    byMethod.length > 0;
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
