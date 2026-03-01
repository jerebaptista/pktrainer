import { fetchKantoAbilities } from "@/lib/abilities-table";
import { fetchKantoPokemon } from "@/lib/pokeapi";
import { AbilitiesTable } from "./abilities-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Abilities – PKtrainer",
  description: "Abilities present in the Kanto 151 Pokémon (FireRed & LeafGreen).",
};

export default async function AbilitiesPage() {
  const pokemonList = await fetchKantoPokemon();
  const rows = await fetchKantoAbilities(pokemonList);

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Abilities
        </h1>
        <p className="text-muted-foreground text-sm">
          FireRed &amp; LeafGreen — abilities dos 151 Pokémon de Kanto
        </p>
      </header>

      <AbilitiesTable rows={rows} pokemonList={pokemonList} />
    </div>
  );
}
