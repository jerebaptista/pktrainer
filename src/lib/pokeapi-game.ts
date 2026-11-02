import { pickLocalizedName, mapLocalizedEntries, toPokeApiLanguage } from "@/lib/locale";
import { formatApiName } from "@/lib/utils";
import {
  type GameDef,
  gameSpriteUrl,
  getGameMechanics,
  modernSpriteUrl,
  versionGroupOrder,
} from "@/lib/games";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

async function pokeFetch<T>(path: string): Promise<T | null> {
  const res = await fetch(`${POKEAPI_BASE}${path}`, { next: { revalidate: 86400 } }).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json().catch(() => null)) as T | null;
}

export type RegionalListEntry = {
  id: number;
  name: string;
  regionalNumber: number;
  nationalNumber: number;
  localizedNames: Record<string, string>;
  spriteUrl: string;
};

type PokedexApi = {
  pokemon_entries?: Array<{
    entry_number: number;
    pokemon_species?: { name?: string; url?: string };
  }>;
};

type SpeciesApi = {
  id?: number;
  name?: string;
  names?: Array<{ name?: string; language?: { name?: string } }>;
  genera?: Array<{ genus?: string; language?: { name?: string } }>;
  flavor_text_entries?: Array<{
    flavor_text?: string;
    language?: { name?: string };
    version?: { name?: string };
  }>;
  pokedex_numbers?: Array<{ entry_number?: number; pokedex?: { name?: string } }>;
  capture_rate?: number | null;
  base_happiness?: number | null;
  growth_rate?: { name?: string };
  egg_groups?: Array<{ name?: string }>;
  gender_rate?: number;
  hatch_counter?: number | null;
  is_baby?: boolean;
  is_legendary?: boolean;
  is_mythical?: boolean;
  evolution_chain?: { url?: string };
};

type PokemonApi = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  cries?: { latest?: string; legacy?: string };
  types?: Array<{ slot: number; type: { name: string } }>;
  past_types?: Array<{
    generation?: { name?: string };
    types?: Array<{ slot: number; type: { name: string } }>;
  }>;
  abilities?: Array<{ ability: { name: string }; is_hidden: boolean; slot: number }>;
  past_abilities?: Array<{
    generation?: { name?: string };
    abilities?: Array<{ ability?: { name?: string } | null; is_hidden?: boolean; slot?: number }>;
  }>;
  stats?: Array<{ base_stat: number; effort: number; stat: { name: string } }>;
  sprites?: {
    front_default?: string | null;
    front_shiny?: string | null;
    front_female?: string | null;
    front_shiny_female?: string | null;
    back_default?: string | null;
    back_shiny?: string | null;
    back_female?: string | null;
    back_shiny_female?: string | null;
    versions?: Record<string, Record<string, Record<string, string | null | undefined>>>;
  };
  moves?: Array<{
    move: { name: string; url: string };
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: { name: string };
      version_group: { name: string };
    }>;
  }>;
};

type EncounterApi = Array<{
  location_area?: { name?: string };
  version_details?: Array<{
    version?: { name?: string };
    encounter_details?: Array<{
      method?: { name?: string };
      min_level?: number;
      max_level?: number;
    }>;
  }>;
}>;

type MoveApi = {
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  type?: { name?: string };
  damage_class?: { name?: string };
  names?: Array<{ name?: string; language?: { name?: string } }>;
  past_values?: Array<{
    power?: number | null;
    accuracy?: number | null;
    pp?: number | null;
    type?: { name?: string } | null;
    version_group?: { name?: string };
  }>;
};

type EvolutionNode = {
  species?: { name?: string; url?: string };
  evolution_details?: Array<{
    min_level?: number | null;
    trigger?: { name?: string };
    item?: { name?: string } | null;
  }>;
  evolves_to?: EvolutionNode[];
};

