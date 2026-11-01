"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import { Columns2, Search, ChevronDown, LayoutGrid, Sparkles, Table } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

const FILTER_BUTTON_WIDTH = "min-w-[8.5rem] w-[8.5rem]";

/** All extra columns (Availability is fixed at end; not in select). */
const EXTRA_COLUMN_OPTIONS = [
  { id: "availability", label: "Availability" },
  { id: "baseExp", label: "Base Exp." },
  { id: "catchRate", label: "Catch rate" },
  { id: "evYield", label: "EV yield" },
  { id: "baseFriendship", label: "Friendship" },
  { id: "growthRate", label: "Growth Rate" },
  { id: "height", label: "Height" },
  { id: "weight", label: "Weight" },
] as const;

/** Columns that can be toggled in the Columns popover (excludes Availability). */
const SELECTABLE_EXTRA_COLUMN_OPTIONS = EXTRA_COLUMN_OPTIONS.filter((o) => o.id !== "availability");

/** EV yield filter options (same order as stats). */
const EV_YIELD_OPTIONS = ["HP", "Atk", "Def", "Sp. Atk", "Sp. Def", "Speed"] as const;

/** Availability filter options: [Wild], [Acquisition], [Exclusives], [Evolutions], [Especial]. */
export const AVAILABILITY_GROUPS: { label: string; options: { value: string; label: string }[] }[] = [
  {
    label: "Wild",
    options: [
      { value: "Grass", label: "Grass" },
      { value: "Surf", label: "Surf" },
      { value: "Fishing", label: "Fishing" },
      { value: "Static", label: "Static" },
    ],
  },
  {
    label: "Acquisition",
    options: [
      { value: "NPC Trade", label: "NPC Trade" },
      { value: "Gift", label: "Gift" },
      { value: "Game Corner", label: "Game Corner" },
      { value: "Purchase", label: "Purchase" },
      { value: "Fossil", label: "Fossil" },
    ],
  },
  {
    label: "Exclusives",
    options: [
      { value: "FR Only", label: "FR Only" },
      { value: "LG Only", label: "LG Only" },
    ],
  },
  {
    label: "Evolutions",
    options: [
      { value: "Level", label: "By Level" },
      { value: "Trade Evo", label: "Trade Evo" },
      { value: "Fire Stone", label: "Fire Stone" },
      { value: "Water Stone", label: "Water Stone" },
      { value: "Thunder Stone", label: "Thunder Stone" },
      { value: "Leaf Stone", label: "Leaf Stone" },
      { value: "Moon Stone", label: "Moon Stone" },
    ],
  },
  {
    label: "Especial",
    options: [
      { value: "Event", label: "Event" },
    ],
  },
];

/** Flat list of all availability values (for initial selection and filtering). */
export const ALL_AVAILABILITY_VALUES = AVAILABILITY_GROUPS.flatMap((g) => g.options.map((o) => o.value));

export type ExtraColumnId = (typeof EXTRA_COLUMN_OPTIONS)[number]["id"];
export type StatsMode = "base" | "max" | "min";

export type PokedexViewMode = "compare" | "card" | "table";

type PokedexFiltersProps = {
  viewMode: PokedexViewMode;
  onViewModeChange: (v: PokedexViewMode) => void;
  /** Card view only: show shiny sprites when true */
  cardViewShiny?: boolean;
  onCardViewShinyChange?: (v: boolean) => void;
  search: string;
  onSearchChange: (v: string) => void;
  allTypes: string[];
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  onSelectAllTypes: () => void;
  statsMode: StatsMode;
  onStatsModeChange: (v: StatsMode) => void;
  extraColumns: ExtraColumnId[];
  onToggleExtraColumn: (id: ExtraColumnId) => void;
  onRemoveAllColumns: () => void;
  /** EV yield filter – only used when evYield column is visible */
  selectedEvYields: string[];
  onToggleEvYield: (label: string) => void;
  onSelectAllEvYields: () => void;
  /** Growth rate filter – only used when growthRate column is visible (multi-select like Columns) */
  selectedGrowthRates: string[];
  onToggleGrowthRate: (value: string) => void;
  onSelectAllGrowthRates: () => void;
  allGrowthRates: { value: string; label: string }[];
  /** Height/Weight unit – only shown when height or weight column is visible */
  heightWeightUnit: "imperial" | "metric";
  onHeightWeightUnitChange: (v: "imperial" | "metric") => void;
  showHeightWeightToggle: boolean;
  /** Availability filter – only when Availability column is visible; options grouped by Capture / Evolution / Special */
  selectedAvailability: string[];
  onToggleAvailability: (value: string) => void;
  onSelectAllAvailability: () => void;
  availabilityGroups: typeof AVAILABILITY_GROUPS;
  onRemoveFilters: () => void;
};

