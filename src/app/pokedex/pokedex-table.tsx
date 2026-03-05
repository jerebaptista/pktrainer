"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { PokedexCompareView } from "./pokedex-compare-view";
import { PokedexCardView } from "./pokedex-card-view";
import { PokedexTableView } from "./pokedex-table-view";

const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed", "bst"] as const;
/** Stat columns without total (BST) – used when Max/Min Stats are active; MST column hidden. */
const STAT_KEYS_NO_TOTAL = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
type StatKey = (typeof STAT_KEYS)[number];
type SortKey = "id" | "name" | "type" | StatKey | ExtraColumnId;
type SortDir = "asc" | "desc";

const MAX_SELECT_FOR_COMPARE = 6;

/** Extra column id → width group (used for columnWidthKeys). */
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

/** Used for columnWidthKeys type (keyof typeof COLUMN_WIDTH_GROUPS). */
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
      queueMicrotask(() => {
        setSelectedTypes([...allTypes]);
      });
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
  const lastViewBeforeCompareRef = useRef<PokedexViewMode>("card");
  const [flippedCardId, setFlippedCardId] = useState<number | null>(null);
  const [cardViewShiny, setCardViewShiny] = useState(false);
  const [compareBarDragOverIndex, setCompareBarDragOverIndex] = useState<number | null>(null);

  const allGrowthRates = useMemo(() => {
    const raw = [...new Set(data.map((p) => p.growthRate).filter(Boolean))].sort();
    return raw.map((value) => ({
      value,
      label: value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }, [data]);

  useEffect(() => {
    if (allGrowthRates.length > 0 && !growthRatesInitialized.current) {
      queueMicrotask(() => {
        setSelectedGrowthRates(allGrowthRates.map((g) => g.value));
      });
      growthRatesInitialized.current = true;
    }
  }, [allGrowthRates]);

  useEffect(() => {
    if (viewMode === "card" || viewMode === "table") {
      lastViewBeforeCompareRef.current = viewMode;
    }
  }, [viewMode]);

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
    if (statsMode !== "base" && sortKey === "bst") {
      queueMicrotask(() => setSortKey("id"));
    }
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

  const reorderSelection = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setSelectedIds((prev) => {
      const next = [...prev];
      const [id] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, id);
      return next;
    });
  };

  const removeAllFilters = () => {
    setSearch("");
    setSelectedTypes([...allTypes]);
    setExtraColumns([]);
    setSelectedEvYields([...EV_YIELD_OPTIONS]);
    setSelectedGrowthRates(allGrowthRates.map((g) => g.value));
    setSelectedAvailability([...ALL_AVAILABILITY_VALUES]);
  };

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

  return (
    <>
      <SectionTableLayout
        title="Pokémon"
        count={viewMode === "compare" ? selectedPokemon.length : sorted.length}
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
        {viewMode === "compare" ? (
          <PokedexCompareView selectedPokemon={selectedPokemon} />
        ) : viewMode === "table" ? (
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
            <PokedexTableView
              sorted={sorted}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={(key) => handleSort(key as SortKey)}
              statsMode={statsMode}
              statColumns={statColumns}
              statLabels={statLabels}
              effectiveExtraColumns={effectiveExtraColumns}
              columnWidthKeys={columnWidthKeys}
              heightWeightUnit={heightWeightUnit}
              renderAvailabilityPart={renderAvailabilityPart}
              getExtraColumnValue={getExtraColumnValue}
            />
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
          <PokedexCardView
            sorted={sorted}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            flippedCardId={flippedCardId}
            onFlippedCardIdChange={setFlippedCardId}
            cardViewShiny={cardViewShiny}
            statsMode={statsMode}
            statColumns={statColumns}
            statLabels={statLabels}
            heightWeightUnit={heightWeightUnit}
            renderAvailabilityPart={renderAvailabilityPart}
            formatHeight={formatHeight}
            formatWeight={formatWeight}
          />
        )}
      </SectionTableLayout>

      {/* Barra de seleção para comparar (estilo Sonner, bottom center) */}
      {selectedPokemon.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-popover px-4 py-3 shadow-lg"
          role="status"
          aria-label="Pokémon selected for comparison"
        >
          <div
            className="flex items-center gap-2"
            onDragLeave={(e) => {
              const related = e.relatedTarget as Node | null;
              if (!related || !e.currentTarget.contains(related)) {
                setCompareBarDragOverIndex(null);
              }
            }}
          >
            {selectedPokemon.map((p, i) => (
              <Fragment key={p.id}>
                {i > 0 && <Separator orientation="vertical" className="h-8 shrink-0" />}
                <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    draggable
                    onClick={() => toggleSelect(p.id)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(i));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setCompareBarDragOverIndex(i);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setCompareBarDragOverIndex(null);
                      const fromIndex = Number(e.dataTransfer.getData("text/plain"));
                      if (!Number.isNaN(fromIndex) && fromIndex !== i) {
                        reorderSelection(fromIndex, i);
                      }
                    }}
                    onDragEnd={() => setCompareBarDragOverIndex(null)}
                    className="group relative flex shrink-0 cursor-grab rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                    aria-label={`${getPokemonDisplayName(p.name)} – drag to reorder, click to remove`}
                  >
                    {compareBarDragOverIndex === i && (
                      <span
                        className="absolute inset-0 z-0 flex size-10 shrink-0 items-center justify-center rounded-full bg-muted"
                        aria-hidden
                      />
                    )}
                    <Avatar
                      size="lg"
                      className={cn(
                        "relative z-10 size-10 overflow-hidden rounded-full border border-border bg-muted pointer-events-none transition-opacity",
                        compareBarDragOverIndex === i && "opacity-60"
                      )}
                    >
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
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
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
            {viewMode === "compare" && selectedPokemon.length < MAX_SELECT_FOR_COMPARE && (
              <>
                {selectedPokemon.length > 0 && (
                  <Separator orientation="vertical" className="h-8 shrink-0" />
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setViewMode(lastViewBeforeCompareRef.current ?? "card")}
                      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Add Pokémon to compare (switch to previous view)"
                    >
                      <Plus className="size-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Add Pokémon
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
          {viewMode !== "compare" && (
            <>
              <Separator orientation="vertical" className="h-8 shrink-0" />
              <div className="flex items-center gap-1 pl-1">
                <Button
                  size="sm"
                  onClick={() => {
                    lastViewBeforeCompareRef.current = viewMode;
                    setViewMode("compare");
                  }}
                >
                  Compare
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
            </>
          )}
        </div>
      )}
    </>
  );
}
