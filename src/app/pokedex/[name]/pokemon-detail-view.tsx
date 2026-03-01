"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Mars, Ruler, Scale, Sparkles, Venus, Volume2 } from "lucide-react";
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
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import {
  getEncounterDisplayContent,
  getLocationDisplayName,
  getPokemonDisplayName,
} from "@/lib/api-adjustments";
import type { PokemonRow } from "@/lib/pokeapi";
import { cn, formatApiName } from "@/lib/utils";

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
};

export function PokemonDetailView({ pokemon, allNames }: PokemonDetailViewProps) {
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

  const [spriteFront, setSpriteFront] = useState(true);
  const [shiny, setShiny] = useState(false);
  const [female, setFemale] = useState(false);
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
        Pokémon não encontrado.
      </div>
    );
  }

  const displayName = getPokemonDisplayName(pokemon.name);
  const {
    spriteUrl,
    spriteUrlShiny,
    spriteUrlFemale,
    spriteUrlShinyFemale,
    spriteUrlBack,
    spriteUrlBackShiny,
    spriteUrlBackFemale,
    spriteUrlBackShinyFemale,
  } = pokemon;
  const hasGenderSprites = Boolean(
    spriteUrlFemale || spriteUrlShinyFemale || spriteUrlBackFemale || spriteUrlBackShinyFemale
  );
  const toggleGroupValue = (() => {
    const parts: string[] = [];
    if (shiny) parts.push("shiny");
    if (female) parts.push("female");
    return parts;
  })();
  const currentSpriteUrl = (() => {
    const front = spriteFront;
    const isShiny = shiny;
    const isFemale = female && hasGenderSprites;
    if (front) {
      if (isShiny && isFemale && spriteUrlShinyFemale) return spriteUrlShinyFemale;
      if (isShiny && spriteUrlShiny) return spriteUrlShiny;
      if (isFemale && spriteUrlFemale) return spriteUrlFemale;
      return spriteUrl;
    }
    if (isShiny && isFemale && spriteUrlBackShinyFemale) return spriteUrlBackShinyFemale;
    if (isShiny && spriteUrlBackShiny) return spriteUrlBackShiny;
    if (isFemale && spriteUrlBackFemale) return spriteUrlBackFemale;
    return spriteUrlBack ?? spriteUrl;
  })();

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
            aria-label="Pokémon anterior"
            disabled={!prevName}
            onClick={() => prevName && router.push(`/pokedex/${prevName}`)}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próximo Pokémon"
            disabled={!nextName}
            onClick={() => nextName && router.push(`/pokedex/${nextName}`)}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      {/* Col 1–2: Base info (sem Card, só conteúdo) */}
      <div className="col-span-12 md:col-span-3 space-y-4">
        <div className="flex w-full max-w-[255px] flex-col items-start gap-3">
          <div className="relative flex min-h-[140px] w-full items-center justify-center rounded-lg bg-muted/50 p-4">
            {currentSpriteUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentSpriteUrl}
                alt={displayName}
                width={120}
                height={120}
                className="object-contain"
              />
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>
          {/* One row: Shiny, Male/Female (when API has sprites), Tab Front/Back, Cry */}
          <div className="flex flex-wrap items-center justify-start gap-2">
            {hasGenderSprites ? (
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="default"
                value={toggleGroupValue}
                onValueChange={(value) => {
                  setShiny(value.includes("shiny"));
                  setFemale(value.includes("female"));
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value="shiny"
                      aria-label="Shiny"
                      className={cn("px-2", shiny && "!bg-muted !text-foreground")}
                    >
                      <Sparkles className="size-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>Shiny</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem
                      value="female"
                      aria-label={female ? "Female" : "Male"}
                      className="px-2 data-[state=on]:bg-background data-[state=on]:text-foreground"
                    >
                      {female ? <Venus className="size-4" /> : <Mars className="size-4" />}
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>{female ? "Female" : "Male"}</TooltipContent>
                </Tooltip>
              </ToggleGroup>
            ) : (
                <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    variant="outline"
                    size="default"
                    pressed={shiny}
                    onPressedChange={setShiny}
                    aria-label="Shiny"
                    className={cn(shiny && "!bg-muted !text-foreground")}
                  >
                    <Sparkles className="size-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent>Shiny</TooltipContent>
              </Tooltip>
            )}
            <Tabs value={spriteFront ? "front" : "back"} onValueChange={(v) => setSpriteFront(v === "front")}>
              <TabsList className="h-8">
                <TabsTrigger value="front" className="px-3 text-sm">
                  Front
                </TabsTrigger>
                <TabsTrigger value="back" className="px-3 text-sm">
                  Back
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Hear cry"
                  disabled={!pokemon.cryUrl}
                  className="border-input"
                  onClick={() => {
                    if (pokemon.cryUrl) {
                      const audio = new Audio(pokemon.cryUrl);
                      audio.play().catch(() => {});
                    }
                  }}
                >
                  <Volume2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Hear cry</TooltipContent>
            </Tooltip>
          </div>
        </div>
        {/* Type */}
        <div className="mt-4 flex flex-wrap gap-2 rounded">
          {pokemon.types.map((t) => (
            <span
              key={t}
              className={cn(
                "rounded px-2.5 py-1 text-sm font-medium capitalize",
                getTypeBadgeClassName(t)
              )}
            >
              {t}
            </span>
          ))}
        </div>
        {/* Species + description (versão FR/LG por tema) */}
        <div className="mt-3">
          <p className="text-sm font-semibold text-muted-foreground">
            {pokemon.speciesGenus}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {theme === "red"
              ? (pokemon.flavorTextFireRed ?? "—")
              : (pokemon.flavorTextLeafGreen ?? "—")}
          </p>
        </div>
        {/* Height, Weight (metric + imperial, inline com ícones e tooltips) */}
        {(() => {
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
          return (
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
          );
        })()}
        {/* Abilities (da API, clicável sem destino por enquanto) */}
        <div className="mt-3">
          <span className="text-muted-foreground text-sm font-medium">Abilities</span>
          <div className="mt-1 text-sm">
            {pokemon.abilities.length > 0 ? (
              pokemon.abilities.map((a, i) => (
                <span key={`${a.name}-${a.isHidden}`}>
                  <button
                    type="button"
                    className="text-primary hover:opacity-80 align-baseline"
                    onClick={(e) => e.preventDefault()}
                  >
                    {formatApiName(a.name)}
                    {a.isHidden ? " (Hidden)" : ""}
                  </button>
                  {i < pokemon.abilities.length - 1 ? ", " : ""}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
        {/* Availability: obtain methods (Wild, NPC Trade, Gift, Game Corner, Fossil, Event, Evolution) */}
        {(() => {
          const { versionExclusive, blocks } = getEncounterDisplayContent(
            pokemon.id,
            pokemon.availability,
            pokemon.encounters,
            theme,
            pokemon.evolvesFromSpeciesName
          );

          const switchToTheme = (target: "red" | "green") => {
            localStorage.setItem("pk-trainer-theme-color", target);
            document.documentElement.setAttribute("data-theme", target);
            window.dispatchEvent(
              new CustomEvent("pk-trainer-theme-color-change", { detail: { theme: target } })
            );
          };

          return (
            <div className="mt-3">
              <span className="text-muted-foreground text-sm font-medium">Availability</span>
              <div className="mt-1 flex flex-col gap-1">
                {versionExclusive ? (
                  <span className="text-sm text-muted-foreground">
                    This Pokémon cannot be found in this version. Change to{" "}
                    <Button
                      variant="link"
                      size="sm"
                      className="inline h-auto p-0 font-normal text-primary no-underline hover:no-underline cursor-pointer"
                      onClick={() => switchToTheme(versionExclusive.switchTo)}
                    >
                      {versionExclusive.switchTo === "red" ? "FireRed" : "LeafGreen"}
                    </Button>
                  </span>
                ) : (
                  blocks.map((block, idx) => {
                    if (block.type === "wild") {
                      return (
                        <div key={idx} className="flex flex-col gap-1 text-sm text-foreground">
                          {block.byMethod.map(({ methodLabel, locations: locs }, mi) => (
                            <span key={mi}>
                              {methodLabel} in{" "}
                              {locs.map((slug, i) => (
                                <span key={slug}>
                                  <Button
                                    variant="link"
                                    className="h-auto p-0 font-normal text-primary no-underline hover:no-underline"
                                    asChild
                                  >
                                    <Link href={`/locations/${slug}`}>
                                      {getLocationDisplayName(slug)}
                                    </Link>
                                  </Button>
                                  {i < locs.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    if (block.type === "gift") {
                      const locationLinks = block.locationLinks;
                      if (locationLinks?.length) {
                        type Seg = string | { slug: string; textInGift: string };
                        let text = block.text;
                        const segments: Seg[] = [];
                        for (const link of locationLinks) {
                          const i = text.indexOf(link.textInGift);
                          if (i === -1) continue;
                          segments.push(text.slice(0, i));
                          segments.push(link);
                          text = text.slice(i + link.textInGift.length);
                        }
                        segments.push(text);
                        return (
                          <span key={idx} className="text-sm text-foreground">
                            {segments.map((seg, i) =>
                              typeof seg === "string" ? (
                                seg
                              ) : (
                                <Button
                                  key={i}
                                  variant="link"
                                  className="h-auto p-0 font-normal text-primary no-underline hover:no-underline"
                                  asChild
                                >
                                  <Link href={`/locations/${seg.slug}`}>{seg.textInGift}</Link>
                                </Button>
                              )
                            )}
                          </span>
                        );
                      }
                      return (
                        <span key={idx} className="text-sm text-foreground">
                          {block.text}
                        </span>
                      );
                    }
                    if (block.type === "game-corner") {
                      const locationLinks = block.locationLinks;
                      if (locationLinks?.length) {
                        type Seg = string | { slug: string; textInGift: string };
                        let text = block.text;
                        const segments: Seg[] = [];
                        for (const link of locationLinks) {
                          const i = text.indexOf(link.textInGift);
                          if (i === -1) continue;
                          segments.push(text.slice(0, i));
                          segments.push(link);
                          text = text.slice(i + link.textInGift.length);
                        }
                        segments.push(text);
                        return (
                          <span key={idx} className="text-sm text-foreground">
                            {segments.map((seg, i) =>
                              typeof seg === "string" ? (
                                seg
                              ) : (
                                <Button
                                  key={i}
                                  variant="link"
                                  className="h-auto p-0 font-normal text-primary no-underline hover:no-underline"
                                  asChild
                                >
                                  <Link href={`/locations/${seg.slug}`}>{seg.textInGift}</Link>
                                </Button>
                              )
                            )}
                          </span>
                        );
                      }
                      return (
                        <span key={idx} className="text-sm text-foreground">
                          {block.text}
                        </span>
                      );
                    }
                    if (block.type === "fossil") {
                      const fossilLinks = block.links;
                      if (fossilLinks?.length) {
                        type Seg = string | { slug: string; textInBlock: string; linkType: "item" | "location" };
                        let text = block.text;
                        const segments: Seg[] = [];
                        for (const link of fossilLinks) {
                          const i = text.indexOf(link.textInBlock);
                          if (i === -1) continue;
                          segments.push(text.slice(0, i));
                          segments.push(link);
                          text = text.slice(i + link.textInBlock.length);
                        }
                        segments.push(text);
                        return (
                          <span key={idx} className="text-sm text-foreground">
                            {segments.map((seg, i) =>
                              typeof seg === "string" ? (
                                seg
                              ) : (
                                <Button
                                  key={i}
                                  variant="link"
                                  className="h-auto p-0 font-normal text-primary no-underline hover:no-underline"
                                  asChild
                                >
                                  <Link
                                    href={
                                      seg.linkType === "item"
                                        ? `/items/${seg.slug}`
                                        : `/locations/${seg.slug}`
                                    }
                                  >
                                    {seg.textInBlock}
                                  </Link>
                                </Button>
                              )
                            )}
                          </span>
                        );
                      }
                      return (
                        <span key={idx} className="text-sm text-foreground">
                          {block.text}
                        </span>
                      );
                    }
                    if (block.type === "buy") {
                      const locationLinks = block.locationLinks;
                      if (locationLinks?.length) {
                        type Seg = string | { slug: string; textInGift: string };
                        let text = block.text;
                        const segments: Seg[] = [];
                        for (const link of locationLinks) {
                          const i = text.indexOf(link.textInGift);
                          if (i === -1) continue;
                          segments.push(text.slice(0, i));
                          segments.push(link);
                          text = text.slice(i + link.textInGift.length);
                        }
                        segments.push(text);
                        return (
                          <span key={idx} className="text-sm text-foreground">
                            {segments.map((seg, i) =>
                              typeof seg === "string" ? (
                                seg
                              ) : (
                                <Button
                                  key={i}
                                  variant="link"
                                  className="h-auto p-0 font-normal text-primary no-underline hover:no-underline"
                                  asChild
                                >
                                  <Link href={`/locations/${seg.slug}`}>{seg.textInGift}</Link>
                                </Button>
                              )
                            )}
                          </span>
                        );
                      }
                      return (
                        <span key={idx} className="text-sm text-foreground">
                          {block.text}
                        </span>
                      );
                    }
                    if (block.type === "npc-trade") {
                      const npcLinks = block.links;
                      if (npcLinks?.length) {
                        type NpcSeg = string | { slug: string; textInBlock: string; linkType: "pokemon" | "location" };
                        let text = block.text;
                        const segments: NpcSeg[] = [];
                        for (const link of npcLinks) {
                          const i = text.indexOf(link.textInBlock);
                          if (i === -1) continue;
                          segments.push(text.slice(0, i));
                          segments.push(link);
                          text = text.slice(i + link.textInBlock.length);
                        }
                        segments.push(text);
                        return (
                          <span key={idx} className="text-sm text-foreground">
                            {segments.map((seg, i) =>
                              typeof seg === "string" ? (
                                seg
                              ) : (
                                <Button
                                  key={i}
                                  variant="link"
                                  className="h-auto p-0 font-normal text-primary no-underline hover:no-underline"
                                  asChild
                                >
                                  <Link
                                    href={
                                      seg.linkType === "pokemon"
                                        ? `/pokedex/${seg.slug}`
                                        : `/locations/${seg.slug}`
                                    }
                                  >
                                    {seg.textInBlock}
                                  </Link>
                                </Button>
                              )
                            )}
                          </span>
                        );
                      }
                      return (
                        <span key={idx} className="text-sm text-foreground">
                          {block.text}
                        </span>
                      );
                    }
                    if (block.type === "evolution") {
                      const evolutionLinks = block.links;
                      if (evolutionLinks?.length) {
                        type Seg = string | { slug: string; textInBlock: string };
                        let text = block.text;
                        const segments: Seg[] = [];
                        for (const link of evolutionLinks) {
                          const i = text.indexOf(link.textInBlock);
                          if (i === -1) continue;
                          segments.push(text.slice(0, i));
                          segments.push(link);
                          text = text.slice(i + link.textInBlock.length);
                        }
                        segments.push(text);
                        return (
                          <span key={idx} className="text-sm text-foreground">
                            {segments.map((seg, i) =>
                              typeof seg === "string" ? (
                                seg
                              ) : (
                                <Button
                                  key={i}
                                  variant="link"
                                  className="h-auto p-0 font-normal text-primary no-underline hover:no-underline"
                                  asChild
                                >
                                  <Link href={`/pokedex/${seg.slug}`}>
                                    {seg.textInBlock}
                                  </Link>
                                </Button>
                              )
                            )}
                          </span>
                        );
                      }
                      return (
                        <span key={idx} className="text-sm text-foreground">
                          {block.text}
                        </span>
                      );
                    }
                    if (block.type === "event") {
                      return (
                        <span key={idx} className="text-sm text-foreground">
                          {block.text}
                        </span>
                      );
                    }
                    return (
                      <span key={idx} className="text-sm text-muted-foreground">
                        {block.text}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}
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
                <Tabs defaultValue="level-up">
                  <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                    <TabsTrigger value="level-up">Level Up</TabsTrigger>
                  <TabsTrigger value="tm-hm">TMs/HMs</TabsTrigger>
                  <TabsTrigger value="breeding">Breeding</TabsTrigger>
                  <TabsTrigger value="tutor">Tutor</TabsTrigger>
                  <TabsTrigger value="special">Special</TabsTrigger>
                </TabsList>
                <TabsContent value="level-up" className="mt-2">
                  <div className="min-h-[80px] rounded border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center text-muted-foreground text-xs">
                    Tabela de moves — em breve
                  </div>
                </TabsContent>
                <TabsContent value="tm-hm" className="mt-2">
                  <div className="min-h-[80px] rounded border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center text-muted-foreground text-xs">
                    TMs/HMs — em breve
                  </div>
                </TabsContent>
                <TabsContent value="breeding" className="mt-2">
                  <div className="min-h-[80px] rounded border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center text-muted-foreground text-xs">
                    Breeding — em breve
                  </div>
                </TabsContent>
                <TabsContent value="tutor" className="mt-2">
                  <div className="min-h-[80px] rounded border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center text-muted-foreground text-xs">
                    Tutor — em breve
                  </div>
                </TabsContent>
                <TabsContent value="special" className="mt-2">
                  <div className="min-h-[80px] rounded border border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center text-muted-foreground text-xs">
                    Special — em breve
                  </div>
                </TabsContent>
              </Tabs>
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
