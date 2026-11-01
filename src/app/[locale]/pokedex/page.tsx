import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { fetchKantoPokemon } from "@/lib/pokeapi";
import { PokedexTable } from "./pokedex-table";

/** Evita ISR com payload >19MB (151 Pokémon completos). Página renderizada sob demanda. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Metadata" });
  return {
    title: t("pokedexTitle"),
    description: t("pokedexDescription"),
  };
}

export default async function PokedexPage() {
  const pokemon = await fetchKantoPokemon();

  return (
    <div className="flex min-h-0 min-w-0 h-0 flex-1 flex-col overflow-hidden p-6 md:p-8">
      <PokedexTable data={pokemon} />
    </div>
  );
}
