/**
 * FRLG availability: our overrides on top of API encounter/evolution data
 * (Game Corner, NPC Trade, Fossil, in-both-games, etc.).
 */

/** Minimal encounter shape from PokéAPI. */
export type EncounterEntry = {
  location_area: unknown;
  version_details?: Array<{
    version?: { name?: string; url?: string };
    encounter_details?: Array<{ method?: { name?: string; url?: string } }>;
  }>;
};

/** Evolution chain node from API (recursive). */
export type EvolutionChainNode = {
  species: { name: string; url: string };
  evolution_details?: Array<{
    trigger?: { name: string; url: string };
    item?: { name: string; url: string };
    min_level?: number | null;
  }>;
  evolves_to?: EvolutionChainNode[];
};

// ─── Overrides (API can be incomplete for FRLG) ─────────────────────────────

const MEW_ID = 151;
const EVENT_LABEL = "Event";
/** Snorlax, Articuno, Zapdos, Moltres, Mewtwo – Static (fixed encounter) in FRLG when no encounter data. */
const STATIC_LABEL = "Static";
const STATIC_IDS = new Set([143, 144, 145, 146, 150]);

export const GAME_CORNER_IDS = new Set([35, 63, 123, 127, 137, 147]);
export const GAME_CORNER_FR_ONLY_IDS = new Set([123]);
export const GAME_CORNER_LG_ONLY_IDS = new Set([127]);
const GAME_CORNER_LABEL = "Game Corner";

export const NPC_TRADE_IDS = new Set([29, 30, 32, 33, 83, 86, 108, 122, 124]);
/** NPC Trade only in FireRed (Nidoran♀, Nidorina). */
export const NPC_TRADE_FR_IDS = new Set([29, 30]);
/** NPC Trade only in LeafGreen (Nidoran♂, Nidorino). */
export const NPC_TRADE_LG_IDS = new Set([32, 33]);
const NPC_TRADE_LABEL = "NPC Trade";
const NPC_TRADE_FR_LABEL = "NPC Trade FR";
const NPC_TRADE_LG_LABEL = "NPC Trade LG";

export const FOSSIL_IDS = new Set([138, 140, 142]);
const FOSSIL_LABEL = "Fossil";

/** Can be bought from NPC (e.g. Magikarp at Pokémon Center Route 4). */
export const BUY_IDS = new Set([129]);
const BUY_LABEL = "Purchase";

/** Hitmonlee, Hitmonchan: only Gift (Dojo), no Lv. evolution label. */
export const GIFT_ONLY_IDS = new Set([106, 107]);
/** Has Gift in addition to Wild (e.g. Lapras: gift in Silph Co. 7F + surf in Icefall Cave). */
export const GIFT_ALSO_IDS = new Set([131]);

/** Wild but only in LeafGreen – show as "Wild LG" with small LG. */
export const WILD_LG_ONLY_IDS = new Set([
  27, 28,   // Sandshrew, Sandslash
  37, 38,   // Vulpix, Ninetales
  52, 53,   // Meowth, Persian
  69, 70, 71,  // Bellsprout, Weepinbell, Victreebel
  89, 99,   // Muk, Kingler
  126,      // Magmar
]);
const WILD_LG_LABEL = "Wild LG";

/** Wild but only in FireRed – show as "Wild FR" with small FR. */
export const WILD_FR_ONLY_IDS = new Set([
  23, 24,   // Ekans, Arbok
  43, 44, 45, 182,  // Oddish, Gloom, Vileplume, Bellossom
  56, 57,   // Mankey, Primeape
  58, 59,   // Growlithe, Arcanine
  110, 117, // Weezing, Seadra
  125,      // Electabuzz
]);
const WILD_FR_LABEL = "Wild FR";

/** Don't show level evolution prefix (Electabuzz, Magmar). */
const NO_LEVEL_PREFIX_IDS = new Set([125, 126]);

/** Obtainable in both FRLG despite API – don't add FR/LG Only. (Currently none; was Muk before correction.) */
export const IN_BOTH_GAMES_OVERRIDE_IDS = new Set<number>();

const WILD_LABEL = "Wild";
const GIFT_LABEL = "Gift";

/** Display labels for wild methods (table + filter). Grass, Surf, Fishing (rods collapsed). */
const WILD_METHOD_ORDER = ["Grass", "Surf", "Fishing"] as const;
const API_METHOD_TO_LABEL: Record<string, (typeof WILD_METHOD_ORDER)[number]> = {
  walk: "Grass",
  surf: "Surf",
  "old-rod": "Fishing",
  "good-rod": "Fishing",
  "super-rod": "Fishing",
};

