const POKEAPI_BASE = "https://pokeapi.co/api/v2";

/** FireRed & LeafGreen use the Kanto Pokédex (151 Pokémon). */
const KANTO_DEX_LIMIT = 151;

/** Fallback names when fetch by ID fails (e.g. rate limit / timeout). */
const KANTO_ID_TO_NAME: Record<number, string> = {
  143: "snorlax",
  144: "articuno",
  145: "zapdos",
  146: "moltres",
  150: "mewtwo",
};

/** Full Kanto 1–151 names when list API fails; used to always have 151 names for fetch-by-name. */
const KANTO_FALLBACK_NAMES: Record<number, string> = {
  1: "bulbasaur", 2: "ivysaur", 3: "venusaur", 4: "charmander", 5: "charmeleon", 6: "charizard",
  7: "squirtle", 8: "wartortle", 9: "blastoise", 10: "caterpie", 11: "metapod", 12: "butterfree",
  13: "weedle", 14: "kakuna", 15: "beedrill", 16: "pidgey", 17: "pidgeotto", 18: "pidgeot",
  19: "rattata", 20: "raticate", 21: "spearow", 22: "fearow", 23: "ekans", 24: "arbok",
  25: "pikachu", 26: "raichu", 27: "sandshrew", 28: "sandslash", 29: "nidoran-f", 30: "nidorina",
  31: "nidoqueen", 32: "nidoran-m", 33: "nidorino", 34: "nidoking", 35: "clefairy", 36: "clefable",
  37: "vulpix", 38: "ninetales", 39: "jigglypuff", 40: "wigglytuff", 41: "zubat", 42: "golbat",
  43: "oddish", 44: "gloom", 45: "vileplume", 46: "paras", 47: "parasect", 48: "venonat", 49: "venomoth",
  50: "diglett", 51: "dugtrio", 52: "meowth", 53: "persian", 54: "psyduck", 55: "golduck",
  56: "mankey", 57: "primeape", 58: "growlithe", 59: "arcanine", 60: "poliwag", 61: "poliwhirl",
  62: "poliwrath", 63: "abra", 64: "kadabra", 65: "alakazam", 66: "machop", 67: "machoke", 68: "machamp",
  69: "bellsprout", 70: "weepinbell", 71: "victreebel", 72: "tentacool", 73: "tentacruel", 74: "geodude",
  75: "graveler", 76: "golem", 77: "ponyta", 78: "rapidash", 79: "slowpoke", 80: "slowbro",
  81: "magnemite", 82: "magneton", 83: "farfetchd", 84: "doduo", 85: "dodrio", 86: "seel", 87: "dewgong",
  88: "grimer", 89: "muk", 90: "shellder", 91: "cloyster", 92: "gastly", 93: "haunter", 94: "gengar",
  95: "onix", 96: "drowzee", 97: "hypno", 98: "krabby", 99: "kingler", 100: "voltorb", 101: "electrode",
  102: "exeggcute", 103: "exeggutor", 104: "cubone", 105: "marowak", 106: "hitmonlee", 107: "hitmonchan",
  108: "lickitung", 109: "koffing", 110: "weezing", 111: "rhyhorn", 112: "rhydon", 113: "chansey",
  114: "tangela", 115: "kangaskhan", 116: "horsea", 117: "seadra", 118: "goldeen", 119: "seaking",
  120: "staryu", 121: "starmie", 122: "mr-mime", 123: "scyther", 124: "jynx", 125: "electabuzz",
  126: "magmar", 127: "pinsir", 128: "tauros", 129: "magikarp", 130: "gyarados", 131: "lapras",
  132: "ditto", 133: "eevee", 134: "vaporeon", 135: "jolteon", 136: "flareon", 137: "porygon",
  138: "omanyte", 139: "omastar", 140: "kabuto", 141: "kabutops", 142: "aerodactyl",
  143: "snorlax", 144: "articuno", 145: "zapdos", 146: "moltres", 147: "dratini", 148: "dragonair",
  149: "dragonite", 150: "mewtwo", 151: "mew",
};

