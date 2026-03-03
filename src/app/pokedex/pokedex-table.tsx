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
import Link from "next/link";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed", "bst"] as const;
/** Stat columns without total (BST) – used when Max/Min Stats are active; MST column hidden. */
const STAT_KEYS_NO_TOTAL = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
type StatKey = (typeof STAT_KEYS)[number];
type SortKey = "id" | "name" | "type" | StatKey | ExtraColumnId;
type SortDir = "asc" | "desc";

/**
 * Column width as % of table (w, min, max). Edit these to adjust layout.
 * Groups: Sprite | ID | Name | Type | [Stats group] | EV yield | Growth | Availability
 * Stats group = base stats (7) + BST + Base exp, Catch rate, Friendship, Height, Weight (12 cols total).
 */
const COLUMN_WIDTHS_PCT = {
  sprite: { w: 2, min: 1, max: 3 },
  id: { w: 2, min: 1, max: 3 },
  name: { w: 5, min: 3, max: 8 },
  type: { w: 5, min: 4, max: 6 },
  /** Each column in stats group (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed, BST, Base Exp., Catch rate, Friendship, Height, Weight) */
  statsEach: { w: 3.5, min: 3, max: 4 },
  evYield: { w: 5, min: 4, max: 6 },
  growth: { w: 4, min: 4, max: 6 },
  availability: { w: 8, min: 8, max: 22 },
} as const;

function getColumnWidthStyle(
  pct: { w: number; min: number; max: number },
  minRem?: number
): { width: string; minWidth: string; maxWidth: string } {
  return {
    width: `${pct.w}%`,
    minWidth: minRem != null ? `max(${pct.min}%, ${minRem}rem)` : `${pct.min}%`,
    maxWidth: `${pct.max}%`,
  };
}

/** Extra column id → width group */
const EXTRA_COLUMN_GROUP: Record<ExtraColumnId, "stats" | "evYield" | "growth" | "availability"> = {
  baseExp: "stats",
  catchRate: "stats",
  evYield: "evYield",
  baseFriendship: "stats",
  height: "stats",
  weight: "stats",
  growthRate: "growth",
  availability: "availability",
};

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
  "Purchase",
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

const STONE_LABELS = new Set(["Fire Stone", "Water Stone", "Thunder Stone", "Leaf Stone", "Moon Stone"]);

function getAvailabilityPartTooltip(part: string, evolvesFrom: string | null): string | null {
  if (!evolvesFrom) return null;
  if (/^Lv\. \d+$/.test(part)) return getPokemonDisplayName(evolvesFrom);
  if (STONE_LABELS.has(part) || part === "Trade Evo") return getPokemonDisplayName(evolvesFrom);
  return null;
}

function renderAvailabilityPart(part: string, p: PokemonRow): React.ReactNode {
  const tooltipText = getAvailabilityPartTooltip(part, p.evolvesFromSpeciesName);
  const content = (() => {
    if (part === "NPC Trade FR") return (<>NPC Trade<span className={VERSION_TAG_CLASS}>FR</span></>);
    if (part === "NPC Trade LG") return (<>NPC Trade<span className={VERSION_TAG_CLASS}>LG</span></>);
    if (part === "Wild FR") return (<>Wild<span className={VERSION_TAG_CLASS}>FR</span></>);
    if (part === "Wild LG") return (<>Wild<span className={VERSION_TAG_CLASS}>LG</span></>);
    return part;
  })();
  if (tooltipText) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{content}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tooltipText}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

