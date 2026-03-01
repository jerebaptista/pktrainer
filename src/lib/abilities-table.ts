const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const FR_LG_VERSION_GROUP = "firered-leafgreen";
const KANTO_DEX_LIMIT = 151;

type AbilityFromAPI = {
  id: number;
  name: string;
  is_main_series: boolean;
  generation?: { name: string };
  effect_entries?: Array<{
    effect?: string;
    short_effect?: string;
    language?: { name: string };
  }>;
  flavor_text_entries?: Array<{
    flavor_text?: string;
    language?: { name: string };
    version_group?: { name: string };
  }>;
  effect_changes?: unknown[];
  names?: Array<{ name: string; language: { name: string } }>;
  pokemon?: Array<{ is_hidden: boolean; pokemon: { name: string; url: string }; slot: number }>;
};

export type AbilityRow = {
  name: string;
  effect: string | null;
  description: string | null;
  /** Kanto 151 Pokémon IDs that have this ability (non-hidden). */
  pokemonWithAbility: number[];
  /** Kanto 151 Pokémon IDs that have this ability as hidden. */
  pokemonWithHiddenAbility: number[];
};

function getEffectEn(ability: AbilityFromAPI): string | null {
  const en = ability.effect_entries?.find((e) => e.language?.name === "en");
  return en?.short_effect ?? en?.effect ?? null;
}

function getFlavorEn(ability: AbilityFromAPI): string | null {
  const entries = ability.flavor_text_entries ?? [];
  const frLg = entries.find(
    (e) => e.language?.name === "en" && e.version_group?.name === FR_LG_VERSION_GROUP
  );
  if (frLg?.flavor_text) return frLg.flavor_text.replace(/\s+/g, " ").trim();
  const firstEn = entries.find((e) => e.language?.name === "en");
  return firstEn?.flavor_text?.replace(/\s+/g, " ").trim() ?? null;
}

function parsePokemonIdFromUrl(url: string): number | null {
  const match = /\/pokemon\/(\d+)\/?$/.exec(url);
  return match ? parseInt(match[1], 10) : null;
}

async function fetchAbilityByName(name: string): Promise<AbilityRow | null> {
  const res = await fetch(`${POKEAPI_BASE}/ability/${encodeURIComponent(name)}`, {
    next: { revalidate: 86400 },
  }).catch(() => null);
  if (!res?.ok) return null;
  const data = (await res.json().catch(() => null)) as AbilityFromAPI | null;
  if (!data?.name) return null;
  const pokemonWithAbility: number[] = [];
  const pokemonWithHiddenAbility: number[] = [];
  for (const entry of data.pokemon ?? []) {
    const id = parsePokemonIdFromUrl(entry.pokemon?.url ?? "");
    if (id == null || id < 1 || id > KANTO_DEX_LIMIT) continue;
    if (entry.is_hidden) pokemonWithHiddenAbility.push(id);
    else pokemonWithAbility.push(id);
  }
  pokemonWithAbility.sort((a, b) => a - b);
  pokemonWithHiddenAbility.sort((a, b) => a - b);
  return {
    name: data.name.replace(/-/g, " "),
    effect: getEffectEn(data),
    description: getFlavorEn(data),
    pokemonWithAbility,
    pokemonWithHiddenAbility,
  };
}

/**
 * Fetch all abilities that appear in the Kanto 151 Pokémon.
 * Uses the list of ability names from the given Pokémon rows (e.g. from fetchKantoPokemon).
 */
export async function fetchKantoAbilities(
  kantoPokemon: Array<{ abilities: Array<{ name: string }> }>
): Promise<AbilityRow[]> {
  const names = new Set<string>();
  for (const p of kantoPokemon) {
    for (const a of p.abilities ?? []) names.add(a.name);
  }
  const results = await Promise.all(
    Array.from(names).map((name) => fetchAbilityByName(name))
  );
  const rows = results.filter((r): r is AbilityRow => r != null);
  rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return rows;
}
