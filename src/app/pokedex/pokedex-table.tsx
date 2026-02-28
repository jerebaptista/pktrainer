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
  EV_YIELD_OPTIONS,
  AVAILABILITY_GROUPS,
  ALL_AVAILABILITY_VALUES,
  type ExtraColumnId,
  type StatsMode,
} from "./pokedex-filters";
import { getPokemonDisplayName } from "@/lib/api-adjustments";

const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed", "bst"] as const;
type StatKey = (typeof STAT_KEYS)[number];
type SortKey = "id" | "name" | "type" | StatKey | ExtraColumnId;
type SortDir = "asc" | "desc";

/** Same width for numeral/avatar columns */
const W_NUM = "w-14";
/** Same width for text columns (Name, Type, EV yield, Growth Rate) */
const W_TEXT = "w-28";
/** Availability column – fixed at end, shrink to content (1% lets table give min width to content) */
const W_AVAILABILITY = "w-[1%]";

/** Order for availability sort (column value ordering). Atoms and compound order. */
const AVAILABILITY_ORDER = [
  "Wild",
  "Wild, FR Only",
  "Wild, LG Only",
  "NPC Trade",
  "Gift",
  "Gift, FR Only",
  "Gift, LG Only",
  "Game Corner",
  "Fossil",
  "FR Only",
  "LG Only",
  "Trade Evo",
  "Fire Stone",
  "Water Stone",
  "Thunder Stone",
  "Leaf Stone",
  "Moon Stone",
  "Event",
];

