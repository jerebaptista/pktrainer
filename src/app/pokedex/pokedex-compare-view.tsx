"use client";

import { createPortal } from "react-dom";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ruler, Scale } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChartContainer } from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  LabelList,
  Rectangle,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BaseStats, PokemonRow } from "@/lib/pokeapi";
import {
  getEncounterDisplayContent,
  getPokemonDisplayName,
} from "@/lib/api-adjustments";
import { getTypeBadgeClassName, getTypeChartColor } from "@/lib/type-colors";
import type { MovesTableData } from "@/lib/moves-table";
import { fetchMovesTableData } from "@/lib/moves-table";
import { cn, formatApiName } from "@/lib/utils";

const COMPARE_SLOTS = 6;

const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"] as const;
const STAT_LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  specialAttack: "Sp. Atk",
  specialDefense: "Sp. Def",
  speed: "Speed",
};

type StatsMode = "base" | "max" | "min";

type PokedexCompareViewProps = {
  selectedPokemon: PokemonRow[];
};

function MoveRowTooltip({
  effect,
  flavor,
  type,
  category,
  power,
  accuracy,
  pp,
}: {
  effect?: string;
  flavor?: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
}) {
  return (
    <div className="max-w-sm space-y-2 text-left">
      {effect && <p className="text-sm text-foreground">{effect}</p>}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Type: <span className="capitalize text-foreground">{type}</span></span>
        <span>Category: <span className="text-foreground">{category}</span></span>
        <span>Power: <span className="text-foreground">{power ?? "—"}</span></span>
        <span>Accuracy: <span className="text-foreground">{accuracy != null ? `${accuracy}%` : "—"}</span></span>
        <span>PP: <span className="text-foreground">{pp ?? "—"}</span></span>
      </div>
      {flavor && (
        <p className="text-xs italic text-muted-foreground">{flavor}</p>
      )}
    </div>
  );
}