export function PokedexFilters({
  viewMode,
  onViewModeChange,
  cardViewShiny = false,
  onCardViewShinyChange,
  search,
  onSearchChange,
  allTypes,
  selectedTypes,
  onToggleType,
  onSelectAllTypes,
  statsMode,
  onStatsModeChange,
  extraColumns,
  onToggleExtraColumn,
  onRemoveAllColumns,
  selectedEvYields,
  onToggleEvYield,
  onSelectAllEvYields,
  selectedGrowthRates,
  onToggleGrowthRate,
  onSelectAllGrowthRates,
  allGrowthRates,
  heightWeightUnit,
  onHeightWeightUnitChange,
  showHeightWeightToggle,
  selectedAvailability,
  onToggleAvailability,
  onSelectAllAvailability,
  availabilityGroups,
  onRemoveFilters,
}: PokedexFiltersProps) {
  const t = useTranslations("Pokedex");
  const hasTypeFilter = selectedTypes.length > 0 && selectedTypes.length < allTypes.length;
  const typeCountLabel =
    hasTypeFilter ? (
      <span className="text-xs font-semibold text-primary">{selectedTypes.length}</span>
    ) : null;
  const hasColumnsActive = extraColumns.length > 0;
  const columnsCountLabel =
    hasColumnsActive ? (
      <span className="text-xs font-semibold text-primary">{extraColumns.length}</span>
    ) : null;
  const showEvYieldFilter = extraColumns.includes("evYield") || viewMode === "card";
  const hasEvYieldFilter =
    selectedEvYields.length > 0 && selectedEvYields.length < EV_YIELD_OPTIONS.length;
  const evYieldCountLabel =
    hasEvYieldFilter ? (
      <span className="text-xs font-semibold text-primary">{selectedEvYields.length}</span>
    ) : null;
  const showGrowthRateFilter = extraColumns.includes("growthRate") || viewMode === "card";
  const hasGrowthRateFilter =
    showGrowthRateFilter &&
    selectedGrowthRates.length > 0 &&
    selectedGrowthRates.length < allGrowthRates.length;
  const growthRateCountLabel =
    hasGrowthRateFilter ? (
      <span className="text-xs font-semibold text-primary">{selectedGrowthRates.length}</span>
    ) : null;
  const allAvailabilityValues = availabilityGroups.flatMap((g) => g.options.map((o) => o.value));
  const hasAvailabilityFilter =
    selectedAvailability.length > 0 && selectedAvailability.length < allAvailabilityValues.length;
  const availabilityCountLabel =
    hasAvailabilityFilter ? (
      <span className="text-xs font-semibold text-primary">{selectedAvailability.length}</span>
    ) : null;
  const hasActiveFilters =
    search.trim() !== "" ||
    (allTypes.length > 0 && selectedTypes.length < allTypes.length) ||
    extraColumns.length > 0 ||
    (showEvYieldFilter && selectedEvYields.length < EV_YIELD_OPTIONS.length) ||
    (allGrowthRates.length > 0 && selectedGrowthRates.length < allGrowthRates.length) ||
    selectedAvailability.length < allAvailabilityValues.length;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 0. Card / Table / Compare view toggle */}
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(v) => v && onViewModeChange(v as PokedexViewMode)}
        variant="outline"
        className="shadow-xs"
      >
        <ToggleGroupItem
          value="card"
          aria-label={t("cards")}
          className="bg-background dark:bg-input/30 data-[state=on]:!bg-accent data-[state=on]:!text-accent-foreground"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex size-full items-center justify-center">
                <LayoutGrid className="size-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("cards")}</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="table"
          aria-label={t("table")}
          className="bg-background dark:bg-input/30 data-[state=on]:!bg-accent data-[state=on]:!text-accent-foreground"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex size-full items-center justify-center">
                <Table className="size-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("table")}</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="compare"
          aria-label={t("compare")}
          className="bg-background dark:bg-input/30 data-[state=on]:!bg-accent data-[state=on]:!text-accent-foreground"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex size-full items-center justify-center">
                <Columns2 className="size-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("compare")}</TooltipContent>
          </Tooltip>
        </ToggleGroupItem>
      </ToggleGroup>

      {viewMode === "card" && onCardViewShinyChange != null && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              variant="outline"
              size="default"
              pressed={cardViewShiny}
              onPressedChange={onCardViewShinyChange}
              aria-label="Shiny"
              className={cn(cardViewShiny && "!bg-muted !text-foreground")}
            >
              <Sparkles className="size-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Shiny</TooltipContent>
        </Tooltip>
      )}

      {/* 1. Search */}
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* 2. Types – hidden in Compare view */}
      {viewMode !== "compare" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(FILTER_BUTTON_WIDTH, "justify-between !border-border font-normal")}>
              <span className="inline-flex items-center gap-1.5">
                Types
                {typeCountLabel != null && (
                  <>
                    {" "}
                    {typeCountLabel}
                  </>
                )}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-sm border-border p-2" align="start">
            <div className="flex max-h-[280px] flex-wrap gap-1 overflow-y-auto">
              {allTypes.map((type) => {
                const active = selectedTypes.includes(type);
                return (
                  <Badge
                    key={type}
                    variant="outline"
                    className={cn(
                      "cursor-pointer capitalize border text-xs transition-opacity",
                      getTypeBadgeClassName(type),
                      !active && "opacity-30"
                    )}
                    onClick={() => onToggleType(type)}
                  >
                    {type}
                  </Badge>
                );
              })}
              {hasTypeFilter && (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-border text-xs font-normal"
                  onClick={onSelectAllTypes}
                >
                  Select all
                </Badge>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* 3. Stats mode */}
      <Select
        value={statsMode}
        onValueChange={(v) => onStatsModeChange(v as StatsMode)}
      >
        <SelectTrigger className={cn(FILTER_BUTTON_WIDTH, "!border-border font-normal [&_svg]:text-primary")}>
          <SelectValue placeholder="Stats" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="base">Base Stats</SelectItem>
          <SelectItem value="max">Max. Stats</SelectItem>
          <SelectItem value="min">Min. Stats</SelectItem>
        </SelectContent>
      </Select>

      {/* 4. Columns – hidden in Card view (all columns considered active) */}
      {viewMode === "table" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(FILTER_BUTTON_WIDTH, "justify-between !border-border font-normal")}>
              <span className="inline-flex items-center gap-1.5">
                Columns
                {columnsCountLabel != null && (
                  <>
                    {" "}
                    {columnsCountLabel}
                  </>
                )}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 border-border p-2" align="start">
            <div className="flex flex-col gap-1">
              {SELECTABLE_EXTRA_COLUMN_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm font-normal hover:bg-accent"
                >
                  <Checkbox
                    checked={extraColumns.includes(opt.id)}
                    onCheckedChange={() => onToggleExtraColumn(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {hasColumnsActive && (
              <div className="mt-2 flex gap-1 border-t border-border pt-2">
                <Button type="button" variant="ghost" size="sm" className="h-7 w-full text-xs font-normal" onClick={onRemoveAllColumns}>
                  Remove all
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* 5. EV yield filter – only when EV yield column is visible */}
      {showEvYieldFilter && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(FILTER_BUTTON_WIDTH, "justify-between !border-border font-normal")}>
              <span className="inline-flex items-center gap-1.5">
                EV yield
                {evYieldCountLabel != null && (
                  <>
                    {" "}
                    {evYieldCountLabel}
                  </>
                )}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 border-border p-2" align="start">
            <div className="flex flex-col gap-1">
              {EV_YIELD_OPTIONS.map((label) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm font-normal hover:bg-muted"
                >
                  <Checkbox
                    checked={selectedEvYields.includes(label)}
                    onCheckedChange={() => onToggleEvYield(label)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {hasEvYieldFilter && (
            <div className="mt-2 flex gap-1 border-t border-border pt-2">
              <Button type="button" variant="ghost" size="sm" className="h-7 w-full text-xs font-normal" onClick={onSelectAllEvYields}>
                Select all
              </Button>
            </div>
          )}
          </PopoverContent>
        </Popover>
      )}

      {/* 6. Growth rate filter – only when Growth Rate column is visible (multi-select like Columns) */}
      {showGrowthRateFilter && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(FILTER_BUTTON_WIDTH, "justify-between !border-border font-normal")}>
              <span className="inline-flex items-center gap-1.5">
                Growth rate
                {growthRateCountLabel != null && (
                  <>
                    {" "}
                    {growthRateCountLabel}
                  </>
                )}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 border-border p-2" align="start">
            <div className="flex flex-col gap-1">
              {allGrowthRates.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm font-normal hover:bg-muted"
                >
                  <Checkbox
                    checked={selectedGrowthRates.includes(value)}
                    onCheckedChange={() => onToggleGrowthRate(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
            {hasGrowthRateFilter && (
            <div className="mt-2 flex gap-1 border-t border-border pt-2">
              <Button type="button" variant="ghost" size="sm" className="h-7 w-full text-xs font-normal" onClick={onSelectAllGrowthRates}>
                Select all
              </Button>
            </div>
          )}
          </PopoverContent>
        </Popover>
      )}

      {/* 7. Height/Weight unit – only when height or weight column is visible; shows active label, click to switch */}
      {showHeightWeightToggle && (
        <Toggle
          variant="outline"
          className="h-9 w-fit min-w-0 px-3 font-normal !border-border bg-background dark:bg-input/30 shadow-xs hover:bg-accent dark:hover:bg-input/50 data-[state=on]:!bg-background dark:data-[state=on]:!bg-input/30 data-[state=on]:!text-foreground"
          pressed={true}
          aria-label={`Unit: ${heightWeightUnit}. Click to switch to ${heightWeightUnit === "imperial" ? "Metric" : "Imperial"}.`}
          onPressedChange={() =>
            onHeightWeightUnitChange(heightWeightUnit === "imperial" ? "metric" : "imperial")
          }
        >
          {heightWeightUnit === "imperial" ? "Imperial" : "Metric"}
        </Toggle>
      )}

      {/* Availability filter – hidden in Compare view */}
      {viewMode !== "compare" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(FILTER_BUTTON_WIDTH, "justify-between !border-border font-normal")}>
              <span className="inline-flex items-center gap-1.5">
                Availability
                {availabilityCountLabel != null && (
                  <>
                    {" "}
                    {availabilityCountLabel}
                  </>
                )}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-sm border-border p-2" align="start">
            <div className="flex flex-col gap-3">
              {availabilityGroups.map((group) => (
                <div key={group.label}>
                  <div className="mb-1.5 px-0.5 text-xs font-semibold text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.options.map((opt) => {
                      const active = selectedAvailability.includes(opt.value);
                      return (
                        <Badge
                          key={opt.value}
                          variant={active ? "secondary" : "outline"}
                          className={cn(
                            "cursor-pointer text-xs font-normal transition-opacity",
                            !active && "border-transparent opacity-60 hover:opacity-100"
                          )}
                          onClick={() => onToggleAvailability(opt.value)}
                        >
                          {opt.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
              {hasAvailabilityFilter && (
                <div className="flex flex-wrap gap-1.5 border-t border-border pt-2">
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-transparent text-xs font-normal opacity-70 hover:opacity-100"
                    onClick={onSelectAllAvailability}
                  >
                    Select all
                  </Badge>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground text-xs font-semibold" onClick={onRemoveFilters}>
          Remove filters
        </Button>
      )}
    </div>
  );
}

export { EXTRA_COLUMN_OPTIONS, EV_YIELD_OPTIONS };
