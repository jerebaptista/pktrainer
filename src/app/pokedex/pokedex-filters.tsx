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
import { Search, ChevronDown } from "lucide-react";

const FILTER_BUTTON_WIDTH = "min-w-[8.5rem] w-[8.5rem]";

const EXTRA_COLUMN_OPTIONS = [
  { id: "baseExp", label: "Base Exp." },
  { id: "catchRate", label: "Catch rate" },
  { id: "evYield", label: "EV yield" },
  { id: "baseFriendship", label: "Friendship" },
  { id: "growthRate", label: "Growth Rate" },
  { id: "height", label: "Height" },
  { id: "weight", label: "Weight" },
] as const;

export type ExtraColumnId = (typeof EXTRA_COLUMN_OPTIONS)[number]["id"];
export type StatsMode = "base" | "max" | "min";

type PokedexFiltersProps = {
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
  onSelectAllColumns: () => void;
  onSelectNoneColumns: () => void;
};

export function PokedexFilters({
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
  onSelectAllColumns,
  onSelectNoneColumns,
}: PokedexFiltersProps) {
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
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 1. Search */}
      <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
        <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search by ID or Name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* 2. Types: count only when 1–16 selected; "Select all" only when filter active */}
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

      {/* 4. Columns: count only when > 0; Select all / None below options */}
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
            {EXTRA_COLUMN_OPTIONS.map((opt) => (
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
          <div className="mt-2 flex gap-1 border-t border-border pt-2">
            <Button type="button" variant="ghost" size="sm" className="h-7 flex-1 text-xs font-normal" onClick={onSelectAllColumns}>
              Select all
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 flex-1 text-xs font-normal" onClick={onSelectNoneColumns}>
              None
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { EXTRA_COLUMN_OPTIONS };
