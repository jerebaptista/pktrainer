import { fetchFrLgItems } from "@/lib/items-table";
import { ItemsTable } from "./items-table";

/** Cache da página por 24h; fetches no lib usam next: { revalidate }. */
export const revalidate = 86400;

export const metadata = {
  title: "Items – PKtrainer",
  description: "Items found in Pokémon FireRed & LeafGreen.",
};

export default async function ItemsPage() {
  const rows = await fetchFrLgItems();

  return (
    <div className="flex flex-1 flex-col p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Items
        </h1>
        <p className="text-muted-foreground text-sm">
          FireRed &amp; LeafGreen — itens encontrados no jogo
        </p>
      </header>

      <ItemsTable rows={rows} />
    </div>
  );
}