/** API: height in dm, weight in hg. */
function formatHeight(heightDm: number, unit: "imperial" | "metric"): string {
  const m = heightDm / 10;
  if (unit === "metric") return `${m.toFixed(1)} m`;
  const totalInches = m * 39.37007874;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}′${String(inches).padStart(2, "0")}″`;
}

function formatWeight(weightHg: number, unit: "imperial" | "metric"): string {
  const kg = weightHg / 10;
  if (unit === "metric") return `${kg.toFixed(1)} kg`;
  const lbs = (kg * 2.20462).toFixed(1);
  return `${lbs} lbs`;
}

function getExtraColumnValue(
  p: PokemonRow,
  id: ExtraColumnId,
  heightWeightUnit: "imperial" | "metric"
): string | number {
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
      return formatHeight(p.height, heightWeightUnit);
    case "weight":
      return formatWeight(p.weight, heightWeightUnit);
    default:
      return "—";
  }
}

/** Debug: true = ignorar todos os filtros e mostrar exatamente o que veio em data. Use para testar se 143–146 e 150 estão nos dados. */
const SKIP_FILTERS_DEBUG = false;

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
  const [heightWeightUnit, setHeightWeightUnit] = useState<"imperial" | "metric">("imperial");
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
    if (SKIP_FILTERS_DEBUG) return data;
    let list = data;
    const isStatic = (p: { availability: string }) => p.availability.trim() === "Static";
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        if (isStatic(p)) return true;
        const paddedId = String(p.id).padStart(3, "0");
        const displayName = getPokemonDisplayName(p.name).toLowerCase();
        return paddedId.includes(q) || p.name.toLowerCase().includes(q) || displayName.includes(q);
      });
    }
    if (selectedTypes.length > 0) {
      list = list.filter((p) => isStatic(p) || p.types.some((t) => selectedTypes.includes(t)));
    }
    if (selectedEvYields.length > 0) {
      list = list.filter((p) => {
        if (isStatic(p)) return true;
        const y = (p.evYield ?? "").trim();
        if (!y || y === "—") return true;
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
      list = list.filter((p) => isStatic(p) || selectedGrowthRates.includes(p.growthRate));
    }
    if (selectedAvailability.length > 0) {
      list = list.filter((p) => {
        if (isStatic(p)) return true;
        const parts = p.availability.split(",").map((s) => s.trim());
        return selectedAvailability.some((selected) => {
          if (selected === "Level") return parts.some((part) => part.startsWith("Lv."));
          if (selected === "NPC Trade") return parts.some((part) => part === "NPC Trade" || part === "NPC Trade FR" || part === "NPC Trade LG");
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

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const [tableContainerWidth, setTableContainerWidth] = useState(0);

  const statLabels = useMemo(() => getStatLabels(statsMode), [statsMode]);
  /** Only show BST column when Base Stats is active; hide MST for Max/Min. */
  const statColumns = statsMode === "base" ? STAT_KEYS : STAT_KEYS_NO_TOTAL;
  useEffect(() => {
    if (statsMode !== "base" && sortKey === "bst") setSortKey("id");
  }, [statsMode, sortKey]);

  /** Medir largura da tabela para a barra de scroll fixa e manter posição sincronizada */
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const updateWidth = () => {
      setTableScrollWidth(el.scrollWidth);
      setTableContainerWidth(el.clientWidth);
      const bottom = bottomScrollRef.current;
      if (bottom) bottom.scrollLeft = el.scrollLeft;
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sorted, effectiveExtraColumns, statColumns]);

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

  /** Ao exibir a barra fixa, sincronizar scroll com a tabela */
  useEffect(() => {
    if (!showBottomScroll) return;
    const table = tableScrollRef.current;
    const bottom = bottomScrollRef.current;
    if (table && bottom) bottom.scrollLeft = table.scrollLeft;
  }, [showBottomScroll]);

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
    <div className={cn("space-y-4", showBottomScroll && "pb-5")}>
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
        heightWeightUnit={heightWeightUnit}
        onHeightWeightUnitChange={setHeightWeightUnit}
        showHeightWeightToggle={extraColumns.includes("height") || extraColumns.includes("weight")}
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

      <div
        ref={tableScrollRef}
        className="w-full overflow-x-auto"
        onScroll={syncBottomFromTable}
      >
        <Table className="table-fixed w-full min-w-[72rem] [&_th]:px-1 [&_td]:px-1 [&_th]:text-left [&_td]:text-left [&_th]:font-normal [&_td]:text-sm">
          <TableHeader>
            <TableRow>
              <TableHead style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.sprite)} />
              <TableHead style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.id)} className="group whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleSort("id")}
                  className="inline-flex items-center hover:text-foreground"
                >
                  ID
                  <SortIcon column="id" />
                </button>
              </TableHead>
              <TableHead style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.name)} className="group whitespace-nowrap overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="inline-flex items-center hover:text-foreground"
                >
                  Name
                  <SortIcon column="name" />
                </button>
              </TableHead>
              <TableHead style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.type, 6)} className="group whitespace-nowrap overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleSort("type")}
                  className="inline-flex items-center hover:text-foreground"
                >
                  Type
                  <SortIcon column="type" />
                </button>
              </TableHead>
              {statColumns.map((key) => (
                <TableHead key={key} style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.statsEach)} className="group whitespace-nowrap overflow-hidden">
                  {key === "bst" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSort(key)}
                          className="inline-flex items-center hover:text-foreground"
                        >
                          {statLabels[key]}
                          <SortIcon column={key} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {statsMode === "base"
                          ? "Base Stats Total"
                          : statsMode === "max"
                            ? "Max. Stats Total"
                            : "Min. Stats Total"}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSort(key)}
                      className="inline-flex items-center hover:text-foreground"
                    >
                      {statLabels[key]}
                      <SortIcon column={key} />
                    </button>
                  )}
                </TableHead>
              ))}
              {effectiveExtraColumns.map((id) => {
                const opt = EXTRA_COLUMN_OPTIONS.find((o) => o.id === id);
                const widthGroup = EXTRA_COLUMN_GROUP[id];
                const widthPct = widthGroup === "stats" ? COLUMN_WIDTHS_PCT.statsEach : COLUMN_WIDTHS_PCT[widthGroup];
                const minRem = id === "evYield" ? 9 : undefined;
                return (
                  <TableHead key={id} style={getColumnWidthStyle(widthPct, minRem)} className={cn(id === "availability" && "px-1.5", "group whitespace-nowrap overflow-hidden")}>
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
                <TableCell style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.sprite)} className="py-1">
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
                <TableCell style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.id)} className="font-mono text-muted-foreground tabular-nums">
                  #{String(p.id).padStart(3, "0")}
                </TableCell>
                <TableCell style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.name)} className="font-medium truncate overflow-hidden">
                  <Link
                    href={`/pokedex/${p.name}`}
                    className="text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {getPokemonDisplayName(p.name)}
                  </Link>
                </TableCell>
                <TableCell style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.type, 6)} className="overflow-hidden">
                  <div className="flex flex-nowrap gap-0.5 overflow-hidden">
                    {p.types.map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={cn("shrink-0 capitalize border text-xs", getTypeBadgeClassName(type))}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                {statColumns.map((key) => (
                  <TableCell
                    key={key}
                    style={getColumnWidthStyle(COLUMN_WIDTHS_PCT.statsEach)}
                    className="font-mono tabular-nums text-muted-foreground overflow-hidden"
                  >
                    {key === "bst" ? (
                      <span className="font-medium">{p[stats][key]}</span>
                    ) : (
                      p[stats][key]
                    )}
                  </TableCell>
                ))}
                {effectiveExtraColumns.map((id) => {
                  const widthGroup = EXTRA_COLUMN_GROUP[id];
                  const widthPct = widthGroup === "stats" ? COLUMN_WIDTHS_PCT.statsEach : COLUMN_WIDTHS_PCT[widthGroup];
                  const minRem = id === "evYield" ? 9 : undefined;
                  return (
                  <TableCell
                    key={id}
                    style={getColumnWidthStyle(widthPct, minRem)}
                    className={cn(
                      id === "availability" && "px-1.5",
                      "overflow-hidden",
                      (id === "evYield" || id === "availability") && "whitespace-nowrap",
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
                              {renderAvailabilityPart(part, p)}
                              {!isLast && ", "}
                            </span>
                          );
                        })}
                      </span>
                    ) : (
                      getExtraColumnValue(p, id, heightWeightUnit)
                    )}
                  </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Barra de scroll horizontal fixa na parte inferior da tela */}
      {showBottomScroll && (
        <div
          ref={bottomScrollRef}
          className="fixed bottom-0 left-0 right-0 z-50 h-4 overflow-x-auto overflow-y-hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          onScroll={syncTableFromBottom}
          aria-label="Scroll horizontal da tabela"
        >
          <div style={{ width: tableScrollWidth, height: 1 }} />
        </div>
      )}
    </div>
  );
}
