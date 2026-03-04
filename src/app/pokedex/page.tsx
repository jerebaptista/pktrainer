import { fetchKantoPokemon } from "@/lib/pokeapi";
import { PokedexTable } from "./pokedex-table";

/** Cache da página por 24h; fetches internos já usam next: { revalidate } no pokeapi. */
export const revalidate = 86400;

export const metadata = {
  title: "Pokémon – PKtrainer",
};

export default async function PokedexPage() {
  const pokemon = await fetchKantoPokemon();

  return (
    <div className="flex min-h-0 min-w-0 h-0 flex-1 flex-col overflow-hidden p-6 md:p-8">
      <PokedexTable data={pokemon} />
    </div>
  );
}
