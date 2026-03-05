"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowUp, ArrowUpDown, X } from "lucide-react";
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
  type PokedexViewMode,
  type StatsMode,
} from "./pokedex-filters";
import { getPokemonDisplayName } from "@/lib/api-adjustments";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { SectionTableLayout } from "@/components/section-table-layout";
import Tilt from "react-parallax-tilt";

const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed", "bst"] as const;
/** Stat columns without total (BST) – used when Max/Min Stats are active; MST column hidden. */
const STAT_KEYS_NO_TOTAL = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
type StatKey = (typeof STAT_KEYS)[number];
type SortKey = "id" | "name" | "type" | StatKey | ExtraColumnId;
type SortDir = "asc" | "desc";

const MAX_SELECT_FOR_COMPARE = 6;

/** Pokémon that get glare effect on the card (Parallax Tilt). */
const POKEMON_WITH_GLARE = new Set(["articuno", "zapdos", "moltres", "mewtwo", "mew"]);

/** Glare color per legendary (CSS color). */
const LEGENDARY_GLARE_COLOR: Record<string, string> = {
  articuno: "lightblue",
  zapdos: "lightyellow",
  moltres: "lightcoral",
  mewtwo: "plum",
  mew: "lightpink",
};

/**
 * Largura fixa de cada coluna em rem. Altere os valores aqui para mudar a largura;
 * são aplicados via style para ter prioridade sobre outras regras.
 */
const COLUMN_WIDTH_REM: Record<keyof typeof COLUMN_WIDTH_GROUPS, number> = {
  select: 2,
  sprite: 4,
  id: 3,
  name: 12,
  type: 10,
  statsEach: 4.5,
  heightWeight: 5.5,
  evYield: 9,
  growth: 8,
  availability: 15,
};

const COLUMN_WIDTH_GROUPS = {
  select: "select",
  sprite: "sprite",
  id: "id",
  name: "name",
  type: "type",
  statsEach: "statsEach",
  heightWeight: "heightWeight",
  evYield: "evYield",
  growth: "growth",
  availability: "availability",
} as const;

function getColumnWidthStyle(group: keyof typeof COLUMN_WIDTH_GROUPS): { width: string; minWidth: string } {
  const rem = COLUMN_WIDTH_REM[group];
  const s = `${rem}rem`;
  return { width: s, minWidth: s };
}

/** Colunas fixas no scroll horizontal (sticky). Ordem: select, sprite, id, name. */
const STICKY_COLUMN_KEYS = ["select", "sprite", "id", "name"] as const;
const STICKY_LEFT_REM: number[] = [];
let acc = 0;
for (const key of STICKY_COLUMN_KEYS) {
  STICKY_LEFT_REM.push(acc);
  acc += COLUMN_WIDTH_REM[key];
}

function getStickyCellStyle(columnIndex: number): CSSProperties {
  if (columnIndex >= STICKY_LEFT_REM.length) return {};
  const leftRem = STICKY_LEFT_REM[columnIndex];
  return {
    position: "sticky",
    left: `${leftRem}rem`,
    zIndex: 10 + columnIndex,
    backgroundColor: "hsl(var(--background))",
    boxShadow:
      columnIndex === STICKY_LEFT_REM.length - 1
        ? "2px 0 4px -2px rgba(0,0,0,0.1)"
        : "1px 0 0 0 hsl(var(--border))",
  };
}

/** Extra column id → width group */
const EXTRA_COLUMN_GROUP: Record<
  ExtraColumnId,
  "stats" | "heightWeight" | "evYield" | "growth" | "availability"
