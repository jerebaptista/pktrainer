"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { getPokemonDisplayName } from "@/lib/api-adjustments";
import type { PokemonRow } from "@/lib/pokeapi";
import type { MovesTableData } from "@/lib/moves-table";
import { MovesTableSection } from "./pokemon-moves-table";
import { PokemonInfoCard } from "./pokemon-info-card";

/** Stat order for charts: HP, Attack, Defense, Sp. Atk, Sp. Def, Speed */
const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
const STAT_LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  specialAttack: "Sp. Atk",
  specialDefense: "Sp. Def",
  speed: "Speed",
};

/** Returns theme CSS variable for stat bar by percentage of max (0–1). Same bands as 0–255 scale. */
function getStatBarColor(value: number, max: number): string {
  const pct = max <= 0 ? 0 : value / max;
  if (pct >= 200 / 255) return "var(--chart-stat-cyan)";
  if (pct >= 150 / 255) return "var(--chart-stat-emerald)";
  if (pct >= 100 / 255) return "var(--chart-stat-lime)";
  if (pct >= 50 / 255) return "var(--chart-stat-amber)";
  if (pct >= 25 / 255) return "var(--chart-stat-orange)";
  return "var(--chart-stat-red)";
}

type PokemonDetailViewProps = {
  pokemon: PokemonRow;
  allNames: string[];
  movesTableData: MovesTableData;
};

