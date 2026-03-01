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
import { ArrowDown, ArrowUp, ArrowUpDown, Search, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ITEM_TAB_IDS, type ItemRow, type ItemTabId } from "@/lib/items-table";

const FILTER_BUTTON_WIDTH = "min-w-[8.5rem] w-[8.5rem]";

const TAB_LABELS: Record<ItemTabId, string> = {
  items: "Items",
  pokeballs: "PokéBalls",
  evolutionary: "Evolutionary",
  "key-items": "Key Items",
  "tm-case": "TM Case",
  "berry-pouch": "Berry Pouch",
  miscellaneous: "Miscellaneous",
};

type ItemsTableProps = {
  rows: ItemRow[];
};

type SortKey = keyof Pick<ItemRow, "name" | "category" | "effect">;

function formatCellName(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Display name for category (overrides e.g. Dex Completion → Pokémon Fossil, hm→HM, tm→TM). */
function getCategoryDisplayName(category: string): string {
  const c = category.toLowerCase().replace(/\s/g, "-");
  if (c === "dex-completion") return "Pokémon Fossil";
  if (c === "hm") return "HM";
  if (c === "tm") return "TM";
  return formatCellName(category);
}

/** Display name for item (machines as HM01 / TM01 in uppercase). */
function getItemDisplayName(row: ItemRow): string {
  const cat = row.category.toLowerCase();
  if (cat === "hm" || cat === "tm") return row.name.toUpperCase().replace(/\s/g, "");
  return formatCellName(row.name);
}

export function ItemsTable({ rows }: ItemsTableProps) {
  const [activeTab, setActiveTab] = useState<ItemTabId>("items");
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rowsInTab = useMemo(
    () => rows.filter((r) => r.tabId === activeTab),
    [rows, activeTab]
  );

  const allCategories = useMemo(
    () => [...new Set(rowsInTab.map((r) => r.category).filter(Boolean))].sort(),
    [rowsInTab]
  );

  const hasCategoryFilter =
    selectedCategories.length > 0 && selectedCategories.length < allCategories.length;

  const filtered = useMemo(() => {
    let list = rowsInTab;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.effect?.toLowerCase().includes(q) ?? false)
      );
    }
    if (selectedCategories.length > 0) {
      list = list.filter((r) => selectedCategories.includes(r.category));
    }
    return list;
  }, [rowsInTab, search, selectedCategories]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = (a[sortKey] ?? "") as string;
      const vb = (b[sortKey] ?? "") as string;
      const cmp = va.localeCompare(vb, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    const active = sortKey === column;
    return (
      <span className="ml-1 inline-flex">
        {!active ? (
          <ArrowUpDown className="size-3.5 opacity-0 group-hover:opacity-50" />
        ) : sortDir === "asc" ? (
          <ArrowUp className="size-3.5 text-primary" />
        ) : (
          <ArrowDown className="size-3.5 text-primary" />
        )}
      </span>
    );
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "effect", label: "Effect" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ItemTabId)}>
        <TabsList className="flex h-auto w-fit max-w-full flex-wrap gap-1 p-1">
          {ITEM_TAB_IDS.map((tabId) => (
            <TabsTrigger key={tabId} value={tabId} className="text-sm">
              {TAB_LABELS[tabId]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
              <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by name or effect..."
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
                <div className="flex max-h-[240px] flex-col gap-1 overflow-y-auto">
                  {allCategories.map((cat) => (
                    <label
                      key={cat}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm capitalize hover:bg-accent"
                    >
                      <Checkbox
                        checked={selectedCategories.length === 0 || selectedCategories.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                      />
                      {getCategoryDisplayName(cat)}
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
          </div>

          <div className="overflow-x-auto rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 shrink-0 px-2 py-1.5" />
              {columns.map(({ key, label }) => (
                <TableHead
                  key={key}
                  className="text-foreground font-normal whitespace-nowrap px-2 py-1.5 text-left"
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
                  colSpan={columns.length + 1}
                  className="py-8 text-center text-muted-foreground text-sm"
                >
                  Nenhum item encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="w-12 shrink-0 px-2 py-1.5 align-middle">
                    {row.spriteUrl ? (
                      <div className="relative size-8 shrink-0 overflow-hidden rounded border border-border bg-muted">
                        <Image
                          src={row.spriteUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-foreground px-2 py-1.5 font-medium">
                    {getItemDisplayName(row)}
                  </TableCell>
                  <TableCell className="text-muted-foreground px-2 py-1.5 text-sm capitalize">
                    {getCategoryDisplayName(row.category)}
                  </TableCell>
                  <TableCell className="text-foreground max-w-md px-2 py-1.5 text-sm">
                    {row.effect ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
