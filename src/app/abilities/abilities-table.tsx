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
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPokemonDisplayName } from "@/lib/api-adjustments";
import type { AbilityRow } from "@/lib/abilities-table";
import type { PokemonRow } from "@/lib/pokeapi";
import { AbilityDrawerContent } from "./ability-drawer-content";

const MAX_VISIBLE_SPRITES = 3;

type AbilitiesTableProps = {
  rows: AbilityRow[];
  pokemonList: PokemonRow[];
};

type SortKey = "name" | "effect";

function formatName(name: string): string {
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AbilitiesTable({ rows, pokemonList }: AbilitiesTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<AbilityRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.effect?.toLowerCase().includes(q) ?? false) ||
        (r.description?.toLowerCase().includes(q) ?? false)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = (a[sortKey] ?? "") as string;
      const vb = (b[sortKey] ?? "") as string;
      const cmp = va.localeCompare(vb, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const openDrawer = (ability: AbilityRow) => {
    setSelectedAbility(ability);
    setDrawerOpen(true);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    const active = sortKey === column;
    return (
      <span className="ml-1 inline-flex">
        {!active ? (
          <ArrowUpDown className="size-3.5 opacity-0 group-hover:opacity-50" />
        ) : sortDir === "asc" ? (
          <ArrowUp className="size-3.5 text-primary" />
        ) : (
          <ArrowDown className="size-3.5 text-primary" />
        )}
      </span>
    );
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "effect", label: "Effect" },
  ];

  const getAbilityPokemonIds = (row: AbilityRow): number[] => {
    const ids = new Set([...row.pokemonWithAbility, ...row.pokemonWithHiddenAbility]);
    return Array.from(ids).sort((a, b) => a - b);
  };

  const renderSpriteCell = (row: AbilityRow) => {
    const ids = getAbilityPokemonIds(row);
    const toShow = ids.slice(0, MAX_VISIBLE_SPRITES);
    const remaining = ids.length - MAX_VISIBLE_SPRITES;
    const pokemonToShow = toShow
      .map((id) => pokemonList.find((p) => p.id === id))
      .filter((p): p is PokemonRow => p != null);
    if (pokemonToShow.length === 0) return null;
    return (
      <AvatarGroup className="flex shrink-0 flex-wrap justify-start gap-0">
        {pokemonToShow.map((p) => (
          <Avatar key={p.id} className="size-8 border border-border bg-muted">
            {p.spriteUrl ? (
              <AvatarImage src={p.spriteUrl} alt={getPokemonDisplayName(p.name)} className="object-contain" />
            ) : (
              <AvatarFallback className="text-xs">{getPokemonDisplayName(p.name).slice(0, 2)}</AvatarFallback>
            )}
          </Avatar>
        ))}
        {remaining > 0 && (
          <AvatarGroupCount className="text-xs font-semibold">+{remaining}</AvatarGroupCount>
        )}
      </AvatarGroup>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by Name or Effect..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Drawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
          <div className="overflow-x-auto rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32 shrink-0 px-2 py-2" />
                  {columns.map(({ key, label }) => (
                    <TableHead
                      key={key}
                      className={cn(
                        "text-foreground font-normal whitespace-nowrap px-2 py-1.5 text-left",
                        key === "name" && "w-[12rem] min-w-[12rem] shrink-0"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(key)}
                        className="group inline-flex items-center hover:text-foreground"
                      >
                        {label}
                        <SortIcon column={key} />
                      </button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="py-8 text-center text-muted-foreground text-sm"
                    >
                      No abilities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="w-24 shrink-0 px-2 py-2 align-middle">
                        {renderSpriteCell(row)}
                      </TableCell>
                      <TableCell className="w-[12rem] min-w-[12rem] shrink-0 px-2 py-2">
                        <button
                          type="button"
                          onClick={() => openDrawer(row)}
                          className="text-foreground font-medium text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded truncate block w-full"
                        >
                          {formatName(row.name)}
                        </button>
                      </TableCell>
                      <TableCell className="text-foreground max-w-md px-2 py-2 text-sm">
                        {row.effect ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DrawerContent className="sm:max-w-md border-border">
            {selectedAbility && (
              <AbilityDrawerContent
                ability={selectedAbility}
                pokemonList={pokemonList}
              />
            )}
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