async function fetchPokemonByIdOrName(id: number): Promise<PokemonFromAPI | null> {
  const byId = await fetch(`${POKEAPI_BASE}/pokemon/${id}`, {
    next: { revalidate: 86400 },
  })
    .then((res) => (res.ok ? res.json() as Promise<PokemonFromAPI> : null))
    .catch(() => null);
  if (byId?.id != null && byId?.species?.url) return byId;
  const name = KANTO_ID_TO_NAME[id];
  if (!name) return byId;
  const byName = await fetch(`${POKEAPI_BASE}/pokemon/${encodeURIComponent(name)}`, {
    next: { revalidate: 86400 },
  })
    .then((res) => (res.ok ? res.json() as Promise<PokemonFromAPI> : null))
    .catch(() => null);
  return byName ?? byId;
}

const STAT_NAMES = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"] as const;

export type PokemonFromAPI = {
  id: number;
  name: string;
  base_experience: number | null;
  height: number;
  weight: number;
  abilities?: Array<{
    ability: { name: string; url: string };
    is_hidden: boolean;
    slot: number;
  }>;
  sprites: {
    front_default: string | null;
    front_female?: string | null;
    front_shiny?: string | null;
    front_shiny_female?: string | null;
    back_default?: string | null;
    back_female?: string | null;
    back_shiny?: string | null;
    back_shiny_female?: string | null;
  };
  species: { name: string; url: string };
  types: Array<{ slot: number; type: { name: string; url: string } }>;
  stats: Array<{
    base_stat: number;
    effort: number;
    stat: { name: string; url: string };
  }>;
  cries?: { latest: string; legacy: string };
  game_indices?: Array<{ game_index: number; version: { name: string; url: string } }>;
  moves?: Array<{
    move: { name: string; url: string };
    version_group_details: Array<{
      move_learn_method: { name: string };
      version_group: { name: string };
      level_learned_at: number;
    }>;
  }>;
};

export type SpeciesFromAPI = {
  name: string;
  base_happiness: number | null;
  capture_rate: number | null;
  growth_rate: { name: string };
  evolution_chain?: { url: string };
  evolves_from_species?: { name: string; url: string } | null;
  names?: Array<{ name: string; language: { name: string } }>;
  genera?: Array<{ genus: string; language: { name: string } }>;
  flavor_text_entries?: Array<{
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }>;
};

export type BaseStats = {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  bst: number;
};

/** Level 100, 31 IV, 252 EV, beneficial nature (1.1) for non-HP. */
function calcMaxStat(base: number, isHp: boolean): number {
  if (isHp) return 2 * base + 31 + 63 + 100 + 10; // 2*B + 204
  return Math.floor((2 * base + 31 + 63 + 5) * 1.1);
}

/** Level 100, 0 IV, 0 EV, hindering nature (0.9) for non-HP. */
function calcMinStat(base: number, isHp: boolean): number {
  if (isHp) return 2 * base + 0 + 0 + 100 + 10; // 2*B + 110
  return Math.floor((2 * base + 0 + 5) * 0.9);
}

export type PokemonRow = {
  id: number;
  name: string;
  spriteUrl: string | null;
  spriteUrlShiny: string | null;
  spriteUrlFemale: string | null;
  spriteUrlShinyFemale: string | null;
  spriteUrlBack: string | null;
  spriteUrlBackShiny: string | null;
  spriteUrlBackFemale: string | null;
  spriteUrlBackShinyFemale: string | null;
  cryUrl: string | null;
  types: string[];
  baseStats: BaseStats;
  maxStats: BaseStats;
  minStats: BaseStats;
  baseExperience: number | null;
  height: number;
  weight: number;
  evYield: string;
  baseFriendship: number | null;
  catchRate: number | null;
  growthRate: string;
  availability: string;
  /** Pre-evolution species name (for tooltips: Lv., stones, Trade Evo). */
  evolvesFromSpeciesName: string | null;
  /** Species genus (e.g. "Seed Pokémon"). */
  speciesGenus: string;
  /** Localized display names keyed by PokeAPI language code. */
  localizedNames: Record<string, string>;
  /** Localized genera keyed by PokeAPI language code. */
  localizedGenera: Record<string, string>;
  /** Flavor text for FireRed (en). */
  flavorTextFireRed: string | null;
  /** Flavor text for LeafGreen (en). */
  flavorTextLeafGreen: string | null;
  localizedFlavorFireRed: Record<string, string>;
  localizedFlavorLeafGreen: Record<string, string>;
  /** Abilities: name and whether hidden. */
  abilities: Array<{ name: string; isHidden: boolean }>;
  /** Move tab ids for FireRed/LeafGreen (level-up, tm-hm, breeding, tutor, special). Only methods that have ≥1 move. */
  moveTabIds: string[];
  /** Raw moves from API (for moves table: level-up, machine, egg, tutor, special). */
  moves: PokemonFromAPI["moves"];
  /** Encounter locations with version/method details (for detail page). */
  encounters: Array<{
    locationAreaName: string;
    versionDetails: Array<{
      versionName: string;
      encounterDetails: Array<{ methodName: string; minLevel: number; maxLevel: number }>;
    }>;
  }>;
};

