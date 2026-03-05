"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { getPokemonDisplayName } from "@/lib/api-adjustments";
import type { AbilityRow } from "@/lib/abilities-table";
import type { PokemonListItem } from "./abilities-table";

type AbilityDrawerContentProps = {
  ability: AbilityRow;
  pokemonList: PokemonListItem[];
};

function formatAbilityName(name: string): string {
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AbilityDrawerContent({ ability, pokemonList }: AbilityDrawerContentProps) {
  const title = formatAbilityName(ability.name);
  const withAbility = ability.pokemonWithAbility
    .map((id) => pokemonList.find((p) => p.id === id))
    .filter((p): p is PokemonListItem => p != null);
  const withHidden = ability.pokemonWithHiddenAbility
    .map((id) => pokemonList.find((p) => p.id === id))
    .filter((p): p is PokemonListItem => p != null);

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-xl font-semibold">{title}</h2>
        {ability.description != null && (
          <p className="text-muted-foreground text-sm">{ability.description}</p>
        )}
        {ability.effect != null && (
          <p className="text-foreground text-sm">{ability.effect}</p>
        )}
      </div>

      {withAbility.length > 0 && (
        <section>
          <h3 className="text-foreground mb-2 text-base font-semibold">
            Pokemon with {title}
          </h3>
          <div className="overflow-x-auto rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="text-foreground w-14 font-normal">Id</TableHead>
                  <TableHead className="text-foreground font-normal">Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withAbility.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="py-1">
                      <Avatar className="size-8 overflow-hidden rounded-full border border-border bg-muted">
                        {p.spriteUrl ? (
                          <AvatarImage
                            src={p.spriteUrl}
                            alt={getPokemonDisplayName(p.name)}
                            className="object-contain"
                          />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {getPokemonDisplayName(p.name).slice(0, 2)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-muted-foreground py-1 text-sm">
                      #{String(p.id).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="py-1">
                      <Link
                        href={`/pokedex/${p.name}`}
                        className="text-foreground font-medium hover:underline"
                      >
                        {getPokemonDisplayName(p.name)}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {withHidden.length > 0 && (
        <section>
          <h3 className="text-foreground mb-2 text-base font-semibold">
            {title} as hidden ability
          </h3>
          <div className="overflow-x-auto rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="text-foreground w-14 font-normal">Id</TableHead>
                  <TableHead className="text-foreground font-normal">Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withHidden.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="py-1">
                      <Avatar className="size-8 overflow-hidden rounded-full border border-border bg-muted">
                        {p.spriteUrl ? (
                          <AvatarImage
                            src={p.spriteUrl}
                            alt={getPokemonDisplayName(p.name)}
                            className="object-contain"
                          />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {getPokemonDisplayName(p.name).slice(0, 2)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-muted-foreground py-1 text-sm">
                      #{String(p.id).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="py-1">
                      <Link
                        href={`/pokedex/${p.name}`}
                        className="text-foreground font-medium hover:underline"
                      >
                        {getPokemonDisplayName(p.name)}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