function CompareColumnContent({
  pokemon,
  theme,
  aboutValue,
  onAboutOpenChange,
  movesValue,
  onMovesOpenChange,
  movesData,
}: {
  pokemon: PokemonRow;
  theme: "red" | "green";
  aboutValue: string[];
  onAboutOpenChange: (open: boolean) => void;
  movesValue: string[];
  onMovesOpenChange: (open: boolean) => void;
  movesData: MovesTableData | null;
}) {
  const displayName = getPokemonDisplayName(pokemon.name);
  const flavorText =
    theme === "red"
      ? (pokemon.flavorTextFireRed ?? "—")
      : (pokemon.flavorTextLeafGreen ?? "—");
  const heightM = pokemon.height / 10;
  const totalInches = heightM * 39.37007874;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  const heightFtIn = `${feet}′${String(inches).padStart(2, "0")}″`;
  const weightKg = pokemon.weight / 10;
  const weightLbs = (weightKg * 2.20462).toFixed(1);
  const { versionExclusive } = getEncounterDisplayContent(
    pokemon.id,
    pokemon.availability,
    pokemon.encounters,
    theme,
    pokemon.evolvesFromSpeciesName
  );
  const levelUpRows = movesData?.["level-up"] ?? [];

  return (
    <>
      <div className="mb-2 shrink-0 text-left">
        <span className="font-mono text-muted-foreground text-sm">
          #{String(pokemon.id).padStart(3, "0")}
        </span>
        <Link
          href={`/pokedex/${pokemon.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 font-semibold text-foreground hover:underline"
        >
          {displayName}
        </Link>
      </div>
      <Link
        href={`/pokedex/${pokemon.name}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex min-h-[100px] w-full items-center justify-center rounded-lg bg-muted/50 p-3"
      >
        {pokemon.spriteUrl ? (
          <Image
            src={pokemon.spriteUrl}
            alt={displayName}
            width={96}
            height={96}
            className="object-contain"
            unoptimized
          />
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </Link>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {pokemon.types.map((t) => (
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
      <Accordion
        type="multiple"
        value={aboutValue}
        onValueChange={(v) => onAboutOpenChange(v.includes("about"))}
        className="mt-3 w-full"
      >
        <AccordionItem value="about" className="border-border">
          <AccordionTrigger className="py-2 text-sm">About</AccordionTrigger>
          <AccordionContent className="pb-2 pt-0">
            <p className="mt-1 text-sm text-foreground">{flavorText}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1.5">
                    <Ruler className="size-4 text-muted-foreground" />
                    <span>
                      {heightM.toFixed(1)} m ({heightFtIn})
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Height</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1.5">
                    <Scale className="size-4 text-muted-foreground" />
                    <span>
                      {weightKg.toFixed(1)} kg ({weightLbs} lbs)
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Weight</TooltipContent>
              </Tooltip>
            </div>
            <div className="mt-3">
              <span className="text-sm font-medium text-muted-foreground">Abilities</span>
              <div className="mt-1 text-sm">
                {pokemon.abilities.length > 0
                  ? pokemon.abilities
                      .map((a) => formatApiName(a.name.trim()) + (a.isHidden ? " (Hidden)" : ""))
                      .join(", ")
                  : <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            <div className="mt-3">
              <span className="text-sm font-medium text-muted-foreground">Availability</span>
              <div className="mt-1 text-sm">
                {versionExclusive ? (
                  <span className="text-muted-foreground">
                    Not in this version. Switch to{" "}
                    {versionExclusive.switchTo === "red" ? "FireRed" : "LeafGreen"}.
                  </span>
                ) : (
                  <span>{pokemon.availability}</span>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Accordion
        type="multiple"
        value={movesValue}
        onValueChange={(v) => onMovesOpenChange(v.includes("moves"))}
        className="mt-2 w-full"
      >
        <AccordionItem value="moves" className="border-border">
          <AccordionTrigger className="py-2 text-sm">Moves</AccordionTrigger>
          <AccordionContent className="pb-2">
            {movesData === null ? (
              <p className="text-muted-foreground text-xs">Loading…</p>
            ) : levelUpRows.length === 0 ? (
              <p className="text-muted-foreground text-xs">No level-up moves.</p>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-xs">Lv.</TableHead>
                      <TableHead className="text-xs">Move</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levelUpRows.map((row, idx) => (
                      <TableRow key={`${row.moveName}-${row.level ?? idx}`}>
                        <TableCell className="py-1 font-mono text-xs tabular-nums">
                          {row.level ?? "—"}
                        </TableCell>
                        <TableCell className="py-1">
                          <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <span className="cursor-default text-xs font-medium capitalize hover:underline">
                                {row.moveName.replace(/-/g, " ")}
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent side="top" align="start" className="max-w-sm border-border p-3">
                              <MoveRowTooltip
                                effect={row.effect}
                                flavor={row.flavor}
                                type={row.type}
                                category={row.category}
                                power={row.power}
                                accuracy={row.accuracy}
                                pp={row.pp}
                              />
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}

function getStatsForMode(p: PokemonRow, mode: StatsMode): BaseStats {
  return mode === "base" ? p.baseStats : mode === "max" ? p.maxStats : p.minStats;
}

type ChartHoveredBar = {
  statIndex: number;
  barIndex: number;
  /** Posição em pixels (viewport) para o tooltip fixo */
  screenX: number;
  screenY: number;
};

function CompareChartTooltip({
  active,
  payload,
  selectedPokemon,
  hoveredBar,
  chartData,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  selectedPokemon: PokemonRow[];
  hoveredBar?: ChartHoveredBar | null;
  chartData?: Array<Record<string, string | number>>;
}) {
  const showFromHovered =
    hoveredBar != null &&
    chartData &&
    selectedPokemon[hoveredBar.barIndex] &&
    chartData[hoveredBar.statIndex];

  if (showFromHovered) {
    const pokemon = selectedPokemon[hoveredBar.barIndex]!;
    const row = chartData[hoveredBar.statIndex]!;
    const statLabel = (row.stat as string) ?? "Stat";
    const value = Number(row[`val${hoveredBar.barIndex}`]);
    const spriteUrl = pokemon.spriteUrl ?? undefined;
    return (
      <div className="rounded-lg border border-border bg-popover pl-1 pr-4 py-1 shadow-md">
        <div className="flex items-center">
          {spriteUrl && (
            <div className="relative h-12 w-12 shrink-0">
              <Image
                src={spriteUrl}
                alt=""
                width={48}
                height={48}
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {getPokemonDisplayName(pokemon.name)}
            </p>
            <p className="text-muted-foreground text-xs">
              {statLabel}: {value}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!active || !payload?.length) return null;
  const item = payload[0];
  const dataKey = item.dataKey as string;
  const value = item.value;
  const rowPayload = item.payload as Record<string, unknown> | undefined;
  const statLabel = (rowPayload?.stat as string) ?? "Stat";
  const match = /^val(\d+)$/.exec(dataKey);
  const index = match ? parseInt(match[1], 10) : 0;
  const pokemon = selectedPokemon[index];
  if (!pokemon) return null;
  const spriteUrl = pokemon.spriteUrl ?? undefined;
  return (
    <div className="rounded-lg border border-border bg-popover pl-1 pr-4 py-1 shadow-md">
      <div className="flex items-center">
        {spriteUrl && (
          <div className="relative h-12 w-12 shrink-0">
            <Image
              src={spriteUrl}
              alt=""
              width={48}
              height={48}
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">
            {getPokemonDisplayName(pokemon.name)}
          </p>
          <p className="text-muted-foreground text-xs">
            {statLabel}: {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PokedexCompareView({ selectedPokemon }: PokedexCompareViewProps) {
  const [statsMode, setStatsMode] = useState<StatsMode>("base");
  const [focusedIndices, setFocusedIndices] = useState<Set<number>>(new Set());
  const [aboutAccordionOpen, setAboutAccordionOpen] = useState(false);
  const [movesAccordionOpen, setMovesAccordionOpen] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<ChartHoveredBar | null>(null);
  const [theme, setTheme] = useState<"red" | "green">("red");
  const [movesTableDataList, setMovesTableDataList] = useState<(MovesTableData | null)[]>([]);

  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    setTheme(t === "green" ? "green" : "red");
    const read = () => {
      const r = document.documentElement.getAttribute("data-theme");
      setTheme(r === "green" ? "green" : "red");
    };
    window.addEventListener("pk-trainer-theme-color-change", read);
    return () => window.removeEventListener("pk-trainer-theme-color-change", read);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setMovesTableDataList((prev) => Array(selectedPokemon.length).fill(null));
    Promise.all(selectedPokemon.map((p) => fetchMovesTableData(p.moves)))
      .then((list) => {
        if (!cancelled) setMovesTableDataList(list);
      })
      .catch(() => {
        if (!cancelled) setMovesTableDataList((prev) => prev.map(() => null));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPokemon]);

  const toggleFocus = useCallback(
    (index: number) => {
      setFocusedIndices((prev) => {
        const n = selectedPokemon.length;
        const allFocused = prev.size === 0 || prev.size === n;
        if (allFocused) return new Set([index]);
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    },
    [selectedPokemon.length]
  );

  const isFocused = useCallback(
    (i: number) => focusedIndices.size === 0 || focusedIndices.has(i),
    [focusedIndices]
  );

  const selectionKey = useMemo(
    () => selectedPokemon.map((p) => p.id).join(","),
    [selectedPokemon]
  );
  useEffect(() => {
    setFocusedIndices(new Set());
  }, [selectionKey]);

  const barColors = useMemo(
    () =>
      selectedPokemon.map((p) =>
        getTypeChartColor(p.types?.[0] ?? "normal")
      ),
    [selectedPokemon]
  );

  const chartData = STAT_KEYS.map((statKey) => {
    const row: Record<string, string | number> = { stat: STAT_LABELS[statKey] };
    selectedPokemon.forEach((p, i) => {
      const stats = getStatsForMode(p, statsMode);
      row[`val${i}`] = stats[statKey];
    });
    return row;
  });

  const chartConfig: Record<string, { label?: string; color?: string }> = {};
  selectedPokemon.forEach((p, i) => {
    chartConfig[`val${i}`] = {
      label: getPokemonDisplayName(p.name),
      color: barColors[i],
    };
  });

  const domainMax = (() => {
    let max = 0;
    for (const row of chartData) {
      for (let i = 0; i < selectedPokemon.length; i++) {
        const v = Number(row[`val${i}`]);
        if (!Number.isNaN(v) && v > max) max = v;
      }
    }
    return max > 0 ? Math.ceil(max * 1.05) : 100;
  })();

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      {/* Colunas dos Pokémon */}
      <div className="flex min-w-0 items-start gap-4">
        {Array.from({ length: COMPARE_SLOTS }, (_, i) => (
          <Fragment key={i}>
            {i > 0 && i < selectedPokemon.length && (
              <Separator
                orientation="vertical"
                className="mt-8 w-px shrink-0 self-stretch bg-border"
                decorative
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col overflow-auto">
              {selectedPokemon[i] ? (
                <CompareColumnContent
                  pokemon={selectedPokemon[i]}
                  theme={theme}
                  aboutValue={aboutAccordionOpen ? ["about"] : []}
                  onAboutOpenChange={(open) => setAboutAccordionOpen(open)}
                  movesValue={movesAccordionOpen ? ["moves"] : []}
                  onMovesOpenChange={(open) => setMovesAccordionOpen(open)}
                  movesData={movesTableDataList[i] ?? null}
                />
              ) : (
                <div className="min-h-[200px]" aria-hidden />
              )}
            </div>
          </Fragment>
        ))}
      </div>

      {/* Card full-width: Stats com tabs e bar chart */}
      {selectedPokemon.length > 0 && (
        <Card className="w-full min-w-0 mb-20">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
            <Tabs value={statsMode} onValueChange={(v) => setStatsMode(v as StatsMode)}>
              <TabsList className="w-fit">
                <TabsTrigger value="base">Base Stats</TabsTrigger>
                <TabsTrigger value="max">Max. Stats</TabsTrigger>
                <TabsTrigger value="min">Min. Stats</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-muted-foreground text-xs text-right">
              {statsMode === "base" &&
                "Natural strengths and weaknesses that shape stat growth."}
              {statsMode === "max" &&
                "Maximum values assume level 100, beneficial nature, 252 EVs, 31 IVs."}
              {statsMode === "min" &&
                "Minimum values assume level 100, hindering nature, 0 EVs, 0 IVs."}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full !aspect-auto">
                <BarChart
                  data={chartData}
                  margin={{ top: 14, right: 8, bottom: 2, left: 8 }}
                  barCategoryGap="8%"
                  barGap="2%"
                >
                  <XAxis
                    type="category"
                    dataKey="stat"
                    tick={{ style: { fill: "var(--muted-foreground)", fontSize: 11 } }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, domainMax]}
                    tick={{ style: { fill: "var(--muted-foreground)", fontSize: 11 } }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border)" }}
                  />
                  <RechartsTooltip active={false} cursor={false} />
                  {selectedPokemon.map((_, i) => (
                    <Bar
                      key={i}
                      dataKey={`val${i}`}
                      radius={[4, 4, 0, 0]}
                      fill={barColors[i]}
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleFocus(i)}
                      shape={(props: unknown) => {
                        const p = props as {
                          index: number;
                          x: number;
                          y: number;
                          width: number;
                          height: number;
                        };
                        const isHovered =
                          hoveredBar?.statIndex === p.index &&
                          hoveredBar?.barIndex === i;
                        const baseOpacity = isFocused(i) ? 1 : 0.1;
                        return (
                          <Rectangle
                            {...(props as object)}
                            fill={barColors[i]}
                            radius={[4, 4, 0, 0]}
                            opacity={isHovered ? 0.90 : baseOpacity}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as SVGElement;
                              const r = el.getBoundingClientRect();
                              setHoveredBar({
                                statIndex: p.index,
                                barIndex: i,
                                screenX: r.left + r.width / 2,
                                screenY: r.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredBar(null)}
                          />
                        );
                      }}
                    >
                      <LabelList
                        position="top"
                        dataKey={`val${i}`}
                        style={{
                          fill: "var(--foreground)",
                          fontSize: 11,
                          fontWeight: 600,
                          opacity: isFocused(i) ? 1 : 0.2,
                        }}
                      />
                    </Bar>
                  ))}
                </BarChart>
              </ChartContainer>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {selectedPokemon.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleFocus(i)}
                  className="flex items-center gap-2 rounded px-1 py-0.5 transition-opacity duration-200 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ opacity: isFocused(i) ? 1 : 0.4 }}
                  title="Clique para focar ou desfocar"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: barColors[i] }}
                    aria-hidden
                  />
                  <span className="text-sm text-foreground">
                    {getPokemonDisplayName(p.name)}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {hoveredBar &&
        createPortal(
          <div
            className="pointer-events-none z-[9999]"
            style={{
              position: "fixed",
              left: hoveredBar.screenX,
              top: hoveredBar.screenY,
              transform: "translate(-50%, -100%)",
              marginTop: -20,
            }}
          >
            <CompareChartTooltip
              selectedPokemon={selectedPokemon}
              hoveredBar={hoveredBar}
              chartData={chartData}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
