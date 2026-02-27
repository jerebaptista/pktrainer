import { fetchKantoPokemon } from "@/lib/pokeapi";
import { PokedexTable } from "./pokedex-table";

export const metadata = {
  title: "Pokémon – PKtrainer",
  description: "Pokédex for Pokémon FireRed & LeafGreen (Kanto).",
};

export default async function PokedexPage() {
  const pokemon = await fetchKantoPokemon();

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pokémon
        </h1>
        <p className="text-muted-foreground text-sm">
          FireRed &amp; LeafGreen — Kanto Pokédex ({pokemon.length})
        </p>
      </header>

      <PokedexTable data={pokemon} />
    </div>
  );
}
