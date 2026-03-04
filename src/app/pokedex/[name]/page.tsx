import { notFound } from "next/navigation";
import { fetchKantoPokemon } from "@/lib/pokeapi";
import { fetchMovesTableData } from "@/lib/moves-table";
import { PokemonDetailView } from "./pokemon-detail-view";

/** Cache por 24h; dados vêm do cache de fetchKantoPokemon e fetchMovesTableData. */
export const revalidate = 86400;

export const metadata = {
  title: "Pokémon – PKtrainer",
  description: "Pokédex for Pokémon FireRed & LeafGreen (Kanto).",
};

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const slug = name.toLowerCase().trim();

  const all = await fetchKantoPokemon();
  const pokemon = all.find((p) => p.name.toLowerCase() === slug);
  if (!pokemon) notFound();

  const allNames = all.map((p) => p.name);
  const serialized = JSON.parse(JSON.stringify(pokemon)) as typeof pokemon;
  const movesTableData = await fetchMovesTableData(serialized.moves);

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <PokemonDetailView
        key={pokemon.name}
        pokemon={serialized}
        allNames={allNames}
        movesTableData={movesTableData}
      />
    </div>
  );
}
