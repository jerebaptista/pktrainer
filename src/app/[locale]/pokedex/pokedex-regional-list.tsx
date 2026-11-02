"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePokedexSearch } from "@/components/pokedex-search";
import { getLocalizedPokemonName } from "@/lib/api-adjustments";
import { listSpriteFallback, type RegionalListEntry } from "@/lib/pokeapi-game";
import { formatApiName } from "@/lib/utils";
import { useLocale } from "next-intl";

export function PokedexRegionalList({ data }: { data: RegionalListEntry[] }) {
  const t = useTranslations("Pokedex");
  const locale = useLocale();
  const { query } = usePokedexSearch();

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
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {filtered.map((pokemon) => {
              const name = getLocalizedPokemonName(pokemon.name, pokemon.localizedNames, locale);
              return (
                <Link
                  key={`${pokemon.id}-${pokemon.regionalNumber}`}
                  href={`/pokemon/${pokemon.id}`}
                  className="group rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="flex aspect-square items-center justify-center">
                    <Image
                      src={pokemon.spriteUrl}
                      alt={name}
                      width={96}
                      height={96}
                      className="size-20 object-contain pixelated"
                      unoptimized
                      onError={(event) => {
                        event.currentTarget.src = listSpriteFallback(pokemon.id);
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    #{String(pokemon.regionalNumber).padStart(3, "0")}
                  </p>
                  <p className="truncate text-sm font-medium">{name || formatApiName(pokemon.name)}</p>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}