/** Collect unique wild method labels from encounters (FRLG), ordered: Grass, Surf, Fishing. */
function getWildMethodLabels(encounters: EncounterEntry[]): string[] {
  const seen = new Set<string>();
  for (const area of encounters) {
    for (const vd of area.version_details ?? []) {
      const v = vd.version?.name?.toLowerCase();
      if (v !== "firered" && v !== "leafgreen") continue;
      for (const ed of vd.encounter_details ?? []) {
        const method = (ed.method?.name ?? "").toLowerCase();
        const label = API_METHOD_TO_LABEL[method];
        if (label) seen.add(label);
      }
    }
  }
  return WILD_METHOD_ORDER.filter((l) => seen.has(l));
}
export const FR_ONLY_LABEL = "FR Only";
export const LG_ONLY_LABEL = "LG Only";
const TRADE_EVO_LABEL = "Trade Evo";

const STONE_ITEM_TO_LABEL: Record<string, string> = {
  "fire-stone": "Fire Stone",
  "water-stone": "Water Stone",
  "thunder-stone": "Thunder Stone",
  "leaf-stone": "Leaf Stone",
  "moon-stone": "Moon Stone",
};

// ─── Evolution chain helpers ───────────────────────────────────────────────

export function getTradeEvolvedSpeciesFromChain(
  chain: EvolutionChainNode | null,
  out: Set<string>
): void {
  if (!chain?.evolves_to) return;
  for (const next of chain.evolves_to) {
    const isTrade = next.evolution_details?.some((d) => d.trigger?.name === "trade");
    if (isTrade && next.species?.name) out.add(next.species.name);
    getTradeEvolvedSpeciesFromChain(next, out);
  }
}

export function getStoneEvolvedSpeciesFromChain(
  chain: EvolutionChainNode | null,
  out: Map<string, string>
): void {
  if (!chain?.evolves_to) return;
  for (const next of chain.evolves_to) {
    const detail = next.evolution_details?.find((d) => d.trigger?.name === "use-item" && d.item?.name);
    if (detail?.item?.name && next.species?.name) {
      const label = STONE_ITEM_TO_LABEL[detail.item.name];
      if (label) out.set(next.species.name, label);
    }
    getStoneEvolvedSpeciesFromChain(next, out);
  }
}

export function getLevelEvolvedSpeciesFromChain(
  chain: EvolutionChainNode | null,
  out: Map<string, number>
): void {
  if (!chain?.evolves_to) return;
  for (const next of chain.evolves_to) {
    const detail = next.evolution_details?.find((d) => d.trigger?.name === "level-up");
    if (detail != null && next.species?.name) {
      const lv = detail.min_level;
      if (lv != null && lv > 0) out.set(next.species.name, lv);
    }
    getLevelEvolvedSpeciesFromChain(next, out);
  }
}

// ─── Build availability string ─────────────────────────────────────────────

export type BuildAvailabilityParams = {
  pokemonId: number;
  encounters: EncounterEntry[];
  speciesName: string;
  tradeEvolvedSpecies: Set<string>;
  stoneEvolvedSpecies: Map<string, string>;
  levelEvolvedSpecies: Map<string, number>;
  speciesExclusivity: Map<string, string>;
  evolvesFromSpeciesName: string | null;
};

