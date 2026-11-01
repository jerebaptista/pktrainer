"use client";

import { useLocale } from "next-intl";
import { getLocalizedPokemonName } from "@/lib/api-adjustments";

type NamedPokemon = {
  name: string;
  localizedNames?: Record<string, string>;
};

export function usePokemonName() {
  const locale = useLocale();

  return (pokemon: NamedPokemon | string) => {
    if (typeof pokemon === "string") {
      return getLocalizedPokemonName(pokemon, undefined, locale);
    }
    return getLocalizedPokemonName(pokemon.name, pokemon.localizedNames, locale);
  };
}
