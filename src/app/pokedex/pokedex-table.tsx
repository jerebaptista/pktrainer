"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import type { PokemonRow } from "@/lib/pokeapi";
import {
  PokedexFilters,
  EXTRA_COLUMN_OPTIONS,
  type ExtraColumnId,
  type StatsMode,
} from "./pokedex-filters";

const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed", "bst"] as const;
type StatKey = (typeof STAT_KEYS)[number];
type SortKey = "id" | "name" | "type" | StatKey | ExtraColumnId;
type SortDir = "asc" | "desc";

/** Same width for numeral/avatar columns */
const W_NUM = "w-14";
/** Same width for text columns (Name, Type, EV yield, Growth Rate) */
const W_TEXT = "w-28";

const EXTRA_COLUMN_IS_NUMERIC: Record<ExtraColumnId, boolean> = {
  baseFriendship: true,
  baseExp: true,
  catchRate: true,
  evYield: false,
  growthRate: false,
  height: true,
  weight: true,
};

const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  specialAttack: "Sp. Atk",
  specialDefense: "Sp. Def",
  speed: "Speed",
  bst: "BST",
};

function getStatLabels(mode: StatsMode): Record<StatKey, string> {
  if (mode === "base") return STAT_LABELS;
  const suffix = mode === "max" ? " Max" : " Min";
  return {
    hp: `HP${suffix}`,
    attack: `Atk${suffix}`,
    defense: `Def${suffix}`,
    specialAttack: `Sp. Atk${suffix}`,
    specialDefense: `Sp. Def${suffix}`,
    speed: `Speed${suffix}`,
    bst: "MST", // Max/Min Stats Total
  };
}

function getExtraSortValue(p: PokemonRow, id: ExtraColumnId): number | string {
  switch (id) {
    case "baseFriendship":
      return p.baseFriendship ?? -1;
    case "baseExp":
      return p.baseExperience ?? -1;
    case "catchRate":
      return p.catchRate ?? -1;
    case "evYield":
      return p.evYield;
    case "growthRate":
      return p.growthRate;
    case "height":
      return p.height;
    case "weight":
      return p.weight;
    default:
      return 0;
  }
}

function sortPokemon(
  data: PokemonRow[],
  key: SortKey,
  dir: SortDir,
  statsMode: StatsMode
): PokemonRow[] {
  const stats = statsMode === "base" ? "baseStats" : statsMode === "max" ? "maxStats" : "minStats";
  const sorted = [...data].sort((a, b) => {
    if (key === "id") return a.id - b.id;
    if (key === "name") return a.name.localeCompare(b.name);
    if (key === "type") {
      const ta = a.types[0] ?? "";
      const tb = b.types[0] ?? "";
      return ta.localeCompare(tb) || (a.types[1] ?? "").localeCompare(b.types[1] ?? "");
    }
    if (STAT_KEYS.includes(key as StatKey)) {
      return a[stats][key as StatKey] - b[stats][key as StatKey];
    }
    if (EXTRA_COLUMN_OPTIONS.some((o) => o.id === key)) {
      const va = getExtraSortValue(a, key as ExtraColumnId);
      const vb = getExtraSortValue(b, key as ExtraColumnId);
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb));
    }
    return 0;
  });
  return dir === "asc" ? sorted : sorted.reverse();
}

function getExtraColumnValue(p: PokemonRow, id: ExtraColumnId): string | number {
  switch (id) {
    case "baseFriendship":
      return p.baseFriendship ?? "—";
    case "baseExp":
      return p.baseExperience ?? "—";
    case "catchRate":
      return p.catchRate ?? "—";
    case "evYield":
      return p.evYield;
    case "growthRate":
      return p.growthRate.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    case "height":
      return `${(p.height / 10).toFixed(1)} m`;
    case "weight":
      return `${(p.weight / 10).toFixed(1)} kg`;
    default:
      return "—";
  }
}