> = {
  baseExp: "stats",
  catchRate: "stats",
  evYield: "evYield",
  baseFriendship: "stats",
  height: "heightWeight",
  weight: "heightWeight",
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

/** API: height in dm, weight in hg. Unidade colada ao número (ex: 7m, 7kg, 7lbs). */
function formatHeight(heightDm: number, unit: "imperial" | "metric"): string {
  const m = heightDm / 10;
  if (unit === "metric") return `${m.toFixed(1)}m`;
  const totalInches = m * 39.37007874;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}′${String(inches).padStart(2, "0")}″`;
}

function formatWeight(weightHg: number, unit: "imperial" | "metric"): string {
  const kg = weightHg / 10;
  if (unit === "metric") return `${kg.toFixed(1)}kg`;
  const lbs = (kg * 2.20462).toFixed(1);
  return `${lbs}lbs`;
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<PokedexViewMode>("card");
  const [flippedCardId, setFlippedCardId] = useState<number | null>(null);
  const [cardViewShiny, setCardViewShiny] = useState(false);

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
      list = list.filter((p) => selectedGrowthRates.includes(p.growthRate));
    }
    if (selectedAvailability.length > 0) {
      list = list.filter((p) => {
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


  const statLabels = useMemo(() => getStatLabels(statsMode), [statsMode]);
  /** Only show BST column when Base Stats is active; hide MST for Max/Min. */
  const statColumns = statsMode === "base" ? STAT_KEYS : STAT_KEYS_NO_TOTAL;
  useEffect(() => {
    if (statsMode !== "base" && sortKey === "bst") setSortKey("id");
  }, [statsMode, sortKey]);

  /** Ordem e largura de cada coluna (para <colgroup>); larguras fixas assim não encolhem. */
  const columnWidthKeys = useMemo((): (keyof typeof COLUMN_WIDTH_GROUPS)[] => {
    const keys: (keyof typeof COLUMN_WIDTH_GROUPS)[] = ["select", "sprite", "id", "name", "type"];
    statColumns.forEach(() => keys.push("statsEach"));
    effectiveExtraColumns.forEach((id) => {
      const g = EXTRA_COLUMN_GROUP[id];
      keys.push(g === "stats" ? "statsEach" : g);
    });
    return keys;
  }, [statColumns, effectiveExtraColumns]);

  /** Selected Pokémon in selection order (for compare bar). Uses data so it doesn't depend on filters. */
  const selectedPokemon = useMemo(
    () => selectedIds.map((id) => data.find((p) => p.id === id)).filter(Boolean) as PokemonRow[],
    [selectedIds, data]
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECT_FOR_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const removeAllFilters = () => {
    setSearch("");
    setSelectedTypes([...allTypes]);
    setExtraColumns([]);
    setSelectedEvYields([...EV_YIELD_OPTIONS]);
    setSelectedGrowthRates(allGrowthRates.map((g) => g.value));
    setSelectedAvailability([...ALL_AVAILABILITY_VALUES]);
  };

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
    <>
      <SectionTableLayout
        title="Pokémon"
        count={sorted.length}
        filters={
          <PokedexFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        cardViewShiny={cardViewShiny}
        onCardViewShinyChange={setCardViewShiny}
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
        showHeightWeightToggle={viewMode === "card" || extraColumns.includes("height") || extraColumns.includes("weight")}
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
        onRemoveFilters={removeAllFilters}
          />
        }
      >
        {viewMode === "table" ? (
          sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <img
                src="/missing.webp"
                alt=""
                className="h-24 w-24 object-contain opacity-80"
              />
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  No results found
                </h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  No Pokémon match the current filters. Try removing some filters to see more results.
                </p>
              </div>
              <Button variant="outline" className="border-border" onClick={removeAllFilters}>
                Remove all filters
              </Button>
            </div>
          ) : (
        <table
          style={{
            width: "100%",
            minWidth: "max-content",
            tableLayout: "fixed",
          }}
          className={cn(
            "caption-bottom text-sm",
            "[&_th]:!bg-background [&_td]:!bg-background",
            "[&_thead_th]:[box-shadow:inset_0_-2px_0_0_hsl(var(--border))]",
            "[&_td]:border-b [&_td]:border-border [&_th]:border-b [&_th]:border-border",
            "[&_tbody_tr:last-child_td]:border-b-0",
            "[&_tbody_tr:hover_td]:!bg-muted",
            "[&_th]:px-1 [&_td]:px-1 [&_th]:text-left [&_td]:text-left [&_th]:font-normal [&_td]:text-sm"
          )}
        >
          <colgroup>
            {columnWidthKeys.map((key, i) => {
              const rem = COLUMN_WIDTH_REM[key];
              const w = `${rem}rem`;
              return <col key={i} style={{ width: w, minWidth: w }} />;
            })}
            {/* Coluna vazia que ocupa o espaço restante: linhas da row vão até o fim da área visível */}
            <col key="spacer" />
          </colgroup>
          <TableHeader>
            <TableRow
              className="!border-b-0"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 15,
                backgroundColor: "hsl(var(--background))",
              }}
            >
              <TableHead style={{ ...getColumnWidthStyle("select"), ...getStickyCellStyle(0) }} className="shrink-0" />
              <TableHead style={{ ...getColumnWidthStyle("sprite"), ...getStickyCellStyle(1) }} className="shrink-0 !bg-background" />
              <TableHead style={{ ...getColumnWidthStyle("id"), ...getStickyCellStyle(2) }} className="group whitespace-nowrap shrink-0">
                <button
                  type="button"
                  onClick={() => handleSort("id")}
                  className="inline-flex items-center hover:text-foreground"
                >
                  ID
                  <SortIcon column="id" />
                </button>
              </TableHead>
              <TableHead style={{ ...getColumnWidthStyle("name"), ...getStickyCellStyle(3) }} className="group whitespace-nowrap overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="inline-flex items-center hover:text-foreground"
                >
                  Name
                  <SortIcon column="name" />
                </button>
              </TableHead>
              <TableHead style={getColumnWidthStyle("type")} className="group whitespace-nowrap overflow-hidden shrink-0">
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
                <TableHead key={key} style={getColumnWidthStyle("statsEach")} className="group whitespace-nowrap overflow-hidden shrink-0">
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
                const widthGroupKey = widthGroup === "stats" ? "statsEach" : widthGroup;
                return (
                  <TableHead key={id} style={getColumnWidthStyle(widthGroupKey)} className={cn(id === "availability" && "px-1.5", "group whitespace-nowrap overflow-hidden shrink-0")}>
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
              <TableHead key="spacer" className="border-b border-border !bg-background" aria-hidden />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => (
              <TableRow key={p.id}>
                <TableCell style={{ ...getColumnWidthStyle("select"), ...getStickyCellStyle(0) }} className="py-1 align-middle shrink-0">
                  <label
                    htmlFor={`pokedex-select-${p.id}`}
                    className="flex min-h-full w-full cursor-pointer items-center justify-center py-2"
                  >
                    <Checkbox
                      id={`pokedex-select-${p.id}`}
                      checked={selectedIds.includes(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                      disabled={selectedIds.length >= MAX_SELECT_FOR_COMPARE && !selectedIds.includes(p.id)}
                      aria-label={`Select ${getPokemonDisplayName(p.name)} for comparison`}
                    />
                  </label>
                </TableCell>
                <TableCell style={{ ...getColumnWidthStyle("sprite"), ...getStickyCellStyle(1) }} className="py-1 shrink-0 align-middle !bg-background">
                  <div className="flex h-full min-h-full items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (p.cryUrl) {
                        const audio = new Audio(p.cryUrl);
                        audio.volume = 0.2;
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
                    <Avatar size="lg" className="overflow-hidden rounded-full border border-border bg-muted pointer-events-none">
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
                  </div>
                </TableCell>
                <TableCell style={{ ...getColumnWidthStyle("id"), ...getStickyCellStyle(2) }} className="font-mono text-muted-foreground tabular-nums shrink-0">
                  #{String(p.id).padStart(3, "0")}
                </TableCell>
                <TableCell style={{ ...getColumnWidthStyle("name"), ...getStickyCellStyle(3) }} className="font-medium truncate overflow-hidden shrink-0">
                  <Link
                    href={`/pokedex/${p.name}`}
                    className="text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {getPokemonDisplayName(p.name)}
                  </Link>
                </TableCell>
                <TableCell style={getColumnWidthStyle("type")} className="overflow-hidden shrink-0">
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
                    style={getColumnWidthStyle("statsEach")}
                    className="font-mono tabular-nums text-muted-foreground overflow-hidden shrink-0"
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
                  const widthGroupKey = widthGroup === "stats" ? "statsEach" : widthGroup;
                  return (
                  <TableCell
                    key={id}
                    style={getColumnWidthStyle(widthGroupKey)}
                    className={cn(
                      id === "availability" && "px-1.5",
                      "overflow-hidden shrink-0",
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
                <TableCell key="spacer" className="border-b border-border !bg-background py-1" aria-hidden />
              </TableRow>
            ))}
          </TableBody>
        </table>
          )
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <img
              src="/missing.webp"
              alt=""
              className="h-24 w-24 object-contain opacity-80"
            />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                No results found
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                No Pokémon match the current filters. Try removing some filters to see more results.
              </p>
            </div>
            <Button variant="outline" className="border-border" onClick={removeAllFilters}>
              Remove all filters
            </Button>
          </div>
        ) : (
          <div className="@container w-full p-6">
            <div className="grid grid-cols-2 gap-4 items-start @[24rem]:grid-cols-3 @[32rem]:grid-cols-4 @[40rem]:grid-cols-5 @[48rem]:grid-cols-6 @[56rem]:grid-cols-7 @[64rem]:grid-cols-8">
            {sorted.map((p) => {
              const hasGlare = POKEMON_WITH_GLARE.has(p.name);
              const isSelected = selectedIds.includes(p.id);
              const isFlipped = flippedCardId === p.id;
              const cardSpriteUrl = cardViewShiny && p.spriteUrlShiny ? p.spriteUrlShiny : p.spriteUrl;
              const toggleFlip = () => {
                setFlippedCardId((prev) => (prev === p.id ? null : p.id));
              };
              return (
              <div key={p.id} className="group relative">
                <div className="block rounded-lg">
                  <Tilt
                    tiltMaxAngleX={20}
                    tiltMaxAngleY={20}
                    perspective={800}
                    glareEnable={hasGlare}
                    glareMaxOpacity={0.55}
                    glareColor={hasGlare ? LEGENDARY_GLARE_COLOR[p.name] ?? "white" : "white"}
                    glareBorderRadius="0.5rem"
                  >
                    <div
                      className="relative cursor-pointer [perspective:1000px]"
                      onClick={toggleFlip}
                    >
                      {!isFlipped && (selectedIds.length < MAX_SELECT_FOR_COMPARE || isSelected) && (
                        <div
                          className={cn(
                            "absolute left-2 top-2.5 z-20 px-1.5 py-0.5 bg-background rounded-sm  border-border transition-opacity",
                            "opacity-0 group-hover:opacity-100",
                            isSelected && "opacity-100"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          role="presentation"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(p.id)}
                            aria-label={`Select ${getPokemonDisplayName(p.name)} for comparison`}
                            className="border-border"
                          />
                        </div>
                      )}
                      <div
                        className={cn(
                          "relative w-full transition-transform duration-300 [transform-style:preserve-3d]",
                          isFlipped && "[transform:rotateY(180deg)]"
                        )}
                      >
                        <div
                          className={cn(
                            "flex min-h-[220px] flex-col gap-2 rounded-xl border bg-card px-4 py-4 shadow-none [backface-visibility:hidden]",
                            isSelected ? "border-primary" : "border-border",
                            isFlipped && "pointer-events-none"
                          )}
                        >
                      <div className="relative flex min-h-[100px] w-full items-center justify-center rounded-lg p-3">
                        <div className="absolute inset-0 rounded-lg bg-muted/50 mix-blend-multiply" aria-hidden />
                        <div className="relative z-10 flex items-center justify-center">
                        {cardSpriteUrl ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (p.cryUrl) {
                                const audio = new Audio(p.cryUrl);
                                audio.volume = 0.3;
                                audio.play().catch(() => {});
                              }
                            }}
                            disabled={!p.cryUrl}
                            className={cn(
                              "rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border-0 bg-transparent p-0",
                              p.cryUrl && "cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                            )}
                            aria-label={p.cryUrl ? `Play ${getPokemonDisplayName(p.name)} cry` : undefined}
                          >
                            <Tilt
                              tiltReverse
                              tiltMaxAngleX={15}
                              tiltMaxAngleY={15}
                              perspective={800}
                              className="inline-block"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cardSpriteUrl}
                                alt={getPokemonDisplayName(p.name)}
                                width={96}
                                height={96}
                                className="object-contain pointer-events-none"
                              />
                            </Tilt>
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                        </div>
                      </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        #{String(p.id).padStart(3, "0")}
                      </span>
                      <Link
                        href={`/pokedex/${p.name}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-block w-fit max-w-full truncate font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {getPokemonDisplayName(p.name)}
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {p.types.map((t) => (
                        <span
                          key={t}
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium capitalize",
                            getTypeBadgeClassName(t)
                          )}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{formatHeight(p.height, heightWeightUnit)}</span>
                        </TooltipTrigger>
                        <TooltipContent>Height</TooltipContent>
                      </Tooltip>
                      <span aria-hidden>·</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{formatWeight(p.weight, heightWeightUnit)}</span>
                        </TooltipTrigger>
                        <TooltipContent>Weight</TooltipContent>
                      </Tooltip>
                    </p>
                    <p className="truncate text-xs text-muted-foreground" title={p.availability}>
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
                    </p>
                        </div>
                        <div
                          className={cn(
                            "absolute inset-0 flex flex-col gap-1 rounded-xl border bg-card px-4 py-4 shadow-none [backface-visibility:hidden] [transform:rotateY(180deg)]",
                            isSelected ? "border-primary" : "border-border"
                          )}
                        >
                          {(() => {
                            const statsSource = statsMode === "base" ? p.baseStats : statsMode === "max" ? p.maxStats : p.minStats;
                            return (
                              <div className="flex flex-col gap-1 text-xs">
                                {statColumns.map((key) => (
                                  <span key={key} className="flex justify-between font-mono">
                                    <span className="text-muted-foreground">{statLabels[key]}</span>
                                    <span>{statsSource[key] ?? "—"}</span>
                                  </span>
                                ))}
                                <div className="my-1.5 border-t border-border" role="separator" />
                                <span className="flex justify-between font-mono">
                                  <span className="text-muted-foreground">Base Exp.</span>
                                  <span>{p.baseExperience ?? "—"}</span>
                                </span>
                                <span className="flex justify-between font-mono">
                                  <span className="text-muted-foreground">Catch rate</span>
                                  <span>{p.catchRate ?? "—"}</span>
                                </span>
                                <span className="flex justify-between">
                                  <span className="text-muted-foreground">EV Yield</span>
                                  <span className="truncate">{p.evYield ?? "—"}</span>
                                </span>
                                <span className="flex justify-between font-mono">
                                  <span className="text-muted-foreground">Friendship</span>
                                  <span>{p.baseFriendship ?? "—"}</span>
                                </span>
                                <span className="flex justify-between">
                                  <span className="text-muted-foreground">Growth rate</span>
                                  <span>{p.growthRate ? p.growthRate.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—"}</span>
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </Tilt>
                </div>
              </div>
            );
            })}
            </div>
          </div>
        )}
      </SectionTableLayout>

      {/* Barra de seleção para comparar (estilo Sonner, bottom center) */}
      {selectedPokemon.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-popover px-4 py-3 shadow-lg"
          role="status"
          aria-label="Pokémon selected for comparison"
        >
          <div className="flex items-center gap-2">
            {selectedPokemon.map((p, i) => (
              <Fragment key={p.id}>
                {i > 0 && <Separator orientation="vertical" className="h-8 shrink-0" />}
                <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggleSelect(p.id)}
                    className="group relative flex shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Remove ${getPokemonDisplayName(p.name)} from selection`}
                  >
                    <Avatar size="lg" className="size-10 overflow-hidden rounded-full border border-border bg-muted">
                      {p.spriteUrl ? (
                        <AvatarImage
                          src={p.spriteUrl}
                          alt={getPokemonDisplayName(p.name)}
                          className="size-full object-contain object-center"
                        />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {getPokemonDisplayName(p.name).slice(0, 2)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <X className="size-3" />
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {getPokemonDisplayName(p.name)}
                </TooltipContent>
              </Tooltip>
              </Fragment>
            ))}
          </div>
          <Separator orientation="vertical" className="h-8 shrink-0" />
          <div className="flex items-center gap-1 pl-1">
            <Button size="sm" asChild>
              <Link href={`/pokedex/compare?ids=${selectedIds.join(",")}`}>
                Compare
              </Link>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0"
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
