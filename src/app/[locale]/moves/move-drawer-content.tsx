"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import { getPokemonDisplayName } from "@/lib/api-adjustments";
import type { GlobalMoveRow, MoveLearnIndex } from "@/lib/moves-table";
import type { PokemonListItem } from "./moves-global-table";

type LevelUpRow = PokemonListItem & { level: number };
type LevelUpSortKey = "id" | "name" | "level";
type BreedingSortKey = "id" | "name";

type MoveDrawerContentProps = {
  move: GlobalMoveRow;
  learnIndex: MoveLearnIndex;
  pokemonList: PokemonListItem[];
};

function moveNameApi(displayName: string): string {
  return displayName.replace(/\s/g, "-");
}

export function MoveDrawerContent({ move, learnIndex, pokemonList }: MoveDrawerContentProps) {
  const apiName = moveNameApi(move.moveName);
  const title = move.moveName.replace(/\b\w/g, (c) => c.toUpperCase());

  const levelUpEntries = learnIndex.levelUp.get(apiName) ?? [];
  const breedingIds = learnIndex.breeding.get(apiName) ?? [];
  const machineIds = learnIndex.machine.get(apiName) ?? [];
  const tutorLocs = learnIndex.tutor.get(apiName) ?? [];

  const levelUpFiltered: LevelUpRow[] = levelUpEntries
    .map(({ pokemonId, level }) => {
      const p = pokemonList.find((x) => x.id === pokemonId);
      return p ? { ...p, level } : null;
    })
    .filter((x): x is LevelUpRow => x != null);
  const breedingFiltered: PokemonListItem[] = breedingIds
    .map((id) => pokemonList.find((p) => p.id === id))
    .filter((x): x is PokemonListItem => x != null);

  const [levelUpSortKey, setLevelUpSortKey] = useState<LevelUpSortKey>("id");
  const [levelUpSortDir, setLevelUpSortDir] = useState<"asc" | "desc">("asc");
  const [breedingSortKey, setBreedingSortKey] = useState<BreedingSortKey>("id");
  const [breedingSortDir, setBreedingSortDir] = useState<"asc" | "desc">("asc");

  const levelUpRows = useMemo(() => {
    return [...levelUpFiltered].sort((a, b) => {
      let cmp = 0;
      if (levelUpSortKey === "id") cmp = a.id - b.id;
      else if (levelUpSortKey === "name") cmp = getPokemonDisplayName(a.name).localeCompare(getPokemonDisplayName(b.name));
      else cmp = a.level - b.level;
      return levelUpSortDir === "asc" ? cmp : -cmp;
    });
  }, [levelUpFiltered, levelUpSortKey, levelUpSortDir]);

  const breedingRows = useMemo(() => {
    return [...breedingFiltered].sort((a, b) => {
      const cmp =
        breedingSortKey === "id"
          ? a.id - b.id
          : getPokemonDisplayName(a.name).localeCompare(getPokemonDisplayName(b.name));
      return breedingSortDir === "asc" ? cmp : -cmp;
    });
  }, [breedingFiltered, breedingSortKey, breedingSortDir]);

  const levelUpSortIcon = (col: LevelUpSortKey) => {
    const active = levelUpSortKey === col;
    return (
      <span className="ml-1 inline-flex">
        {!active ? (
          <ArrowUpDown className="size-3.5 opacity-0 group-hover:opacity-50" />
        ) : levelUpSortDir === "asc" ? (
          <ArrowUp className="size-3.5 text-primary" />
        ) : (
          <ArrowDown className="size-3.5 text-primary" />
        )}
      </span>
    );
  };
  const breedingSortIcon = (col: BreedingSortKey) => {
    const active = breedingSortKey === col;
    return (
      <span className="ml-1 inline-flex">
        {!active ? (
          <ArrowUpDown className="size-3.5 opacity-0 group-hover:opacity-50" />
        ) : breedingSortDir === "asc" ? (
          <ArrowUp className="size-3.5 text-primary" />
        ) : (
          <ArrowDown className="size-3.5 text-primary" />
        )}
      </span>
    );
  };
  const toggleLevelUpSort = (key: LevelUpSortKey) => {
    if (levelUpSortKey === key) setLevelUpSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setLevelUpSortKey(key);
      setLevelUpSortDir("asc");
    }
  };
  const toggleBreedingSort = (key: BreedingSortKey) => {
    if (breedingSortKey === key) setBreedingSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setBreedingSortKey(key);
      setBreedingSortDir("asc");
    }
  };

  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-foreground text-xl font-semibold">{title}</h2>
        {move.effect != null && (
          <p className="text-foreground text-sm">{move.effect}</p>
        )}
        {move.flavor != null && (
          <p className="text-muted-foreground text-sm">{move.flavor}</p>
        )}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm items-baseline">
        <dt className="text-muted-foreground shrink-0">Type</dt>
        <dd className="text-foreground">
          <Badge variant="secondary" className={cn("capitalize border text-xs", getTypeBadgeClassName(move.type))}>
            {move.type}
          </Badge>
        </dd>
        <dt className="text-muted-foreground shrink-0">Category</dt>
        <dd className="text-foreground">{move.category}</dd>
        <dt className="text-muted-foreground shrink-0">Power</dt>
        <dd className="font-mono tabular-nums text-foreground">{move.power ?? "—"}</dd>
        <dt className="text-muted-foreground shrink-0">Accuracy</dt>
        <dd className="font-mono tabular-nums text-foreground">{move.accuracy != null ? `${move.accuracy}%` : "—"}</dd>
        <dt className="text-muted-foreground shrink-0">PP</dt>
        <dd className="font-mono tabular-nums text-foreground">{move.pp ?? "—"}</dd>
        <dt className="text-muted-foreground shrink-0">PP Max</dt>
        <dd className="font-mono tabular-nums text-foreground">{move.maxPP ?? "—"}</dd>
      </dl>

      {levelUpRows.length > 0 && (
        <section>
          <h3 className="text-foreground mb-2 text-base font-semibold">Learnt by level up</h3>
          <div className="overflow-x-auto rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="text-foreground w-14 font-normal">
                    <button
                      type="button"
                      onClick={() => toggleLevelUpSort("id")}
                      className="group inline-flex items-center hover:text-foreground"
                    >
                      Id
                      {levelUpSortIcon("id")}
                    </button>
                  </TableHead>
                  <TableHead className="text-foreground font-normal">
                    <button
                      type="button"
                      onClick={() => toggleLevelUpSort("name")}
                      className="group inline-flex items-center hover:text-foreground"
                    >
                      Name
                      {levelUpSortIcon("name")}
                    </button>
                  </TableHead>
                  <TableHead className="text-foreground w-14 font-normal">
                    <button
                      type="button"
                      onClick={() => toggleLevelUpSort("level")}
                      className="group inline-flex items-center hover:text-foreground"
                    >
                      Lv.
                      {levelUpSortIcon("level")}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levelUpRows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="py-2">
                      <Avatar className="size-8 overflow-hidden rounded-full border border-border bg-muted">
                        {p.spriteUrl ? (
                          <AvatarImage src={p.spriteUrl} alt={getPokemonDisplayName(p.name)} className="object-contain" />
                        ) : (
                          <AvatarFallback className="text-xs">{getPokemonDisplayName(p.name).slice(0, 2)}</AvatarFallback>
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-muted-foreground py-1 text-sm">
                      #{String(p.id).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="py-1">
                      <Link href={`/pokemon/${p.id}`} className="text-foreground font-medium hover:underline">
                        {getPokemonDisplayName(p.name)}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-muted-foreground py-1 text-sm">
                      {p.level}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {breedingRows.length > 0 && (
        <section>
          <h3 className="text-foreground mb-2 text-base font-semibold">Learnt by breeding</h3>
          <div className="overflow-x-auto rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="text-foreground w-14 font-normal">
                    <button
                      type="button"
                      onClick={() => toggleBreedingSort("id")}
                      className="group inline-flex items-center hover:text-foreground"
                    >
                      Id
                      {breedingSortIcon("id")}
                    </button>
                  </TableHead>
                  <TableHead className="text-foreground font-normal">
                    <button
                      type="button"
                      onClick={() => toggleBreedingSort("name")}
                      className="group inline-flex items-center hover:text-foreground"
                    >
                      Name
                      {breedingSortIcon("name")}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breedingRows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="py-1">
                      <Avatar className="size-8 overflow-hidden rounded-full border border-border bg-muted">
                        {p.spriteUrl ? (
                          <AvatarImage src={p.spriteUrl} alt={getPokemonDisplayName(p.name)} className="object-contain" />
                        ) : (
                          <AvatarFallback className="text-xs">{getPokemonDisplayName(p.name).slice(0, 2)}</AvatarFallback>
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-muted-foreground py-1 text-sm">
                      #{String(p.id).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="py-1">
                      <Link href={`/pokemon/${p.id}`} className="text-foreground font-medium hover:underline">
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

      {machineIds.length > 0 && (
        <section>
          <h3 className="text-foreground mb-2 text-base font-semibold">Learnt by Machine</h3>
          <p className="text-sm">
            {machineIds.map((id, i) => (
              <span key={id}>
                <span className="text-primary">{id}</span>
                {i < machineIds.length - 1 && ", "}
              </span>
            ))}
          </p>
        </section>
      )}

      {tutorLocs.length > 0 && (
        <section>
          <h3 className="text-foreground mb-2 text-base font-semibold">Learnt by tutors</h3>
          <p className="text-sm">
            {tutorLocs.map((loc, i) => (
              <span key={loc}>
                <span className="text-primary">{loc}</span>
                {i < tutorLocs.length - 1 && ", "}
              </span>
            ))}
          </p>
        </section>
      )}
    </div>
  );
}