export function PokedexTable({ data }: { data: PokemonRow[] }) {
  const [search, setSearch] = useState("");
  const allTypes = useMemo(
    () => [...new Set(data.flatMap((p) => p.types))].sort(),
    [data]
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const typesInitialized = useRef(false);
  useEffect(() => {
    if (allTypes.length > 0 && !typesInitialized.current) {
      setSelectedTypes([...allTypes]);
      typesInitialized.current = true;
    }
  }, [allTypes]);
  const [statsMode, setStatsMode] = useState<StatsMode>("base");
  const [extraColumns, setExtraColumns] = useState<ExtraColumnId[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let list = data;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const paddedId = String(p.id).padStart(3, "0");
        return paddedId.includes(q) || p.name.toLowerCase().includes(q);
      });
    }
    if (selectedTypes.length > 0) {
      list = list.filter((p) => p.types.some((t) => selectedTypes.includes(t)));
    }
    return list;
  }, [data, search, selectedTypes]);

  const sorted = useMemo(
    () => sortPokemon(filtered, sortKey, sortDir, statsMode),
    [filtered, sortKey, sortDir, statsMode]
  );

  const statLabels = useMemo(() => getStatLabels(statsMode), [statsMode]);
  const stats =
    statsMode === "base"
      ? "baseStats"
      : statsMode === "max"
        ? "maxStats"
        : "minStats";

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const allSelected = prev.length === allTypes.length;
      if (allSelected) {
        return [type];
      }
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };
  const selectAllTypes = () => setSelectedTypes([...allTypes]);
  const toggleExtraColumn = (id: ExtraColumnId) => {
    setExtraColumns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };
  const selectAllColumns = () =>
    setExtraColumns(EXTRA_COLUMN_OPTIONS.map((o) => o.id));
  const selectNoneColumns = () => setExtraColumns([]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    const isActive = sortKey === column;
    const iconClass = "ml-1 size-3.5 shrink-0";
    if (!isActive) {
      return (
        <ArrowUpDown
          className={cn(iconClass, "opacity-0 transition-opacity group-hover:opacity-50")}
          aria-hidden
        />
      );
    }
    return (
      <span className="inline-flex text-primary" aria-hidden>
        {sortDir === "asc" ? (
          <ArrowUp className={iconClass} />
        ) : (
          <ArrowDown className={iconClass} />
        )}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <PokedexFilters
        search={search}
        onSearchChange={setSearch}
        allTypes={allTypes}
        selectedTypes={selectedTypes}
        onToggleType={toggleType}
        onSelectAllTypes={selectAllTypes}
        statsMode={statsMode}
        onStatsModeChange={setStatsMode}
        extraColumns={extraColumns}
        onToggleExtraColumn={toggleExtraColumn}
        onSelectAllColumns={selectAllColumns}
        onSelectNoneColumns={selectNoneColumns}
      />

      <div className="w-full overflow-x-auto">
        <Table className="w-max min-w-full [&_th]:px-1 [&_td]:px-1 [&_th]:text-left [&_td]:text-left [&_th]:font-normal [&_td]:text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className={W_NUM} />
              <TableHead className={cn(W_NUM, "group whitespace-nowrap")}>
                <button
                  type="button"
                  onClick={() => handleSort("id")}
                  className="inline-flex items-center hover:text-foreground"
                >
                  ID
                  <SortIcon column="id" />
                </button>
              </TableHead>
              <TableHead className={cn(W_TEXT, "group whitespace-nowrap")}>
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="inline-flex items-center hover:text-foreground"
                >
                  Name
                  <SortIcon column="name" />
                </button>
              </TableHead>
              <TableHead className={cn(W_TEXT, "group whitespace-nowrap")}>
                <button
                  type="button"
                  onClick={() => handleSort("type")}
                  className="inline-flex items-center hover:text-foreground"
                >
                  Type
                  <SortIcon column="type" />
                </button>
              </TableHead>
              {STAT_KEYS.map((key) => (
                <TableHead key={key} className={cn(W_NUM, "group whitespace-nowrap")}>
                  <button
                    type="button"
                    onClick={() => handleSort(key)}
                    className="inline-flex items-center hover:text-foreground"
                  >
                    {statLabels[key]}
                    <SortIcon column={key} />
                  </button>
                </TableHead>
              ))}
              {extraColumns.map((id) => {
                const opt = EXTRA_COLUMN_OPTIONS.find((o) => o.id === id);
                const isNum = EXTRA_COLUMN_IS_NUMERIC[id];
                return (
                  <TableHead key={id} className={cn(isNum ? W_NUM : W_TEXT, "group whitespace-nowrap")}>
                    <button
                      type="button"
                      onClick={() => handleSort(id)}
                      className="inline-flex items-center hover:text-foreground"
                    >
                      {opt?.label ?? id}
                      <SortIcon column={id} />
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => (
              <TableRow key={p.id}>
                <TableCell className={cn(W_NUM, "py-1")}>
                  <button
                    type="button"
                    onClick={() => {
                      if (p.cryUrl) {
                        const audio = new Audio(p.cryUrl);
                        audio.play().catch(() => {});
                      }
                    }}
                    disabled={!p.cryUrl}
                    className={cn(
                      "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      p.cryUrl && "cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                    )}
                    aria-label={p.cryUrl ? `Play ${p.name} cry` : undefined}
                  >
                    <Avatar className="size-8 overflow-hidden rounded-full border border-border bg-muted pointer-events-none">
                      {p.spriteUrl ? (
                        <AvatarImage
                          src={p.spriteUrl}
                          alt={p.name}
                          className="size-full object-contain object-center [transform-origin:center]"
                        />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {p.name.slice(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </TableCell>
                <TableCell className={cn(W_NUM, "font-mono text-muted-foreground tabular-nums")}>
                  #{String(p.id).padStart(3, "0")}
                </TableCell>
                <TableCell className={cn(W_TEXT, "font-medium capitalize truncate")}>
                  {p.name}
                </TableCell>
                <TableCell className={W_TEXT}>
                  <div className="flex flex-wrap gap-0.5">
                    {p.types.map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={cn("capitalize border text-xs", getTypeBadgeClassName(type))}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                {STAT_KEYS.map((key) => (
                  <TableCell
                    key={key}
                    className={cn(W_NUM, "font-mono tabular-nums text-muted-foreground")}
                  >
                    {key === "bst" ? (
                      <span className="font-medium">{p[stats][key]}</span>
                    ) : (
                      p[stats][key]
                    )}
                  </TableCell>
                ))}
                {extraColumns.map((id) => (
                  <TableCell
                    key={id}
                    className={cn(
                      EXTRA_COLUMN_IS_NUMERIC[id] ? W_NUM : W_TEXT,
                      EXTRA_COLUMN_IS_NUMERIC[id] ? "font-mono tabular-nums text-muted-foreground" : "text-muted-foreground"
                    )}
                  >
                    {getExtraColumnValue(p, id)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