const STAT_TO_LABEL: Record<string, string> = {
  hp: "HP",
  attack: "Atk",
  "special-attack": "Sp. Atk",
  defense: "Def",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

function buildEvYield(stats: PokemonFromAPI["stats"]): string {
  const parts = stats
    .filter((s) => s.effort > 0)
    .map((s) => `${s.effort} ${STAT_TO_LABEL[s.stat.name] ?? s.stat.name}`);
  return parts.length ? parts.join(", ") : "—";
}

function getGenusEn(species: SpeciesFromAPI | undefined): string {
  const entry = species?.genera?.find((g) => g.language.name === "en");
  return entry?.genus ?? "—";
}

function cleanFlavorText(text: string): string {
  return text.replace(/\f/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

function getFlavorTextEn(
  species: SpeciesFromAPI | undefined,
  version: "firered" | "leafgreen"
): string | null {
  const entry = species?.flavor_text_entries?.find(
    (e) => e.language.name === "en" && e.version.name === version
  );
  if (!entry?.flavor_text) return null;
  return cleanFlavorText(entry.flavor_text);
}

function mapLocalizedNames(
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

function mapLocalizedGenera(
  entries: Array<{ genus?: string; language?: { name?: string } }> | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of entries ?? []) {
    const lang = entry.language?.name;
    const value = entry.genus?.trim();
    if (lang && value) result[lang] = value;
  }
  return result;
}

function mapLocalizedFlavor(
  entries: SpeciesFromAPI["flavor_text_entries"],
  version: "firered" | "leafgreen"
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of entries ?? []) {
    if (entry.version?.name !== version || !entry.flavor_text) continue;
    const lang = entry.language?.name;
    if (!lang || result[lang]) continue;
    result[lang] = cleanFlavorText(entry.flavor_text);
  }
  return result;
}

/** Encounter API response shape (for mapping to PokemonRow.encounters). */
type EncounterApiEntry = {
  location_area?: { name?: string };
  version_details?: Array<{
    version?: { name?: string };
    encounter_details?: Array<{
      method?: { name?: string };
      min_level?: number;
      max_level?: number;
    }>;
  }>;
};

function buildEncountersList(entries: EncounterApiEntry[]): PokemonRow["encounters"] {
  return entries.map((area) => ({
    locationAreaName: area.location_area?.name ?? "—",
    versionDetails: (area.version_details ?? []).map((vd) => ({
      versionName: vd.version?.name ?? "—",
      encounterDetails: (vd.encounter_details ?? []).map((ed) => ({
        methodName: ed.method?.name ?? "—",
        minLevel: ed.min_level ?? 0,
        maxLevel: ed.max_level ?? 0,
      })),
    })),
  }));
}

const FR_LG_VERSION_GROUP = "firered-leafgreen";
const MOVE_TAB_ORDER = ["level-up", "tm-hm", "breeding", "tutor", "special"] as const;

function apiMethodToTabId(methodName: string): string {
  switch (methodName) {
    case "level-up":
      return "level-up";
    case "machine":
      return "tm-hm";
    case "egg":
      return "breeding";
    case "tutor":
      return "tutor";
    default:
      return "special";
  }
}

function buildMoveTabIds(moves: PokemonFromAPI["moves"]): string[] {
  const seen = new Set<string>();
  for (const entry of moves ?? []) {
    for (const vg of entry.version_group_details ?? []) {
      if (vg.version_group?.name !== FR_LG_VERSION_GROUP) continue;
      const tabId = apiMethodToTabId(vg.move_learn_method?.name ?? "");
      seen.add(tabId);
    }
  }
  return MOVE_TAB_ORDER.filter((id) => seen.has(id));
}

import {
  buildAvailability,
  getTradeEvolvedSpeciesFromChain,
  getStoneEvolvedSpeciesFromChain,
  getLevelEvolvedSpeciesFromChain,
  FR_ONLY_LABEL,
  LG_ONLY_LABEL,
  type EncounterEntry,
  type EvolutionChainNode,
} from "./api-adjustments";

async function fetchKantoNames(): Promise<Map<number, string>> {
  try {
    const res = await fetch(`${POKEAPI_BASE}/pokemon?limit=${KANTO_DEX_LIMIT}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error("List API not ok");
    const data = (await res.json()) as { results?: Array<{ name: string; url: string }> };
    const map = new Map<number, string>();
    (data.results ?? []).forEach((r, i) => {
      const id = i + 1;
      if (id <= KANTO_DEX_LIMIT) map.set(id, r.name);
    });
    for (let id = 1; id <= KANTO_DEX_LIMIT; id++) {
      if (!map.has(id) && KANTO_FALLBACK_NAMES[id]) map.set(id, KANTO_FALLBACK_NAMES[id]!);
    }
    return map;
  } catch {
    return new Map(Object.entries(KANTO_FALLBACK_NAMES).map(([k, v]) => [Number(k), v]));
  }
}

async function fetchPokemonByName(name: string): Promise<PokemonFromAPI | null> {
  const res = await fetch(`${POKEAPI_BASE}/pokemon/${encodeURIComponent(name)}`, {
    next: { revalidate: 86400 },
  }).catch(() => null);
  if (!res?.ok) return null;
  const p = (await res.json().catch(() => null)) as PokemonFromAPI | null;
  return p?.species?.url ? p : null;
}

const STAT_NAMES_FOR_MINIMAL = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"] as const;
const MINIMAL_TYPES: Record<number, [string, string?]> = {
  143: ["normal", undefined],
  144: ["ice", "flying"],
  145: ["electric", "flying"],
  146: ["fire", "flying"],
  150: ["psychic", undefined],
};
const MINIMAL_STATS: Record<number, number[]> = {
  143: [160, 65, 110, 65, 65, 30],
  144: [90, 85, 100, 95, 125, 85],
  145: [90, 90, 85, 125, 90, 100],
  146: [90, 100, 90, 125, 85, 90],
  150: [106, 110, 90, 154, 90, 130],
};
/** EV yield by id: index 0=hp, 1=attack, 2=defense, 3=special-attack, 4=special-defense, 5=speed. */
const MINIMAL_EFFORT: Record<number, number[]> = {
  143: [2, 0, 0, 0, 0, 0],       // Snorlax: 2 HP
  144: [0, 0, 0, 0, 3, 0],       // Articuno: 3 Sp. Def
  145: [0, 0, 0, 3, 0, 0],       // Zapdos: 3 Sp. Atk
  146: [0, 0, 0, 0, 3, 0],       // Moltres: 3 Sp. Def
  150: [0, 0, 0, 3, 0, 0],       // Mewtwo: 3 Sp. Atk
};

/** Minimal API shape for a slot when fetch fails. Uses cache (143–146, 150) or generic name/stats so dex always has 151. */
function getMinimalPokemonFromAPI(id: number, nameFallback: string): PokemonFromAPI {
  const name = KANTO_ID_TO_NAME[id] ?? nameFallback;
  const speciesUrl = `${POKEAPI_BASE}/pokemon-species/${id}/`;
  const types = MINIMAL_TYPES[id] ?? (["normal", undefined] as [string, string?]);
  const statsArr = MINIMAL_STATS[id] ?? [50, 50, 50, 50, 50, 50];
  const effortArr = MINIMAL_EFFORT[id] ?? [0, 0, 0, 0, 0, 0];
  return {
    id,
    name,
    base_experience: null,
    height: 0,
    weight: 0,
    species: { name, url: speciesUrl },
    types: types.filter(Boolean).map((t, slot) => ({ slot, type: { name: t!, url: "" } })),
    stats: statsArr.map((base_stat, i) => ({
      base_stat,
      effort: effortArr[i] ?? 0,
      stat: { name: STAT_NAMES_FOR_MINIMAL[i]!, url: "" },
    })),
    sprites: {
      front_default: null,
      front_female: null,
      front_shiny: null,
      front_shiny_female: null,
      back_default: null,
      back_female: null,
      back_shiny: null,
      back_shiny_female: null,
    },
    moves: [],
    abilities: [],
  };
}

/** IDs that often fail on PokeAPI by ID; pre-filled with minimal so they always appear. */
const FALLBACK_IDS = [143, 144, 145, 146, 150] as const;

export async function fetchKantoPokemon(): Promise<PokemonRow[]> {
  const ids = Array.from({ length: KANTO_DEX_LIMIT }, (_, i) => i + 1);
  const idToName = await fetchKantoNames();
  const pokemonListRaw = await Promise.all(ids.map((id) => fetchPokemonByIdOrName(id)));
  const pokemonList: (PokemonFromAPI | null)[] = [...pokemonListRaw];

  for (const id of FALLBACK_IDS) {
    if (!pokemonList[id - 1]?.species?.url) {
      const name = KANTO_ID_TO_NAME[id] ?? KANTO_FALLBACK_NAMES[id] ?? "unknown";
      pokemonList[id - 1] = getMinimalPokemonFromAPI(id, name);
    }
  }

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]!;
    if (pokemonList[i]?.species?.url) continue;
    const name = idToName.get(id) ?? KANTO_ID_TO_NAME[id];
    if (!name) continue;
    const p = await fetchPokemonByName(name);
    if (p?.species?.url) pokemonList[i] = p;
  }

  const missingIds = ids.filter((_, i) => !pokemonList[i]?.species?.url);
  if (missingIds.length > 0) {
    const retryIds = missingIds.filter((id) => idToName.get(id) ?? KANTO_ID_TO_NAME[id]);
    for (const id of retryIds) {
      const name = idToName.get(id) ?? KANTO_ID_TO_NAME[id];
      if (!name) continue;
      const p = await fetchPokemonByName(name);
      if (p?.species?.url) pokemonList[id - 1] = p;
    }
  }

  const stillMissing = ids.filter((_, i) => !pokemonList[i]?.species?.url);
  if (stillMissing.length > 0) {
    for (const id of stillMissing) {
      const nameFallback = idToName.get(id) ?? KANTO_FALLBACK_NAMES[id] ?? "unknown";
      pokemonList[id - 1] = getMinimalPokemonFromAPI(id, nameFallback);
    }
    console.warn("[fetchKantoPokemon] Used cache/fallback for:", stillMissing.join(", "));
  }

  const list = pokemonList as PokemonFromAPI[];
  const speciesUrls = list.map((p) => p.species!.url);
  const speciesList = await Promise.all(
    speciesUrls.map((url) =>
      fetch(url, { next: { revalidate: 86400 } })
        .then((res) => (res.ok ? (res.json() as Promise<SpeciesFromAPI>) : null))
        .catch(() => null)
    )
  );

  const encounterList = await Promise.all(
    ids.map((id) =>
      fetch(`${POKEAPI_BASE}/pokemon/${id}/encounters`, {
        next: { revalidate: 86400 },
      })
        .then((res) => (res.ok ? (res.json() as Promise<EncounterEntry[]>) : []))
        .catch(() => [] as EncounterEntry[])
    )
  );

  const chainUrls = [...new Set(speciesList.map((s) => s?.evolution_chain?.url).filter(Boolean))] as string[];
  const chainList = await Promise.all(
    chainUrls.map((url) =>
      fetch(url, { next: { revalidate: 86400 } }).then(
        (res) => res.json() as Promise<{ chain: EvolutionChainNode }>
      )
    )
  );
  const tradeEvolvedSpecies = new Set<string>();
  const stoneEvolvedSpecies = new Map<string, string>();
  const levelEvolvedSpecies = new Map<string, number>();
  for (const { chain } of chainList) {
    getTradeEvolvedSpeciesFromChain(chain, tradeEvolvedSpecies);
    getStoneEvolvedSpeciesFromChain(chain, stoneEvolvedSpecies);
    getLevelEvolvedSpeciesFromChain(chain, levelEvolvedSpecies);
  }

  const speciesExclusivity = new Map<string, string>();
  for (let i = 0; i < list.length; i++) {
    const p = list[i]!;
    const encounters = encounterList[p.id - 1] ?? [];
    const versions = new Set<string>();
    for (const area of encounters) {
      for (const vd of area.version_details ?? []) {
        const v = vd.version?.name?.toLowerCase();
        if (v === "firered" || v === "leafgreen") versions.add(v);
      }
    }
    if (versions.size === 1) {
      const speciesName = speciesList[i]?.name;
      if (speciesName) {
        speciesExclusivity.set(
          speciesName.toLowerCase(),
          versions.has("firered") ? FR_ONLY_LABEL : LG_ONLY_LABEL
        );
      }
    }
  }

  return list.map((p, i) => {
    const species = speciesList[i];
    const getStat = (name: string) =>
      p.stats.find((s) => s.stat.name === name)?.base_stat ?? 0;
    const hp = getStat("hp");
    const attack = getStat("attack");
    const defense = getStat("defense");
    const specialAttack = getStat("special-attack");
    const specialDefense = getStat("special-defense");
    const speed = getStat("speed");
    const base = { hp, attack, defense, specialAttack, specialDefense, speed };
    const bst = hp + attack + defense + specialAttack + specialDefense + speed;

    const maxStats: BaseStats = {
      hp: calcMaxStat(hp, true),
      attack: calcMaxStat(attack, false),
      defense: calcMaxStat(defense, false),
      specialAttack: calcMaxStat(specialAttack, false),
      specialDefense: calcMaxStat(specialDefense, false),
      speed: calcMaxStat(speed, false),
      bst: 0,
    };
    maxStats.bst =
      maxStats.hp +
      maxStats.attack +
      maxStats.defense +
      maxStats.specialAttack +
      maxStats.specialDefense +
      maxStats.speed;

    const minStats: BaseStats = {
      hp: calcMinStat(hp, true),
      attack: calcMinStat(attack, false),
      defense: calcMinStat(defense, false),
      specialAttack: calcMinStat(specialAttack, false),
      specialDefense: calcMinStat(specialDefense, false),
      speed: calcMinStat(speed, false),
      bst: 0,
    };
    minStats.bst =
      minStats.hp +
      minStats.attack +
      minStats.defense +
      minStats.specialAttack +
      minStats.specialDefense +
      minStats.speed;

    const sp = p.sprites;
    return {
      id: p.id,
      name: p.name,
      spriteUrl: sp.front_default ?? null,
      spriteUrlShiny: sp.front_shiny ?? null,
      spriteUrlFemale: sp.front_female ?? null,
      spriteUrlShinyFemale: sp.front_shiny_female ?? null,
      spriteUrlBack: sp.back_default ?? null,
      spriteUrlBackShiny: sp.back_shiny ?? null,
      spriteUrlBackFemale: sp.back_female ?? null,
      spriteUrlBackShinyFemale: sp.back_shiny_female ?? null,
      cryUrl: p.cries?.latest ?? null,
      types: p.types.map((t) => t.type.name),
      abilities: (p.abilities ?? []).map((a) => ({
        name: a.ability.name,
        isHidden: a.is_hidden,
      })),
      moveTabIds: buildMoveTabIds(p.moves),
      moves: p.moves ?? [],
      encounters: buildEncountersList((encounterList[p.id - 1] ?? []) as EncounterApiEntry[]),
      baseStats: { ...base, bst },
      maxStats,
      minStats,
      baseExperience: p.base_experience ?? null,
      height: p.height,
      weight: p.weight,
      evYield: buildEvYield(p.stats),
      baseFriendship: species?.base_happiness ?? null,
      catchRate: species?.capture_rate ?? null,
      growthRate: species?.growth_rate?.name ?? "—",
      availability: buildAvailability({
      pokemonId: p.id,
      encounters: encounterList[p.id - 1] ?? [],
      speciesName: species?.name ?? p.name,
      tradeEvolvedSpecies,
      stoneEvolvedSpecies,
      levelEvolvedSpecies,
      speciesExclusivity,
      evolvesFromSpeciesName: species?.evolves_from_species?.name ?? null,
    }),
      evolvesFromSpeciesName: species?.evolves_from_species?.name ?? null,
      speciesGenus: getGenusEn(species ?? undefined),
      localizedNames: mapLocalizedNames(species?.names),
      localizedGenera: mapLocalizedGenera(species?.genera),
      flavorTextFireRed: getFlavorTextEn(species ?? undefined, "firered"),
      flavorTextLeafGreen: getFlavorTextEn(species ?? undefined, "leafgreen"),
      localizedFlavorFireRed: mapLocalizedFlavor(species?.flavor_text_entries, "firered"),
      localizedFlavorLeafGreen: mapLocalizedFlavor(species?.flavor_text_entries, "leafgreen"),
    };
  });
}
