import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import { getLocalizedPokemonName } from "@/lib/api-adjustments";
import { getRequestGame } from "@/lib/game-cookie";
import { getGameMechanics } from "@/lib/games";
import { fetchPokemonGameDetail, fetchRegionalList } from "@/lib/pokeapi-game";
import { PokemonGameView } from "./pokemon-game-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale: locale as AppLocale, namespace: "Metadata" });
  const game = await getRequestGame();
  const pokemon = await fetchPokemonGameDetail(id, game, locale);
  const name = pokemon
    ? getLocalizedPokemonName(pokemon.name, pokemon.localizedNames, locale)
    : id;

  return {
    title: t("pokemonTitle", { name }),
    description: t("pokedexDescription"),
  };
}

export default async function PokemonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const game = await getRequestGame();
  const pokemon = await fetchPokemonGameDetail(id, game, locale);
  if (!pokemon) notFound();

  const list = await fetchRegionalList(game);
  const index = list.findIndex((entry) => entry.id === pokemon.id);
  if (index < 0) {
    redirect({ href: "/pokedex", locale });
  }
  const prev = index > 0 ? list[index - 1] : null;
  const next = index < list.length - 1 ? list[index + 1] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 py-6 md:px-8 md:py-8">
      <PokemonGameView
        key={`${pokemon.id}-${game.id}`}
        pokemon={pokemon}
        mechanics={getGameMechanics(game.generation)}
        prev={prev}
        next={next}
      />
    </div>
  );
}