function speciesIdFromUrl(url?: string): number | null {
  const match = url?.match(/\/pokemon-species\/(\d+)\//);
  return match ? Number(match[1]) : null;
}

function generationNumber(name?: string): number {
  const map: Record<string, number> = {
    "generation-i": 1,
    "generation-ii": 2,
    "generation-iii": 3,
    "generation-iv": 4,
    "generation-v": 5,
    "generation-vi": 6,
    "generation-vii": 7,
    "generation-viii": 8,
    "generation-ix": 9,
  };
  return name ? (map[name] ?? 99) : 99;
}

export function resolveTypes(pokemon: PokemonApi, generation: number): string[] {
  const past = [...(pokemon.past_types ?? [])].sort(
    (a, b) => generationNumber(a.generation?.name) - generationNumber(b.generation?.name)
  );
  const match = past.find((entry) => generationNumber(entry.generation?.name) >= generation);
  const source = match?.types ?? pokemon.types ?? [];
  return source.map((entry) => entry.type.name);
}

export function resolveAbilities(pokemon: PokemonApi, generation: number) {
  const mechanics = getGameMechanics(generation);
  if (!mechanics.abilities) return [];

  const current = (pokemon.abilities ?? []).map((entry) => ({
    name: entry.ability.name,
    isHidden: entry.is_hidden,
    slot: entry.slot,
  }));

  for (const past of pokemon.past_abilities ?? []) {
    if (generationNumber(past.generation?.name) < generation) continue;
    for (const ability of past.abilities ?? []) {
      const slot = ability.slot ?? 0;
      if (!ability.ability) {
        const index = current.findIndex((item) => item.slot === slot);
        if (index >= 0) current.splice(index, 1);
      }
    }
  }

  return current.filter((ability) => mechanics.hiddenAbility || !ability.isHidden);
}

function readSprite(versions: PokemonApi["sprites"], game: GameDef, key: string): string | null {
  const value = versions?.versions?.[game.spriteGen]?.[game.spriteVersion]?.[key];
  return typeof value === "string" && value ? value : null;
}

export type GameSprites = {
  front: string | null;
  back: string | null;
  frontShiny: string | null;
  backShiny: string | null;
  frontFemale: string | null;
  backFemale: string | null;
  frontShinyFemale: string | null;
  backShinyFemale: string | null;
};

export function resolveSprites(pokemon: PokemonApi, game: GameDef): GameSprites {
  const sprites = pokemon.sprites;
  const fromVersion = (key: string, fallback: string | null | undefined) =>
    readSprite(sprites, game, key) ?? fallback ?? null;

  return {
    front: fromVersion("front_default", sprites?.front_default) ?? gameSpriteUrl(game, pokemon.id) ?? modernSpriteUrl(pokemon.id),
    back: fromVersion("back_default", sprites?.back_default),
    frontShiny: fromVersion("front_shiny", sprites?.front_shiny),
    backShiny: fromVersion("back_shiny", sprites?.back_shiny),
    frontFemale: fromVersion("front_female", sprites?.front_female),
    backFemale: fromVersion("back_female", sprites?.back_female),
    frontShinyFemale: fromVersion("front_shiny_female", sprites?.front_shiny_female),
    backShinyFemale: fromVersion("back_shiny_female", sprites?.back_shiny_female),
  };
}

export async function fetchRegionalList(game: GameDef): Promise<RegionalListEntry[]> {
  const dex = await pokeFetch<PokedexApi>(`/pokedex/${game.pokedex}`);
  const entries = dex?.pokemon_entries ?? [];

  return entries
    .map((entry) => {
      const id = speciesIdFromUrl(entry.pokemon_species?.url);
      const name = entry.pokemon_species?.name ?? "unknown";
      if (!id) return null;
      return {
        id,
        name,
        regionalNumber: entry.entry_number,
        nationalNumber: id,
        localizedNames: {},
        spriteUrl: gameSpriteUrl(game, id),
      };
    })
    .filter((entry): entry is RegionalListEntry => entry != null);
}

export type GameMove = {
  name: string;
  localizedName: string;
  method: "level-up" | "machine" | "egg" | "tutor" | "special";
  level: number;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  type: string;
  damageClass: string;
};

export type EvolutionLink = {
  id: number;
  name: string;
  localizedName: string;
  spriteUrl: string;
  condition: string;
};

export type PokemonGameDetail = {
  id: number;
  name: string;
  localizedNames: Record<string, string>;
  regionalNumber: number | null;
  nationalNumber: number;
  types: string[];
  genus: string;
  height: number;
  weight: number;
  flavorText: string | null;
  abilities: Array<{ name: string; isHidden: boolean }>;
  sprites: GameSprites;
  cryUrl: string | null;
  isBaby: boolean;
  isLegendary: boolean;
  isMythical: boolean;
  stats: Array<{ key: string; value: number }>;
  evYield: Array<{ key: string; value: number }>;
  catchRate: number | null;
  baseFriendship: number | null;
  baseExperience: number | null;
  growthRate: string | null;
  eggGroups: string[];
  genderRate: number;
  eggCycles: number | null;
  locations: Array<{ area: string; method: string; levels: string }>;
  moves: GameMove[];
  evolutions: EvolutionLink[];
  dexIds: number[];
};

function flavorForGame(species: SpeciesApi, gameId: string, locale: string): string | null {
  const lang = toPokeApiLanguage(locale);
  const entries = species.flavor_text_entries ?? [];
  const match =
    entries.find((entry) => entry.version?.name === gameId && entry.language?.name === lang) ??
    entries.find((entry) => entry.version?.name === gameId && entry.language?.name === "en");
  if (!match?.flavor_text) return null;
  return match.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

function methodId(name: string): GameMove["method"] {
  if (name === "level-up") return "level-up";
  if (name === "machine") return "machine";
  if (name === "egg") return "egg";
  if (name === "tutor") return "tutor";
  return "special";
}

function applyPastValues(move: MoveApi, versionGroup: string) {
  const gameOrder = versionGroupOrder(versionGroup);
  const pasts = (move.past_values ?? [])
    .map((entry) => ({ entry, order: versionGroupOrder(entry.version_group?.name) }))
    .filter((item) => item.order >= 0)
    .sort((a, b) => a.order - b.order);

  const exact = pasts.find((item) => item.entry.version_group?.name === versionGroup)?.entry;
  const later = pasts.find((item) => item.order >= gameOrder)?.entry;
  const past = exact ?? later;

  return {
    power: past?.power ?? move.power,
    accuracy: past?.accuracy ?? move.accuracy,
    pp: past?.pp ?? move.pp,
    type: past?.type?.name ?? move.type?.name ?? "normal",
  };
}

function flattenEvolution(node: EvolutionNode, acc: Array<{ id: number; name: string; condition: string }>, condition = "") {
  const id = speciesIdFromUrl(node.species?.url);
  const name = node.species?.name;
  if (id && name) acc.push({ id, name, condition });
  for (const next of node.evolves_to ?? []) {
    const detail = next.evolution_details?.[0];
    const parts = [
      detail?.min_level ? `Lv. ${detail.min_level}` : null,
      detail?.item?.name ? formatApiName(detail.item.name) : null,
      detail?.trigger?.name && detail.trigger.name !== "level-up" ? formatApiName(detail.trigger.name) : null,
    ].filter(Boolean);
    flattenEvolution(next, acc, parts.join(" · "));
  }
}

export async function fetchPokemonGameDetail(
  idOrName: string,
  game: GameDef,
  locale: string
): Promise<PokemonGameDetail | null> {
  const mechanics = getGameMechanics(game.generation);
  const pokemon = await pokeFetch<PokemonApi>(`/pokemon/${encodeURIComponent(idOrName)}`);
  if (!pokemon?.id) return null;
  const species = await pokeFetch<SpeciesApi>(`/pokemon-species/${pokemon.id}`);
  const encounters = (await pokeFetch<EncounterApi>(`/pokemon/${pokemon.id}/encounters`)) ?? [];

  const localizedNames = mapLocalizedEntries(species?.names);
  const genera = mapLocalizedEntries(
    species?.genera?.map((entry) => ({ name: entry.genus, language: entry.language }))
  );
  const national =
    species?.pokedex_numbers?.find((entry) => entry.pokedex?.name === "national")?.entry_number ?? pokemon.id;
  const regional =
    species?.pokedex_numbers?.find((entry) => entry.pokedex?.name === game.pokedex)?.entry_number ?? null;

  const statsSource = pokemon.stats ?? [];
  const statValue = (key: string) => statsSource.find((entry) => entry.stat.name === key)?.base_stat ?? 0;
  const stats = mechanics.specialSplit
    ? [
        { key: "hp", value: statValue("hp") },
        { key: "attack", value: statValue("attack") },
        { key: "defense", value: statValue("defense") },
        { key: "specialAttack", value: statValue("special-attack") },
        { key: "specialDefense", value: statValue("special-defense") },
        { key: "speed", value: statValue("speed") },
      ]
    : [
        { key: "hp", value: statValue("hp") },
        { key: "attack", value: statValue("attack") },
        { key: "defense", value: statValue("defense") },
        { key: "special", value: statValue("special-attack") },
        { key: "speed", value: statValue("speed") },
      ];

  const evYield = (pokemon.stats ?? [])
    .filter((entry) => entry.effort > 0)
    .map((entry) => ({ key: entry.stat.name, value: entry.effort }));

  const locations = encounters.flatMap((area) => {
    const version = area.version_details?.find((entry) => entry.version?.name === game.id);
    if (!version) return [];
    return (version.encounter_details ?? []).map((detail) => ({
      area: formatApiName(area.location_area?.name ?? "—"),
      method: formatApiName(detail.method?.name ?? "—"),
      levels:
        detail.min_level === detail.max_level
          ? `Lv. ${detail.min_level ?? "?"}`
          : `Lv. ${detail.min_level ?? "?"}-${detail.max_level ?? "?"}`,
    }));
  });

  const rawMoves = (pokemon.moves ?? [])
    .map((entry) => {
      const detail = entry.version_group_details.find((item) => item.version_group.name === game.versionGroup);
      if (!detail) return null;
      return {
        slug: entry.move.name,
        method: methodId(detail.move_learn_method.name),
        level: detail.level_learned_at,
      };
    })
    .filter((entry): entry is { slug: string; method: GameMove["method"]; level: number } => entry != null);

  const moveDetails = await Promise.all(rawMoves.map((entry) => pokeFetch<MoveApi>(`/move/${entry.slug}`)));
  const moves: GameMove[] = rawMoves.map((entry, index) => {
    const detail = moveDetails[index];
    const values = detail ? applyPastValues(detail, game.versionGroup) : { power: null, accuracy: null, pp: null, type: "normal" };
    return {
      name: entry.slug,
      localizedName: pickLocalizedName(mapLocalizedEntries(detail?.names), locale, formatApiName(entry.slug)),
      method: entry.method,
      level: entry.level,
      power: values.power,
      accuracy: values.accuracy,
      pp: values.pp,
      type: values.type,
      damageClass: detail?.damage_class?.name ?? "",
    };
  });

  const evolutions: EvolutionLink[] = [];
  const chainUrl = species?.evolution_chain?.url;
  if (chainUrl) {
    const chain = await fetch(chainUrl, { next: { revalidate: 86400 } })
      .then((res) => (res.ok ? (res.json() as Promise<{ chain?: EvolutionNode }>) : null))
      .catch(() => null);
    const flat: Array<{ id: number; name: string; condition: string }> = [];
    if (chain?.chain) flattenEvolution(chain.chain, flat);
    const allowed = new Set((await fetchRegionalList(game)).map((entry) => entry.id));
    for (const node of flat) {
      if (game.pokedex !== "national" && !allowed.has(node.id)) continue;
      evolutions.push({
        id: node.id,
        name: node.name,
        localizedName: formatApiName(node.name),
        spriteUrl: gameSpriteUrl(game, node.id),
        condition: node.condition,
      });
    }
  }

  const dexIds = (await fetchRegionalList(game)).map((entry) => entry.id);

  return {
    id: pokemon.id,
    name: pokemon.name,
    localizedNames,
    regionalNumber: regional,
    nationalNumber: national,
    types: resolveTypes(pokemon, game.generation),
    genus: pickLocalizedName(genera, locale, "—"),
    height: pokemon.height,
    weight: pokemon.weight,
    flavorText: flavorForGame(species ?? {}, game.id, locale),
    abilities: resolveAbilities(pokemon, game.generation),
    sprites: resolveSprites(pokemon, game),
    cryUrl: pokemon.cries?.latest ?? pokemon.cries?.legacy ?? null,
    isBaby: Boolean(species?.is_baby),
    isLegendary: Boolean(species?.is_legendary),
    isMythical: Boolean(species?.is_mythical),
    stats,
    evYield,
    catchRate: species?.capture_rate ?? null,
    baseFriendship: species?.base_happiness ?? null,
    baseExperience: pokemon.base_experience,
    growthRate: species?.growth_rate?.name ?? null,
    eggGroups: (species?.egg_groups ?? []).map((group) => group.name ?? ""),
    genderRate: species?.gender_rate ?? -1,
    eggCycles: species?.hatch_counter ?? null,
    locations,
    moves,
    evolutions,
    dexIds,
  };
}

export function listSpriteFallback(id: number): string {
  return `${SPRITE_BASE}/${id}.png`;
}