export function buildAvailability(params: BuildAvailabilityParams): string {
  const {
    pokemonId,
    encounters,
    speciesName,
    tradeEvolvedSpecies,
    stoneEvolvedSpecies,
    levelEvolvedSpecies,
    speciesExclusivity,
    evolvesFromSpeciesName,
  } = params;

  if (pokemonId === MEW_ID) return EVENT_LABEL;
  if (STATIC_IDS.has(pokemonId)) return STATIC_LABEL;
  const key = speciesName.toLowerCase();
  const versions = new Set<string>();
  let onlyGift = true;
  for (const area of encounters) {
    for (const vd of area.version_details ?? []) {
      const v = vd.version?.name?.toLowerCase();
      if (v !== "firered" && v !== "leafgreen") continue;
      versions.add(v);
      for (const ed of vd.encounter_details ?? []) {
        const method = ed.method?.name?.toLowerCase();
        if (method && method !== "gift") onlyGift = false;
      }
    }
  }
  const evolutionPrefix = (): string | null => {
    if (tradeEvolvedSpecies.has(key)) return TRADE_EVO_LABEL;
    const stone = stoneEvolvedSpecies.get(key);
    if (stone) return stone;
    const lv = levelEvolvedSpecies.get(key);
    return lv != null && lv > 0 ? `Lv. ${lv}` : null;
  };
  const exclusivitySuffix = (): string | null => {
    if (IN_BOTH_GAMES_OVERRIDE_IDS.has(pokemonId)) return null;
    const parent = evolvesFromSpeciesName?.toLowerCase();
    if (!parent) return null;
    return speciesExclusivity.get(parent) ?? null;
  };
  if (versions.size === 0) {
    if (GAME_CORNER_IDS.has(pokemonId)) {
      const parts = [GAME_CORNER_LABEL];
      if (GAME_CORNER_FR_ONLY_IDS.has(pokemonId)) parts.push(FR_ONLY_LABEL);
      if (GAME_CORNER_LG_ONLY_IDS.has(pokemonId)) parts.push(LG_ONLY_LABEL);
      return parts.join(", ");
    }
    if (NPC_TRADE_FR_IDS.has(pokemonId)) return NPC_TRADE_FR_LABEL;
    if (NPC_TRADE_LG_IDS.has(pokemonId)) return NPC_TRADE_LG_LABEL;
    if (NPC_TRADE_IDS.has(pokemonId)) return NPC_TRADE_LABEL;
    if (FOSSIL_IDS.has(pokemonId)) return FOSSIL_LABEL;
    const evo = evolutionPrefix();
    const excl = exclusivitySuffix();
    const parts = evo ? [evo] : [];
    if (excl) parts.push(excl);
    return parts.length ? parts.join(", ") : "—";
  }
  const atoms: string[] = [];
  if (GIFT_ONLY_IDS.has(pokemonId)) {
    atoms.push(GIFT_LABEL);
    if (!IN_BOTH_GAMES_OVERRIDE_IDS.has(pokemonId)) {
      if (versions.has("firered") && !versions.has("leafgreen")) atoms.push(FR_ONLY_LABEL);
      if (versions.has("leafgreen") && !versions.has("firered")) atoms.push(LG_ONLY_LABEL);
    }
    return atoms.join(", ");
  }
  if (FOSSIL_IDS.has(pokemonId)) {
    const evo = NO_LEVEL_PREFIX_IDS.has(pokemonId) ? null : evolutionPrefix();
    if (evo) atoms.push(evo);
    atoms.push(FOSSIL_LABEL);
    return atoms.join(", ");
  }
  const evo = NO_LEVEL_PREFIX_IDS.has(pokemonId) ? null : evolutionPrefix();
  if (evo) atoms.push(evo);
  if (onlyGift) atoms.push(GIFT_LABEL);
  else {
    const wildLabels = getWildMethodLabels(encounters);
    if (wildLabels.length > 0) atoms.push(...wildLabels);
    else atoms.push(WILD_LABEL);
  }
  if (GAME_CORNER_IDS.has(pokemonId)) atoms.push(GAME_CORNER_LABEL);
  if (BUY_IDS.has(pokemonId)) atoms.push(BUY_LABEL);
  if (GIFT_ALSO_IDS.has(pokemonId)) atoms.push(GIFT_LABEL);
  if (NPC_TRADE_FR_IDS.has(pokemonId)) atoms.push(NPC_TRADE_FR_LABEL);
  else if (NPC_TRADE_LG_IDS.has(pokemonId)) atoms.push(NPC_TRADE_LG_LABEL);
  else if (NPC_TRADE_IDS.has(pokemonId)) atoms.push(NPC_TRADE_LABEL);
  if (!IN_BOTH_GAMES_OVERRIDE_IDS.has(pokemonId)) {
    if (WILD_LG_ONLY_IDS.has(pokemonId)) atoms.push(LG_ONLY_LABEL);
    else if (WILD_FR_ONLY_IDS.has(pokemonId)) atoms.push(FR_ONLY_LABEL);
    else if (versions.has("firered") && !versions.has("leafgreen")) atoms.push(FR_ONLY_LABEL);
    else if (versions.has("leafgreen") && !versions.has("firered")) atoms.push(LG_ONLY_LABEL);
  }
  return atoms.join(", ");
}
