const POKEAPI_BASE = "https://pokeapi.co/api/v2";

/** FireRed & LeafGreen use the Kanto Pokédex (151 Pokémon). */
const KANTO_DEX_LIMIT = 151;

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
};

export type SpeciesFromAPI = {
  name: string;
  base_happiness: number | null;
  capture_rate: number | null;
  growth_rate: { name: string };
  evolution_chain?: { url: string };
  evolves_from_species?: { name: string; url: string } | null;
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
  /** Flavor text for FireRed (en). */
  flavorTextFireRed: string | null;
  /** Flavor text for LeafGreen (en). */
  flavorTextLeafGreen: string | null;
  /** Abilities: name and whether hidden. */
  abilities: Array<{ name: string; isHidden: boolean }>;
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

function getFlavorTextEn(
  species: SpeciesFromAPI | undefined,
  version: "firered" | "leafgreen"
): string | null {
  const entry = species?.flavor_text_entries?.find(
    (e) => e.language.name === "en" && e.version.name === version
  );
  if (!entry?.flavor_text) return null;
  return entry.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
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

export async function fetchKantoPokemon(): Promise<PokemonRow[]> {
  const ids = Array.from({ length: KANTO_DEX_LIMIT }, (_, i) => i + 1);
  const pokemonList = await Promise.all(
    ids.map((id) =>
      fetch(`${POKEAPI_BASE}/pokemon/${id}`, {
        next: { revalidate: 3600 },
      }).then((res) => res.json() as Promise<PokemonFromAPI>)
    )
  );

  const speciesUrls = pokemonList.map((p) => p.species.url);
  const speciesList = await Promise.all(
    speciesUrls.map((url) =>
      fetch(url, { next: { revalidate: 3600 } }).then(
        (res) => res.json() as Promise<SpeciesFromAPI>
      )
    )
  );

  const encounterList = await Promise.all(
    ids.map((id) =>
      fetch(`${POKEAPI_BASE}/pokemon/${id}/encounters`, {
        next: { revalidate: 3600 },
      }).then((res) => res.json() as Promise<EncounterEntry[]>)
    )
  );

  const chainUrls = [...new Set(speciesList.map((s) => s?.evolution_chain?.url).filter(Boolean))] as string[];
  const chainList = await Promise.all(
    chainUrls.map((url) =>
      fetch(url, { next: { revalidate: 3600 } }).then(
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
  for (let i = 0; i < pokemonList.length; i++) {
    const encounters = encounterList[i] ?? [];
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

  return pokemonList.map((p, i) => {
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
      encounters: buildEncountersList((encounterList[i] ?? []) as EncounterApiEntry[]),
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
      encounters: encounterList[i] ?? [],
      speciesName: species?.name ?? p.name,
      tradeEvolvedSpecies,
      stoneEvolvedSpecies,
      levelEvolvedSpecies,
      speciesExclusivity,
      evolvesFromSpeciesName: species?.evolves_from_species?.name ?? null,
    }),
      evolvesFromSpeciesName: species?.evolves_from_species?.name ?? null,
      speciesGenus: getGenusEn(species),
      flavorTextFireRed: getFlavorTextEn(species, "firered"),
      flavorTextLeafGreen: getFlavorTextEn(species, "leafgreen"),
    };
  });
}
