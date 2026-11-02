"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { useGame } from "@/components/game-provider";
import { usePokedexSearch } from "@/components/pokedex-search";
import { getLocalizedPokemonName } from "@/lib/api-adjustments";
import { getGameMechanics } from "@/lib/games";
import { listSpriteFallback, type RegionalListEntry } from "@/lib/pokeapi-game";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import { cn, formatApiName } from "@/lib/utils";

export function PokedexRegionalList({ data }: { data: RegionalListEntry[] }) {
  const t = useTranslations("Pokedex");
  const tPokemon = useTranslations("Pokemon");
  const locale = useLocale();
  const { game } = useGame();
  const { query } = usePokedexSearch();
  const largeGen1Sprite = game.generation === 1;
  const showBaby = getGameMechanics(game.generation).baby;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((pokemon) => {
      const name = getLocalizedPokemonName(pokemon.name, pokemon.localizedNames, locale).toLowerCase();
      return (
        name.includes(q) ||
        pokemon.name.toLowerCase().includes(q) ||
        String(pokemon.regionalNumber).includes(q) ||
        String(pokemon.nationalNumber).padStart(4, "0").includes(q)
      );
    });
  }, [data, locale, query]);

  return (
    <div className="min-h-full">
      {filtered.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
            {filtered.map((pokemon) => {
              const name = getLocalizedPokemonName(pokemon.name, pokemon.localizedNames, locale);
              const flag = pokemon.isMythical
                ? tPokemon("mythical")
                : pokemon.isLegendary
                  ? tPokemon("legendary")
                  : showBaby && pokemon.isBaby
                    ? tPokemon("baby")
                    : null;
              return (
                <Link
                  key={`${pokemon.id}-${pokemon.regionalNumber}`}
                  href={`/pokemon/${pokemon.id}`}
                  className="group relative rounded-xl border border-border bg-card p-2 transition-colors hover:bg-accent/40"
                >
                  {flag ? (
                    <Badge variant="outline" className="absolute right-1.5 top-1.5 z-10 text-[10px]">
                      {flag}
                    </Badge>
                  ) : null}
                  <div
                    className={cn(
                      "mx-auto flex h-32 w-28 items-center justify-center",
                      largeGen1Sprite && "overflow-hidden",
                    )}
                  >
                    <Image
                      src={pokemon.spriteUrl}
                      alt={name}
                      width={largeGen1Sprite ? 128 : 80}
                      height={largeGen1Sprite ? 128 : 80}
                      className={cn(
                        "object-contain pixelated transition-transform duration-200 group-hover:-translate-y-1",
                        largeGen1Sprite ? "size-32 shrink-0 scale-125" : "size-20",
                      )}
                      unoptimized
                      onError={(event) => {
                        event.currentTarget.src = listSpriteFallback(pokemon.id);
                      }}
                    />
                  </div>
                  <p className="flex min-w-0 items-baseline gap-1.5 truncate text-sm">
                    <span className="shrink-0 font-medium text-muted-foreground">
                      #{String(pokemon.regionalNumber).padStart(3, "0")}
                    </span>
                    <span className="truncate font-semibold text-foreground">
                      {name || formatApiName(pokemon.name)}
                    </span>
                  </p>
                  {pokemon.types.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {pokemon.types.map((type) => (
                        <Badge
                          key={type}
                          className={cn("px-1.5 py-0 text-[10px] capitalize", getTypeBadgeClassName(type))}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}
