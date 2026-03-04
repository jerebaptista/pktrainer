import { fetchKantoPokemon } from "@/lib/pokeapi";
import { PokedexTable } from "./pokedex-table";

/** Always fetch fresh data so missing Pokémon (e.g. 143–146, 150) are filled after retry. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pokémon – PKtrainer",
};

export default async function PokedexPage() {
  const pokemon = await fetchKantoPokemon();

  return (
    <div className="flex min-h-0 min-w-0 h-0 flex-1 flex-col overflow-hidden p-6 md:p-8">
      <header className="shrink-0 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pokémon
        </h1>
      </header>

      <PokedexTable data={pokemon} />
    </div>
  );
}
