"use client";

import { Fragment } from "react";
import { Separator } from "@/components/ui/separator";
import type { PokemonRow } from "@/lib/pokeapi";
import { getPokemonDisplayName } from "@/lib/api-adjustments";
import { PokemonInfoCard } from "./[name]/pokemon-info-card";

const COMPARE_SLOTS = 6;

type PokedexCompareViewProps = {
  selectedPokemon: PokemonRow[];
};

export function PokedexCompareView({ selectedPokemon }: PokedexCompareViewProps) {
  return (
    <div className="flex min-h-[60vh] min-w-0 flex-1 items-stretch gap-4">
      {Array.from({ length: COMPARE_SLOTS }, (_, i) => (
        <Fragment key={i}>
          {i > 0 && i < selectedPokemon.length && (
            <Separator
              orientation="vertical"
              className="min-h-[60vh] w-px shrink-0 self-stretch bg-border"
              decorative
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col overflow-auto">
            {selectedPokemon[i] ? (
              <>
                <div className="mb-2 shrink-0 text-center">
                  <span className="font-mono text-muted-foreground text-sm">
                    #{selectedPokemon[i].id}
                  </span>
                  <div className="font-semibold">
                    {getPokemonDisplayName(selectedPokemon[i].name)}
                  </div>
                </div>
                <PokemonInfoCard pokemon={selectedPokemon[i]} noCard />
              </>
            ) : (
              <div className="min-h-[200px]" aria-hidden />
            )}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