export function PokemonDetailView({ pokemon, allNames, movesTableData }: PokemonDetailViewProps) {
  const router = useRouter();
  const safeNames = allNames ?? [];
  const currentIndex = useMemo(
    () => (pokemon ? safeNames.indexOf(pokemon.name) : -1),
    [pokemon, safeNames]
  );
  const prevName = currentIndex > 0 ? safeNames[currentIndex - 1]! : null;
  const nextName =
    currentIndex >= 0 && currentIndex < safeNames.length - 1
      ? safeNames[currentIndex + 1]!
      : null;

  const [theme, setTheme] = useState<"red" | "green">("red");
  const [statsTab, setStatsTab] = useState<"base" | "max" | "min">("base");

  useEffect(() => {
    const read = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setTheme(t === "green" ? "green" : "red");
    };
    read();
    window.addEventListener("pk-trainer-theme-color-change", read);
    return () => window.removeEventListener("pk-trainer-theme-color-change", read);
  }, []);

  if (!pokemon || !safeNames.length) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Pokémon not found.
      </div>
    );
  }

  const displayName = getPokemonDisplayName(pokemon.name);

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Top bar: ID + Name (left), Prev/Next (right) */}
      <div className="col-span-12 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-muted-foreground">
            #{String(pokemon.id).padStart(3, "0")}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {displayName}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous Pokémon"
            disabled={!prevName}
            onClick={() => prevName && router.push(`/pokedex/${prevName}`)}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next Pokémon"
            disabled={!nextName}
            onClick={() => nextName && router.push(`/pokedex/${nextName}`)}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {/* Col 1–2: Base info */}
      <div className="col-span-12 md:col-span-3">
        <PokemonInfoCard pokemon={pokemon} theme={theme} />
      </div>

      {/* Col 3–9: Stats & Moves (7 cols) – unified stats bar chart */}
      <div className="col-span-12 md:col-span-6 space-y-4">
        {(() => {
          const statsData = STAT_KEYS.map((key) => {
            const value =
              statsTab === "base"
                ? pokemon.baseStats[key]
                : statsTab === "max"
                  ? pokemon.maxStats[key]
                  : pokemon.minStats[key];
            const maxForColor =
              statsTab === "base" ? 255 : key === "hp" ? 714 : 504;
            return { stat: STAT_LABELS[key], value, maxForColor };
          });
          const domainMax = statsTab === "base" ? 255 : 714;
          const chartConfig = { value: { label: statsTab === "base" ? "Base" : statsTab === "max" ? "Max" : "Min" } };
          const descriptions: Record<"base" | "max" | "min", string> = {
            base: "Pokémon's natural strengths and weaknesses that shape its stat growth.",
            max: "Maximum values assume a level 100 Pokémon with a beneficial nature, 252 EVs, and 31 IVs.",
            min: "Minimum values assume a level 100 Pokémon with a hindering nature, 0 EVs, and 0 IVs.",
          };
          return (
            <>
              <div className="flex w-full flex-col">
                <Tabs value={statsTab} onValueChange={(v) => setStatsTab(v as "base" | "max" | "min")}>
                  <div className="mb-1 flex w-full items-center justify-between gap-2">
                    <TabsList className="w-fit">
                      <TabsTrigger value="base">Base Stats</TabsTrigger>
                      <TabsTrigger value="max">Max. Stats</TabsTrigger>
                      <TabsTrigger value="min">Min. Stats</TabsTrigger>
                    </TabsList>
                    {statsTab === "base" && (
                      <span className="text-sm font-semibold text-foreground">
                        Base Stats Total: {pokemon.baseStats.bst}
                      </span>
                    )}
                  </div>
                  <div className="h-[255px] w-full shrink-0">
                    <ChartContainer config={chartConfig} className="h-full w-full max-w-full !aspect-auto">
                      <BarChart
                        layout="vertical"
                        data={statsData}
                        margin={{ top: 8, right: 24, bottom: 0, left: 4 }}
                        barCategoryGap={14}
                      >
                        <XAxis type="number" domain={[0, domainMax]} tick={false} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="stat" width={56} tick={{ style: { fill: "var(--muted-foreground)", fontWeight: 400, fontSize: 12 } }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                          {statsData.map((entry) => (
                            <Cell key={entry.stat} fill={getStatBarColor(entry.value, entry.maxForColor)} />
                          ))}
                          <LabelList position="right" dataKey="value" offset={8} style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }} />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                </Tabs>
                <p className="-mt-3 text-muted-foreground text-xs">
                  {descriptions[statsTab]}
                </p>
              </div>
              <div className="mt-8">
                {(() => {
                  const moveTabIds = pokemon.moveTabIds ?? [];
                  const moveTabLabels: Record<string, string> = {
                    "level-up": "Level Up",
                    "tm-hm": "TMs/HMs",
                    breeding: "Breeding",
                    tutor: "Tutor",
                    special: "Special",
                  };
                  const defaultMoveTab = moveTabIds[0];
                  if (moveTabIds.length === 0) {
                    return (
                      <div className="min-h-[80px] rounded border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center text-muted-foreground text-xs">
                        No move data for this Pokémon.
                      </div>
                    );
                  }
                  return (
                    <Tabs defaultValue={defaultMoveTab}>
                      <TabsList className="w-fit flex-wrap h-auto gap-1 p-1">
                        {moveTabIds.map((id) => (
                          <TabsTrigger key={id} value={id}>
                            {moveTabLabels[id] ?? id}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {moveTabIds.map((id) => (
                        <TabsContent key={id} value={id} className="mt-2">
                          <MovesTableSection
                            tabId={id as "level-up" | "tm-hm" | "breeding" | "tutor" | "special"}
                            rows={movesTableData[id as keyof MovesTableData] ?? []}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  );
                })()}
              </div>
            </>
          );
        })()}
      </div>

      {/* Col 10–12: Calculators (3 cols) */}
      <div className="col-span-12 md:col-span-3">
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium">Calculadoras</span>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="battle-exp">
              <TabsList className="w-full">
                <TabsTrigger value="battle-exp" className="flex-1">
                  Battle Exp.
                </TabsTrigger>
                <TabsTrigger value="catch-rate" className="flex-1">
                  Catch Rate
                </TabsTrigger>
              </TabsList>
              <TabsContent value="battle-exp" className="mt-3">
                <div className="min-h-[100px] rounded border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center text-muted-foreground text-xs">
                  Battle Exp. — em breve
                </div>
              </TabsContent>
              <TabsContent value="catch-rate" className="mt-3">
                <div className="min-h-[100px] rounded border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center text-muted-foreground text-xs">
                  Catch Rate — em breve
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
