import { notFound } from "next/navigation";
import { fetchKantoPokemon } from "@/lib/pokeapi";
import { fetchMovesTableData } from "@/lib/moves-table";
import { PokemonDetailView } from "./pokemon-detail-view";

/** Evita ISR com payload grande (dados completos do Pokémon + moves). */
export const dynamic = "force-dynamic";

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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8">
      <PokemonDetailView
        key={pokemon.name}
        pokemon={serialized}
        allNames={allNames}
        movesTableData={movesTableData}
      />
    </div>
  );
}
