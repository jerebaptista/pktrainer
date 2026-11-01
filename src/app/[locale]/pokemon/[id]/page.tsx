import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { fetchKantoPokemon } from "@/lib/pokeapi";
import { fetchMovesTableData } from "@/lib/moves-table";
import { getLocalizedPokemonName } from "@/lib/api-adjustments";
import { PokemonDetailView } from "../../pokedex/[name]/pokemon-detail-view";

/** Evita ISR com payload grande (dados completos do Pokémon + moves). */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Metadata" });
  const all = await fetchKantoPokemon();
  const pokemon = findPokemon(all, id);
  const name = pokemon
    ? getLocalizedPokemonName(pokemon.name, pokemon.localizedNames, locale)
    : id;

  return {
    title: t("pokemonTitle", { name }),
    description: t("pokedexDescription"),
  };
}

function findPokemon(
  all: Awaited<ReturnType<typeof fetchKantoPokemon>>,
  idOrName: string
) {
  const slug = idOrName.toLowerCase().trim();
  const numericId = Number(slug);
  if (Number.isInteger(numericId) && numericId > 0) {
    return all.find((p) => p.id === numericId) ?? all.find((p) => p.name.toLowerCase() === slug);
  }
  return all.find((p) => p.name.toLowerCase() === slug);
}

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const all = await fetchKantoPokemon();
  const pokemon = findPokemon(all, id);
  if (!pokemon) notFound();

  const allPokemon = all.map((p) => ({ name: p.name, id: p.id }));
  const serialized = JSON.parse(JSON.stringify(pokemon)) as typeof pokemon;
  const movesTableData = await fetchMovesTableData(serialized.moves);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8">
      <PokemonDetailView
        key={pokemon.name}
        pokemon={serialized}
        allPokemon={allPokemon}
        movesTableData={movesTableData}
      />
    </div>
  );
}
