"use client";

import { Fragment, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChartContainer } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import { Search } from "lucide-react";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import { getPokemonDisplayName } from "@/lib/api-adjustments";
import type { PokemonRow } from "@/lib/pokeapi";
import type { MovesTableData } from "@/lib/moves-table";
import { PokemonInfoCard } from "../[name]/pokemon-info-card";
import { cn } from "@/lib/utils";

const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
const STAT_LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  specialAttack: "Sp. Atk",
  specialDefense: "Sp. Def",
  speed: "Speed",
};

function getStatBarColor(value: number, max: number): string {
  const pct = max <= 0 ? 0 : value / max;
  if (pct >= 200 / 255) return "var(--chart-stat-cyan)";
  if (pct >= 150 / 255) return "var(--chart-stat-emerald)";
  if (pct >= 100 / 255) return "var(--chart-stat-lime)";
  if (pct >= 50 / 255) return "var(--chart-stat-amber)";
  if (pct >= 25 / 255) return "var(--chart-stat-orange)";
  return "var(--chart-stat-red)";
}

type CompareViewProps = {
  pokemonList: PokemonRow[];
  movesDataList: MovesTableData[];
};

export function CompareView({ pokemonList, movesDataList }: CompareViewProps) {
  const [theme, setTheme] = useState<"red" | "green">("red");
  const [statsTab, setStatsTab] = useState<"base" | "max" | "min">("base");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    const read = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setTheme(t === "green" ? "green" : "red");
    };
    read();
    window.addEventListener("pk-trainer-theme-color-change", read);
    return () => window.removeEventListener("pk-trainer-theme-color-change", read);
  }, []);

  const levelUpRows = movesDataList.map((data) => data["level-up"] ?? []);
  const allTypes = Array.from(new Set(levelUpRows.flatMap((rows) => rows.map((r) => r.type).filter(Boolean)))).sort();

  const filteredLevelUpRows = levelUpRows.map((rows) => {
    let list = rows;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.moveName.toLowerCase().includes(q) || r.type.toLowerCase().includes(q));
    if (typeFilter !== "all") list = list.filter((r) => r.type === typeFilter);
    return list;
  });

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Compare Pokémon</h1>
      </header>

      {/* Até 6 Pokémon separados por separators verticais */}
      <div className="flex flex-nowrap items-stretch min-h-[200px]">
        {pokemonList.map((pokemon, index) => (
          <Fragment key={pokemon.id}>
            {index > 0 && <Separator orientation="vertical" className="shrink-0 mx-1" />}
            <div className="flex-1 min-w-0 flex flex-col gap-3 py-2 px-2">
              <PokemonInfoCard pokemon={pokemon} theme={theme} noCard />
            </div>
          </Fragment>
        ))}
        {Array.from({ length: Math.max(0, 6 - pokemonList.length) }).map((_, i) => (
          <Fragment key={`empty-${i}`}>
            <Separator orientation="vertical" className="shrink-0 mx-1" />
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center min-h-[200px] text-muted-foreground text-sm py-2 px-2">
              —
            </div>
          </Fragment>
        ))}
      </div>

      {/* Stats: one tab bar, 6 bar charts */}
      <div className="space-y-4">
        <Tabs value={statsTab} onValueChange={(v) => setStatsTab(v as "base" | "max" | "min")}>
          <TabsList className="w-fit">
            <TabsTrigger value="base">Base Stats</TabsTrigger>
            <TabsTrigger value="max">Max. Stats</TabsTrigger>
            <TabsTrigger value="min">Min. Stats</TabsTrigger>
          </TabsList>
          <div className="grid grid-cols-12 gap-4 mt-4">
            {pokemonList.map((pokemon) => {
              const statsData = STAT_KEYS.map((key) => {
                const value = statsTab === "base" ? pokemon.baseStats[key] : statsTab === "max" ? pokemon.maxStats[key] : pokemon.minStats[key];
                const maxForColor = statsTab === "base" ? 255 : key === "hp" ? 714 : 504;
                return { stat: STAT_LABELS[key], value, maxForColor };
              });
              const domainMax = statsTab === "base" ? 255 : 714;
              const chartConfig = { value: { label: statsTab === "base" ? "Base" : statsTab === "max" ? "Max" : "Min" } };
              return (
                <div key={pokemon.id} className="col-span-2">
                  <p className="text-sm font-medium mb-1 truncate">{getPokemonDisplayName(pokemon.name)}</p>
                  <div className="h-[200px] w-full">
                    <ChartContainer config={chartConfig} className="h-full w-full !aspect-auto">
                      <BarChart layout="vertical" data={statsData} margin={{ top: 4, right: 20, bottom: 0, left: 2 }} barCategoryGap={8}>
                        <XAxis type="number" domain={[0, domainMax]} tick={false} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="stat" width={48} tick={{ style: { fill: "var(--muted-foreground)", fontSize: 10 } }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                        <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={12}>
                          {statsData.map((entry) => (
                            <Cell key={entry.stat} fill={getStatBarColor(entry.value, entry.maxForColor)} />
                          ))}
                          <LabelList position="right" dataKey="value" offset={4} style={{ fill: "var(--foreground)", fontSize: 10, fontWeight: 600 }} />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-muted-foreground text-xs mt-2">
            {statsTab === "base" && "Pokémon's natural strengths and weaknesses that shape its stat growth."}
            {statsTab === "max" && "Maximum values assume level 100, beneficial nature, 252 EVs, 31 IVs."}
            {statsTab === "min" && "Minimum values assume level 100, hindering nature, 0 EVs, 0 IVs."}
          </p>
        </Tabs>
      </div>

      {/* Moves: search + type select, then 6 tables (Lv, Move, Type) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Moves (Level-up)</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {allTypes.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-12 gap-4">
          {pokemonList.map((pokemon, idx) => (
            <div key={pokemon.id} className="col-span-2">
              <p className="text-sm font-medium mb-2 truncate">{getPokemonDisplayName(pokemon.name)}</p>
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-left text-xs">Lv</TableHead>
                      <TableHead className="text-left text-xs">Move</TableHead>
                      <TableHead className="text-left text-xs">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLevelUpRows[idx]!.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-4 text-center text-muted-foreground text-xs">
                          No moves
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLevelUpRows[idx]!.map((row, i) => (
                        <TableRow key={`${row.moveName}-${row.level ?? i}`}>
                          <TableCell className="font-mono text-xs tabular-nums py-1">{row.level ?? "—"}</TableCell>
                          <TableCell className="text-xs font-medium py-1">{row.moveName.replace(/\b\w/g, (c) => c.toUpperCase())}</TableCell>
                          <TableCell className="py-1">
                            <Badge variant="secondary" className={cn("capitalize text-[10px] border", getTypeBadgeClassName(row.type))}>
                              {row.type || "—"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
