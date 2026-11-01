"use client";

import type { CSSProperties } from "react";
import { Link } from "@/i18n/navigation";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import { usePokemonName } from "@/hooks/use-pokemon-name";
import type { BaseStats, PokemonRow } from "@/lib/pokeapi";
import type { ExtraColumnId, StatsMode } from "./pokedex-filters";
import { EXTRA_COLUMN_OPTIONS } from "./pokedex-filters";
import type { ReactNode } from "react";

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

const STICKY_COLUMN_KEYS = ["select", "sprite", "id", "name"] as const;
const STICKY_LEFT_REM: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (const key of STICKY_COLUMN_KEYS) {
    out.push(acc);
    acc += COLUMN_WIDTH_REM[key];
  }
  return out;
})();

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

const MAX_SELECT_FOR_COMPARE = 6;

function getColumnWidthStyle(group: keyof typeof COLUMN_WIDTH_GROUPS): { width: string; minWidth: string } {
  const rem = COLUMN_WIDTH_REM[group];
  const s = `${rem}rem`;
  return { width: s, minWidth: s };
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

type SortKey = string;

type PokedexTableViewProps = {
  sorted: PokemonRow[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
  statsMode: StatsMode;
  statColumns: readonly string[];
  statLabels: Record<string, string>;
  effectiveExtraColumns: ExtraColumnId[];
  columnWidthKeys: (keyof typeof COLUMN_WIDTH_GROUPS)[];
  heightWeightUnit: "imperial" | "metric";
  renderAvailabilityPart: (part: string, p: PokemonRow) => ReactNode;
  getExtraColumnValue: (p: PokemonRow, id: ExtraColumnId, unit: "imperial" | "metric") => string | number;
};

function SortIcon({
  column,
  sortKey,
  sortDir,
}: {
  column: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
}) {
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
}

export function PokedexTableView({
  sorted,
  selectedIds,
  onToggleSelect,
  sortKey,
  sortDir,
  onSort,
  statsMode,
  statColumns,
  statLabels,
  effectiveExtraColumns,
  columnWidthKeys,
  heightWeightUnit,
  renderAvailabilityPart,
  getExtraColumnValue,
}: PokedexTableViewProps) {
  const getName = usePokemonName();
  const stats =
    statsMode === "base" ? "baseStats" : statsMode === "max" ? "maxStats" : "minStats";

  return (
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
            <button type="button" onClick={() => onSort("id")} className="inline-flex items-center hover:text-foreground">
              ID
              <SortIcon column="id" sortKey={sortKey} sortDir={sortDir} />
            </button>
          </TableHead>
          <TableHead style={{ ...getColumnWidthStyle("name"), ...getStickyCellStyle(3) }} className="group whitespace-nowrap overflow-hidden shrink-0">
            <button type="button" onClick={() => onSort("name")} className="inline-flex items-center hover:text-foreground">
              Name
              <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} />
            </button>
          </TableHead>
          <TableHead style={getColumnWidthStyle("type")} className="group whitespace-nowrap overflow-hidden shrink-0">
            <button type="button" onClick={() => onSort("type")} className="inline-flex items-center hover:text-foreground">
              Type
              <SortIcon column="type" sortKey={sortKey} sortDir={sortDir} />
            </button>
          </TableHead>
          {statColumns.map((key) => (
            <TableHead key={key} style={getColumnWidthStyle("statsEach")} className="group whitespace-nowrap overflow-hidden shrink-0">
              {key === "bst" ? (
                <button type="button" onClick={() => onSort(key)} className="inline-flex items-center hover:text-foreground">
                  {statLabels[key]}
                  <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                </button>
              ) : (
                <button type="button" onClick={() => onSort(key)} className="inline-flex items-center hover:text-foreground">
                  {statLabels[key]}
                  <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                </button>
              )}
            </TableHead>
          ))}
          {effectiveExtraColumns.map((id) => {
            const opt = EXTRA_COLUMN_OPTIONS.find((o) => o.id === id);
            const widthGroup = EXTRA_COLUMN_GROUP[id];
            const widthGroupKey = widthGroup === "stats" ? "statsEach" : widthGroup;
            return (
              <TableHead
                key={id}
                style={getColumnWidthStyle(widthGroupKey)}
                className={cn(id === "availability" && "px-1.5", "group whitespace-nowrap overflow-hidden shrink-0")}
              >
                <button type="button" onClick={() => onSort(id)} className="inline-flex items-center hover:text-foreground">
                  {opt?.label ?? id}
                  <SortIcon column={id} sortKey={sortKey} sortDir={sortDir} />
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
                  onCheckedChange={() => onToggleSelect(p.id)}
                  disabled={selectedIds.length >= MAX_SELECT_FOR_COMPARE && !selectedIds.includes(p.id)}
                  aria-label={`Select ${getName(p)} for comparison`}
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
                  aria-label={p.cryUrl ? `Play ${getName(p)} cry` : undefined}
                >
                  <Avatar size="lg" className="overflow-hidden rounded-full border border-border bg-muted pointer-events-none">
                    {p.spriteUrl ? (
                      <AvatarImage
                        src={p.spriteUrl}
                        alt={getName(p)}
                        className="size-full object-contain object-center [transform-origin:center]"
                      />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {getName(p).slice(0, 2)}
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
              <Link href={`/pokemon/${p.id}`} className="text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                {getName(p)}
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
                  <span className="font-medium">
                    {p[stats][key as keyof BaseStats]}
                  </span>
                ) : (
                  p[stats][key as keyof BaseStats]
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
  );
}
