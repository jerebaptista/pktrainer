import { fetchAllGameMovesTableData, mergeMovesTableDataToGlobal } from "@/lib/moves-table";
import { fetchKantoPokemon } from "@/lib/pokeapi";
import { MovesGlobalTable } from "./moves-global-table";

/** Cache da página por 24h; fetches nos libs usam next: { revalidate }. */
export const revalidate = 86400;

export const metadata = {
  title: "Moves – PKtrainer",
  description: "All moves in Pokémon FireRed & LeafGreen.",
};

export default async function MovesPage() {
  const [{ tableData, learnIndex }, pokemonList] = await Promise.all([
    fetchAllGameMovesTableData(),
    fetchKantoPokemon(),
  ]);
  const globalRows = mergeMovesTableDataToGlobal(tableData);

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Moves
        </h1>
        <p className="text-muted-foreground text-sm">
          FireRed &amp; LeafGreen — todos os moves do jogo
        </p>
      </header>

      <MovesGlobalTable rows={globalRows} learnIndex={learnIndex} pokemonList={pokemonList} />
    </div>
  );
}
