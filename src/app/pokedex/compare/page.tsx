import { notFound } from "next/navigation";
import { fetchKantoPokemon } from "@/lib/pokeapi";
import type { PokemonRow } from "@/lib/pokeapi";
import { fetchMovesTableData, type MovesTableData } from "@/lib/moves-table";
import { CompareView } from "./compare-view";

export const revalidate = 86400;

export const metadata = {
  title: "Compare Pokémon – PKtrainer",
  description: "Compare up to 6 Pokémon side by side.",
};

const MAX_COMPARE = 6;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const rawIds = idsParam?.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 151) ?? [];
  const ids = rawIds.slice(0, MAX_COMPARE);
  if (ids.length === 0) notFound();

  const all = await fetchKantoPokemon();
  const pokemonList = ids
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is PokemonRow => p != null);
  if (pokemonList.length === 0) notFound();

  const movesDataList: MovesTableData[] = await Promise.all(
    pokemonList.map((p) => fetchMovesTableData(JSON.parse(JSON.stringify(p)).moves))
  );

  const serialized = pokemonList.map((p) => JSON.parse(JSON.stringify(p)) as PokemonRow);

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <CompareView pokemonList={serialized} movesDataList={movesDataList} />
    </div>
  );
}
