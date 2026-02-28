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
  sprites: { front_default: string | null };
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

    return {
      id: p.id,
      name: p.name,
      spriteUrl: p.sprites.front_default ?? null,
      cryUrl: p.cries?.latest ?? null,
      types: p.types.map((t) => t.type.name),
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
    };
  });
}
