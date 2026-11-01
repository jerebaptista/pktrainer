"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import { AbilityDrawerContent } from "./ability-drawer-content";

/** Minimal Pokémon data for abilities table/drawer to keep RSC payload small. */
export type PokemonListItem = { id: number; name: string; spriteUrl: string | null };

const MAX_VISIBLE_SPRITES = 3;

/** Largura fixa de cada coluna em rem (aplicada via style + colgroup para não encolher). */
const COLUMN_WIDTH_REM = {
  sprite: 6,
  name: 12,
  effect: 18,
} as const;

function getColumnWidthStyle(key: keyof typeof COLUMN_WIDTH_REM): { width: string; minWidth: string } {
  const rem = COLUMN_WIDTH_REM[key];
  const s = `${rem}rem`;
  return { width: s, minWidth: s };
}

type AbilitiesTableProps = {
  rows: AbilityRow[];
  pokemonList: PokemonListItem[];
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

  const columnWidthKeys = useMemo(() => ["sprite", "name", "effect"] as const, []);

  const getAbilityPokemonIds = (row: AbilityRow): number[] => {
    const ids = new Set([...row.pokemonWithAbility, ...row.pokemonWithHiddenAbility]);
    return Array.from(ids).sort((a, b) => a - b);
  };

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const [tableContainerWidth, setTableContainerWidth] = useState(0);

  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const update = () => {
      setTableScrollWidth(el.scrollWidth);
      setTableContainerWidth(el.clientWidth);
      const bottom = bottomScrollRef.current;
      if (bottom) bottom.scrollLeft = el.scrollLeft;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sorted]);

  const syncTableFromBottom = () => {
    const table = tableScrollRef.current;
    const bottom = bottomScrollRef.current;
    if (table && bottom) table.scrollLeft = bottom.scrollLeft;
  };
  const syncBottomFromTable = () => {
    const table = tableScrollRef.current;
    const bottom = bottomScrollRef.current;
    if (table && bottom) bottom.scrollLeft = table.scrollLeft;
  };
  const showBottomScroll = tableScrollWidth > tableContainerWidth;

  useEffect(() => {
    if (!showBottomScroll) return;
    const table = tableScrollRef.current;
    const bottom = bottomScrollRef.current;
    if (table && bottom) bottom.scrollLeft = table.scrollLeft;
  }, [showBottomScroll]);

  const renderSpriteCell = (row: AbilityRow) => {
    const ids = getAbilityPokemonIds(row);
    const toShow = ids.slice(0, MAX_VISIBLE_SPRITES);
    const remaining = ids.length - MAX_VISIBLE_SPRITES;
    const pokemonToShow = toShow
      .map((id) => pokemonList.find((p) => p.id === id))
      .filter((p): p is PokemonListItem => p != null);
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
          <div className={cn("space-y-0", showBottomScroll && "pb-5")}>
          <div
            ref={tableScrollRef}
            className="min-w-0 w-full overflow-x-auto rounded-md"
            onScroll={syncBottomFromTable}
          >
            <table
              style={{ width: "max-content", minWidth: "max-content", tableLayout: "fixed" }}
              className="caption-bottom text-sm"
            >
              <colgroup>
                {columnWidthKeys.map((key, i) => {
                  const rem = COLUMN_WIDTH_REM[key];
                  const w = `${rem}rem`;
                  return <col key={i} style={{ width: w, minWidth: w }} />;
                })}
              </colgroup>
              <TableHeader>
                <TableRow>
                  <TableHead style={getColumnWidthStyle("sprite")} className="shrink-0 px-2 py-2" />
                  {columns.map(({ key, label }) => (
                    <TableHead
                      key={key}
                      style={getColumnWidthStyle(key)}
                      className="text-foreground font-normal whitespace-nowrap shrink-0 px-2 py-1.5 text-left"
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
                      <TableCell style={getColumnWidthStyle("sprite")} className="shrink-0 px-2 py-2 align-middle">
                        {renderSpriteCell(row)}
                      </TableCell>
                      <TableCell style={getColumnWidthStyle("name")} className="shrink-0 px-2 py-2">
                        <button
                          type="button"
                          onClick={() => openDrawer(row)}
                          className="text-foreground font-medium text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded truncate block w-full"
                        >
                          {formatName(row.name)}
                        </button>
                      </TableCell>
                      <TableCell style={getColumnWidthStyle("effect")} className="text-foreground shrink-0 overflow-hidden px-2 py-2 text-sm">
                        {row.effect ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>

          {showBottomScroll && (
            <div
              ref={bottomScrollRef}
              className="fixed bottom-0 left-0 right-0 z-40 h-5 overflow-x-auto overflow-y-hidden border-t border-border bg-background/95 shadow-[0_-1px_4px_rgba(0,0,0,0.05)] supports-[backdrop-filter]:bg-background/80"
              onScroll={syncTableFromBottom}
              aria-label="Scroll horizontal da tabela"
            >
              <div style={{ width: tableScrollWidth, height: 1 }} />
            </div>
          )}
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
