import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { getRequestGame } from "@/lib/game-cookie";
import { fetchRegionalList } from "@/lib/pokeapi-game";
import { PokedexRegionalList } from "./pokedex-regional-list";

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
  const game = await getRequestGame();
  const data = await fetchRegionalList(game);

  return <PokedexRegionalList key={game.pokedex} data={data} />;
}