const EXTRA_COLUMN_IS_NUMERIC: Record<ExtraColumnId, boolean> = {
  baseFriendship: true,
  baseExp: true,
  catchRate: true,
  evYield: false,
  availability: false,
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
    case "availability":
      return p.availability;
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
    if (key === "name") return getPokemonDisplayName(a.name).localeCompare(getPokemonDisplayName(b.name));
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

/** Version tag in availability (FR/LG) – small semibold, top-aligned, no space before */
const VERSION_TAG_CLASS = "text-[10px] font-bold align-top";

function renderAvailabilityPart(part: string): React.ReactNode {
  if (part === "NPC Trade FR") return (<>NPC Trade<span className={VERSION_TAG_CLASS}>FR</span></>);
  if (part === "NPC Trade LG") return (<>NPC Trade<span className={VERSION_TAG_CLASS}>LG</span></>);
  if (part === "Wild FR") return (<>Wild<span className={VERSION_TAG_CLASS}>FR</span></>);
  if (part === "Wild LG") return (<>Wild<span className={VERSION_TAG_CLASS}>LG</span></>);
  return part;
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
    case "availability":
      return p.availability;
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
  /** Selectable extra columns (Availability is always last and not in this list). */
  const [extraColumns, setExtraColumns] = useState<ExtraColumnId[]>([]);
  /** Column order follows the select order (EXTRA_COLUMN_OPTIONS), then Availability last. */
  const effectiveExtraColumns = useMemo((): ExtraColumnId[] => {
    const selectableOrder = EXTRA_COLUMN_OPTIONS.filter((o) => o.id !== "availability").map((o) => o.id);
    return [...selectableOrder.filter((id) => extraColumns.includes(id)), "availability"];
  }, [extraColumns]);
  const [selectedEvYields, setSelectedEvYields] = useState<string[]>(() => [...EV_YIELD_OPTIONS]);
  const [selectedGrowthRates, setSelectedGrowthRates] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(() => [...ALL_AVAILABILITY_VALUES]);
  const growthRatesInitialized = useRef(false);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const allGrowthRates = useMemo(() => {
    const raw = [...new Set(data.map((p) => p.growthRate).filter(Boolean))].sort();
    return raw.map((value) => ({
      value,
      label: value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }, [data]);

  useEffect(() => {
    if (allGrowthRates.length > 0 && !growthRatesInitialized.current) {
      setSelectedGrowthRates(allGrowthRates.map((g) => g.value));
      growthRatesInitialized.current = true;
    }
  }, [allGrowthRates]);

  const filtered = useMemo(() => {
    let list = data;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const paddedId = String(p.id).padStart(3, "0");
        const displayName = getPokemonDisplayName(p.name).toLowerCase();
        return paddedId.includes(q) || p.name.toLowerCase().includes(q) || displayName.includes(q);
      });
    }
    if (selectedTypes.length > 0) {
      list = list.filter((p) => p.types.some((t) => selectedTypes.includes(t)));
    }
    if (selectedEvYields.length > 0) {
      list = list.filter((p) => {
        const parts = p.evYield.split(", ");
        return selectedEvYields.some(
          (ev) =>
            parts.some((part) => {
              const label = part.replace(/^\d+\s+/, "").trim();
              return label === ev;
            })
        );
      });
    }
    if (selectedGrowthRates.length > 0) {
      list = list.filter((p) => selectedGrowthRates.includes(p.growthRate));
    }
    if (selectedAvailability.length > 0) {
      list = list.filter((p) => {
        const parts = p.availability.split(",").map((s) => s.trim());
        return selectedAvailability.some((selected) => {
          if (selected === "Level") return parts.some((part) => part.startsWith("Lv."));
          if (selected === "NPC Trade") return parts.some((part) => part === "NPC Trade" || part === "NPC Trade FR" || part === "NPC Trade LG");
          if (selected === "Wild") return parts.some((part) => part === "Wild" || part === "Wild FR" || part === "Wild LG");
          return parts.includes(selected);
        });
      });
    }
    return list;
  }, [data, search, selectedTypes, selectedEvYields, selectedGrowthRates, selectedAvailability]);

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
        if (prev.length === 1) return [...allTypes];
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
  const removeAllColumns = () => setExtraColumns([]);
  const toggleEvYield = (label: string) => {
    setSelectedEvYields((prev) => {
      const allSelected = prev.length === EV_YIELD_OPTIONS.length;
      if (allSelected) return [label];
      if (prev.includes(label)) {
        if (prev.length === 1) return [...EV_YIELD_OPTIONS];
        return prev.filter((l) => l !== label);
      }
      return [...prev, label];
    });
  };
  const selectAllEvYields = () => setSelectedEvYields([...EV_YIELD_OPTIONS]);

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
        onRemoveAllColumns={removeAllColumns}
        selectedEvYields={selectedEvYields}
        onToggleEvYield={toggleEvYield}
        onSelectAllEvYields={selectAllEvYields}
        selectedGrowthRates={selectedGrowthRates}
        onToggleGrowthRate={(value) => {
          setSelectedGrowthRates((prev) => {
            const allSelected = prev.length === allGrowthRates.length;
            if (allSelected) return [value];
            if (prev.includes(value)) {
              if (prev.length === 1) return allGrowthRates.map((g) => g.value);
              return prev.filter((v) => v !== value);
            }
            return [...prev, value];
          });
        }}
        onSelectAllGrowthRates={() => setSelectedGrowthRates(allGrowthRates.map((g) => g.value))}
        allGrowthRates={allGrowthRates}
        selectedAvailability={selectedAvailability}
        onToggleAvailability={(value) => {
          setSelectedAvailability((prev) => {
            const allSelected = prev.length === ALL_AVAILABILITY_VALUES.length;
            if (allSelected) return [value];
            if (prev.includes(value)) {
              if (prev.length === 1) return [...ALL_AVAILABILITY_VALUES];
              return prev.filter((v) => v !== value);
            }
            return [...prev, value];
          });
        }}
        onSelectAllAvailability={() => setSelectedAvailability([...ALL_AVAILABILITY_VALUES])}
        availabilityGroups={AVAILABILITY_GROUPS}
        onRemoveFilters={() => {
          setSearch("");
          setSelectedTypes([...allTypes]);
          setExtraColumns([]);
          setSelectedEvYields([...EV_YIELD_OPTIONS]);
          setSelectedGrowthRates(allGrowthRates.map((g) => g.value));
          setSelectedAvailability([...ALL_AVAILABILITY_VALUES]);
        }}
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
              {effectiveExtraColumns.map((id) => {
                const opt = EXTRA_COLUMN_OPTIONS.find((o) => o.id === id);
                const isNum = EXTRA_COLUMN_IS_NUMERIC[id];
                const wClass = id === "availability" ? W_AVAILABILITY : isNum ? W_NUM : W_TEXT;
                return (
                  <TableHead key={id} className={cn(wClass, id === "availability" && "px-1.5", "group whitespace-nowrap")}>
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
                    aria-label={p.cryUrl ? `Play ${getPokemonDisplayName(p.name)} cry` : undefined}
                  >
                    <Avatar className="size-8 overflow-hidden rounded-full border border-border bg-muted pointer-events-none">
                      {p.spriteUrl ? (
                        <AvatarImage
                          src={p.spriteUrl}
                          alt={getPokemonDisplayName(p.name)}
                          className="size-full object-contain object-center [transform-origin:center]"
                        />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {getPokemonDisplayName(p.name).slice(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>
                </TableCell>
                <TableCell className={cn(W_NUM, "font-mono text-muted-foreground tabular-nums")}>
                  #{String(p.id).padStart(3, "0")}
                </TableCell>
                <TableCell className={cn(W_TEXT, "font-medium truncate")}>
                  {getPokemonDisplayName(p.name)}
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
                {effectiveExtraColumns.map((id) => {
                const wClass = id === "availability" ? W_AVAILABILITY : EXTRA_COLUMN_IS_NUMERIC[id] ? W_NUM : W_TEXT;
                return (
                  <TableCell
                    key={id}
                    className={cn(
                      wClass,
                      id === "availability" && "px-1.5",
                      EXTRA_COLUMN_IS_NUMERIC[id] ? "font-mono tabular-nums text-muted-foreground" : "text-muted-foreground"
                    )}
                  >
                    {id === "availability" ? (
                      <span className="whitespace-nowrap">
                        {p.availability.split(",").map((s, i) => {
                          const part = s.trim();
                          const parts = p.availability.split(",");
                          const isLast = i === parts.length - 1;
                          return (
                            <span key={i}>
                              {renderAvailabilityPart(part)}
                              {!isLast && ", "}
                            </span>
                          );
                        })}
                      </span>
                    ) : (
                      getExtraColumnValue(p, id)
                    )}
                  </TableCell>
                );
              })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
