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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import type { MoveTableRow } from "@/lib/moves-table";

const FILTER_BUTTON_WIDTH = "min-w-[8.5rem] w-[8.5rem]";
const CATEGORY_OPTIONS = ["Physical", "Special", "Status"] as const;

type TabId = "level-up" | "tm-hm" | "breeding" | "tutor" | "special";

type MovesTableSectionProps = {
  tabId: TabId;
  rows: MoveTableRow[];
};

type SortKey = keyof MoveTableRow | "id";

function getSortValue(row: MoveTableRow, key: SortKey): string | number | null {
  const v = row[key as keyof MoveTableRow];
  if (v === undefined || v === null) return null;
  if (typeof v === "number") return v;
  return String(v);
}

export function MovesTableSection({ tabId, rows }: MovesTableSectionProps) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const defaultSortKey = tabId === "level-up" ? "level" : tabId === "tm-hm" ? "id" : "moveName";
  const [sortKey, setSortKey] = useState<SortKey>(defaultSortKey);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const allTypes = useMemo(() => [...new Set(rows.map((r) => r.type).filter(Boolean))].sort(), [rows]);
  const allCategories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(),
    [rows]
  );

  const hasTypeFilter = selectedTypes.length > 0 && selectedTypes.length < allTypes.length;
  const hasCategoryFilter =
    selectedCategories.length > 0 && selectedCategories.length < allCategories.length;

  const filtered = useMemo(() => {
    let list = rows;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.moveName.toLowerCase().includes(q) ||
          (r.id ?? "").toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }
    if (selectedTypes.length > 0) {
      list = list.filter((r) => selectedTypes.includes(r.type));
    }
    if (selectedCategories.length > 0) {
      list = list.filter((r) => selectedCategories.includes(r.category));
    }
    return list;
  }, [rows, search, selectedTypes, selectedCategories]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      const na = va === null ? -Infinity : (typeof va === "number" ? va : va);
      const nb = vb === null ? -Infinity : (typeof vb === "number" ? vb : vb);
      if (typeof na === "number" && typeof nb === "number") {
        return sortDir === "asc" ? na - nb : nb - na;
      }
      const sa = String(na);
      const sb = String(nb);
      const cmp = sa.localeCompare(sb, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      if (prev.length === 0) return [type];
      if (prev.includes(type)) {
        const next = prev.filter((t) => t !== type);
        return next.length === 0 ? [] : next;
      }
      return [...prev, type];
    });
  };
  const selectAllTypes = () => setSelectedTypes([]);
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      if (prev.length === 0) return [cat];
      if (prev.includes(cat)) {
        const next = prev.filter((c) => c !== cat);
        return next.length === 0 ? [] : next;
      }
      return [...prev, cat];
    });
  };
  const selectAllCategories = () => setSelectedCategories([]);

  const columns: { key: SortKey; label: string; show: boolean }[] = [];
  if (tabId === "level-up") {
    columns.push({ key: "level", label: "Lv", show: true });
  }
  if (tabId === "tm-hm") {
    columns.push({ key: "id", label: "ID", show: true });
  }
  columns.push({ key: "moveName", label: "Move", show: true });
  if (tabId === "tutor") {
    columns.push({ key: "location", label: "Location", show: true });
  }
  columns.push(
    { key: "type", label: "Type", show: true },
    { key: "category", label: "Category", show: true },
    { key: "power", label: "Power", show: true },
    { key: "accuracy", label: "Accuracy", show: true },
    { key: "pp", label: "PP", show: true }
  );

  const SortIcon = ({ column }: { column: SortKey }) => {
    const isActive = sortKey === column;
    return (
      <span className="ml-1 inline-flex">
        {!isActive ? (
          <ArrowUpDown className="size-3.5 opacity-0 group-hover:opacity-50" />
        ) : sortDir === "asc" ? (
          <ArrowUp className="size-3.5 text-primary" />
        ) : (
          <ArrowDown className="size-3.5 text-primary" />
        )}
      </span>
    );
  };

  const formatVal = (key: SortKey, value: unknown, row?: MoveTableRow): string => {
    if (value === null || value === undefined) return "—";
    if (key === "accuracy" && typeof value === "number") return `${value}%`;
    if (key === "moveName" && typeof value === "string") {
      return value.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return String(value);
  };

  const getCellClassName = (key: SortKey): string => {
    if (key === "moveName") return "text-foreground font-semibold";
    if (key === "level" || key === "id" || key === "power" || key === "accuracy" || key === "pp") {
      return "font-mono tabular-nums text-muted-foreground";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(FILTER_BUTTON_WIDTH, "justify-between !border-border font-normal")}
            >
              <span className="inline-flex items-center gap-1.5">
                Type
                {hasTypeFilter && (
                  <span className="text-xs font-semibold text-primary">{selectedTypes.length}</span>
                )}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-sm border-border p-2" align="start">
            <div className="flex max-h-[240px] flex-wrap gap-1 overflow-y-auto">
              {allTypes.map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn(
                    "cursor-pointer capitalize border text-xs",
                    getTypeBadgeClassName(type),
                    !(selectedTypes.length === 0 || selectedTypes.includes(type)) && "opacity-40"
                  )}
                  onClick={() => toggleType(type)}
                >
                  {type}
                </Badge>
              ))}
              {hasTypeFilter && (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-border text-xs"
                  onClick={selectAllTypes}
                >
                  Select all
                </Badge>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(FILTER_BUTTON_WIDTH, "justify-between !border-border font-normal")}
            >
              <span className="inline-flex items-center gap-1.5">
                Category
                {hasCategoryFilter && (
                  <span className="text-xs font-semibold text-primary">
                    {selectedCategories.length}
                  </span>
                )}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 border-border p-2" align="start">
            <div className="flex flex-col gap-1">
              {CATEGORY_OPTIONS.filter((c) => allCategories.includes(c)).map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedCategories.length === 0 || selectedCategories.includes(opt)}
                    onCheckedChange={() => toggleCategory(opt)}
                  />
                  {opt}
                </label>
              ))}
              {hasCategoryFilter && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 w-full text-xs"
                  onClick={selectAllCategories}
                >
                  Select all
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.filter((c) => c.show).map(({ key, label }) => (
                <TableHead key={key} className="whitespace-nowrap px-2 py-1.5 text-left font-medium">
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
                <TableCell colSpan={columns.filter((c) => c.show).length} className="py-8 text-center text-muted-foreground text-sm">
                  No moves found.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row, i) => (
                <TableRow key={`${row.moveName}-${row.level ?? row.id ?? i}`}>
                  {columns.filter((c) => c.show).map(({ key }) => (
                    <TableCell key={key} className={cn("px-2 py-1.5 text-sm", getCellClassName(key))}>
                      {key === "type" ? (
                        <Badge
                          variant="secondary"
                          className={cn("capitalize border text-xs", getTypeBadgeClassName(row.type))}
                        >
                          {row.type || "—"}
                        </Badge>
                      ) : key === "moveName" ? (
                        (row.effect != null || row.flavor != null) ? (
                          <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <span>
                                {formatVal(key, row.moveName, row)}
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent side="top" className="max-w-sm border-border p-3">
                              {row.effect != null && (
                                <p className="text-sm text-foreground">{row.effect}</p>
                              )}
                              {row.flavor != null && (
                                <p className={cn("text-xs text-muted-foreground", row.effect != null && "mt-2")}>
                                  {row.flavor}
                                </p>
                              )}
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          formatVal(key, row.moveName, row)
                        )
                      ) : (
                        formatVal(key, key === "id" ? row.id : row[key as keyof MoveTableRow], row)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
