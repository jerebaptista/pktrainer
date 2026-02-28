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

/** Hitmonlee, Hitmonchan: only Gift (Dojo), no Lv. evolution label. */
export const GIFT_ONLY_IDS = new Set([106, 107]);

/** Wild but only in LeafGreen (Muk, Kingler) – show as "Wild LG" with small LG. */
export const WILD_LG_ONLY_IDS = new Set([89, 99]);
const WILD_LG_LABEL = "Wild LG";

/** Wild but only in FireRed (Weezing, Seadra) – show as "Wild FR" with small FR. */
export const WILD_FR_ONLY_IDS = new Set([110, 117]);
const WILD_FR_LABEL = "Wild FR";

/** Don't show level evolution prefix (Electabuzz, Magmar). */
const NO_LEVEL_PREFIX_IDS = new Set([125, 126]);

/** Obtainable in both FRLG despite API – don't add FR/LG Only. (Currently none; was Muk before correction.) */
export const IN_BOTH_GAMES_OVERRIDE_IDS = new Set<number>();

const WILD_LABEL = "Wild";
const GIFT_LABEL = "Gift";
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
  else if (WILD_LG_ONLY_IDS.has(pokemonId)) {
    atoms.push(WILD_LG_LABEL);
  } else if (WILD_FR_ONLY_IDS.has(pokemonId)) {
    atoms.push(WILD_FR_LABEL);
  } else {
    atoms.push(WILD_LABEL);
  }
  if (GAME_CORNER_IDS.has(pokemonId)) atoms.push(GAME_CORNER_LABEL);
  if (NPC_TRADE_FR_IDS.has(pokemonId)) atoms.push(NPC_TRADE_FR_LABEL);
  else if (NPC_TRADE_LG_IDS.has(pokemonId)) atoms.push(NPC_TRADE_LG_LABEL);
  else if (NPC_TRADE_IDS.has(pokemonId)) atoms.push(NPC_TRADE_LABEL);
  if (!IN_BOTH_GAMES_OVERRIDE_IDS.has(pokemonId)) {
    if (WILD_LG_ONLY_IDS.has(pokemonId)) {
      // already "Wild LG"
    } else if (WILD_FR_ONLY_IDS.has(pokemonId)) {
      // already "Wild FR"
    } else if (versions.has("firered") && !versions.has("leafgreen")) {
      atoms.push(FR_ONLY_LABEL);
    } else if (versions.has("leafgreen") && !versions.has("firered")) {
      atoms.push(LG_ONLY_LABEL);
    }
  }
  return atoms.join(", ");
}
