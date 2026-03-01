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
import type { GlobalMoveRow } from "@/lib/moves-table";

const FILTER_BUTTON_WIDTH = "min-w-[8.5rem] w-[8.5rem]";
const CATEGORY_OPTIONS = ["Physical", "Special", "Status"] as const;
const AVAILABILITY_OPTIONS = ["Level Up", "TM", "HM", "Breeding", "Tutor", "Special"] as const;

type MovesGlobalTableProps = {
  rows: GlobalMoveRow[];
};

type SortKey = keyof GlobalMoveRow;

function getSortValue(row: GlobalMoveRow, key: SortKey): string | number | null {
  if (key === "availability") return row.availability.join(",");
  const v = row[key as keyof GlobalMoveRow];
  if (v === undefined || v === null) return null;
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v.join(",");
  return String(v);
}

export function MovesGlobalTable({ rows }: MovesGlobalTableProps) {
  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("moveName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const allTypes = useMemo(() => [...new Set(rows.map((r) => r.type).filter(Boolean))].sort(), [rows]);
  const allCategories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter(Boolean))].sort(),
    [rows]
  );
  const allAvailability = useMemo(
    () => [...new Set(rows.flatMap((r) => r.availability))].sort(),
    [rows]
  );

  const hasTypeFilter = selectedTypes.length > 0 && selectedTypes.length < allTypes.length;
  const hasCategoryFilter =
    selectedCategories.length > 0 && selectedCategories.length < allCategories.length;
  const hasAvailabilityFilter =
    selectedAvailability.length > 0 && selectedAvailability.length < allAvailability.length;

  const filtered = useMemo(() => {
    let list = rows;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.moveName.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.availability.some((a) => a.toLowerCase().includes(q))
      );
    }
    if (selectedTypes.length > 0) {
      list = list.filter((r) => selectedTypes.includes(r.type));
    }
    if (selectedCategories.length > 0) {
      list = list.filter((r) => selectedCategories.includes(r.category));
    }
    if (selectedAvailability.length > 0) {
      list = list.filter((r) =>
        r.availability.some((a) => selectedAvailability.includes(a))
      );
    }
    return list;
  }, [rows, search, selectedTypes, selectedCategories, selectedAvailability]);

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
    setSelectedTypes((prev) =>
      prev.length === 0 ? [type] : prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.length === 0 ? [cat] : prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const toggleAvailability = (opt: string) => {
    setSelectedAvailability((prev) =>
      prev.length === 0 ? [opt] : prev.includes(opt) ? prev.filter((a) => a !== opt) : [...prev, opt]
    );
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "moveName", label: "Move" },
    { key: "type", label: "Type" },
    { key: "category", label: "Category" },
    { key: "power", label: "Power" },
    { key: "accuracy", label: "Accuracy" },
    { key: "pp", label: "PP" },
    { key: "maxPP", label: "Max PP" },
    { key: "availability", label: "Availability" },
  ];

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

  const formatVal = (key: SortKey, value: unknown, row: GlobalMoveRow): string => {
    if (value === null || value === undefined) return "—";
    if (key === "accuracy" && typeof value === "number") return `${value}%`;
    if (key === "moveName" && typeof value === "string") {
      return value.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (key === "availability" && Array.isArray(value)) {
      return value.length ? value.join(", ") : "—";
    }
    return String(value);
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
                  onClick={() => setSelectedTypes([])}
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
                  onClick={() => setSelectedCategories([])}
                >
                  Select all
                </Button>
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
                Availability
                {hasAvailabilityFilter && (
                  <span className="text-xs font-semibold text-primary">
                    {selectedAvailability.length}
                  </span>
                )}
              </span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 border-border p-2" align="start">
            <div className="flex flex-col gap-1">
              {AVAILABILITY_OPTIONS.filter((a) => allAvailability.includes(a)).map((opt) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={
                      selectedAvailability.length === 0 || selectedAvailability.includes(opt)
                    }
                    onCheckedChange={() => toggleAvailability(opt)}
                  />
                  {opt}
                </label>
              ))}
              {hasAvailabilityFilter && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 w-full text-xs"
                  onClick={() => setSelectedAvailability([])}
                >
                  Select all
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(({ key, label }) => (
                <TableHead
                  key={key}
                  className="whitespace-nowrap px-2 py-1.5 text-left font-medium"
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
                  colSpan={columns.length}
                  className="py-8 text-center text-muted-foreground text-sm"
                >
                  Nenhum move encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row, i) => (
                <TableRow key={`${row.moveName}-${i}`}>
                  {columns.map(({ key }) => (
                    <TableCell key={key} className="px-2 py-1.5 text-sm">
                      {key === "type" ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "capitalize border text-xs",
                            getTypeBadgeClassName(row.type)
                          )}
                        >
                          {row.type || "—"}
                        </Badge>
                      ) : key === "moveName" ? (
                        row.effect != null || row.flavor != null ? (
                          <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <span>{formatVal(key, row.moveName, row)}</span>
                            </HoverCardTrigger>
                            <HoverCardContent
                              side="top"
                              className="max-w-sm border-border p-3"
                            >
                              {row.effect != null && (
                                <p className="text-sm text-foreground">{row.effect}</p>
                              )}
                              {row.flavor != null && (
                                <p
                                  className={cn(
                                    "text-xs text-muted-foreground",
                                    row.effect != null && "mt-2"
                                  )}
                                >
                                  {row.flavor}
                                </p>
                              )}
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          formatVal(key, row.moveName, row)
                        )
                      ) : key === "availability" ? (
                        formatVal(key, row.availability, row)
                      ) : (
                        formatVal(
                          key,
                          row[key as keyof GlobalMoveRow],
                          row
                        )
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
