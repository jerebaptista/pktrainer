"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Mars, Ruler, Scale, Sparkles, Venus, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="grid grid-cols-12 gap-6">
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
      <div className="col-span-12 md:col-span-2 space-y-4">
        <div className="flex flex-col items-center gap-3">
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
          <div className="flex flex-wrap items-center justify-center gap-2">
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
        {/* Encounters: tags de availability (Wild, NPC Trade, Gift, Game Corner, Fossil, Event, Evolution) */}
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
              <span className="text-muted-foreground text-sm font-medium">Encounters</span>
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
                        <span key={idx} className="text-sm text-foreground">
                          {block.locations.map((name, i) => (
                            <span key={name}>
                              <button
                                type="button"
                                className="text-primary hover:opacity-80"
                                onClick={(e) => e.preventDefault()}
                              >
                                {getLocationDisplayName(name)}
                              </button>
                              {i < block.locations.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </span>
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
                                  className="h-auto p-0 text-foreground no-underline hover:no-underline"
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
                                  className="h-auto p-0 text-foreground no-underline hover:no-underline"
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
                    if (
                      block.type === "npc-trade" ||
                      block.type === "fossil" ||
                      block.type === "event"
                    ) {
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

      {/* Col 3–9: Stats & Moves (7 cols) */}
      <div className="col-span-12 md:col-span-7 space-y-4">
        <Card>
            <CardHeader className="pb-2">
              <span className="text-sm font-medium">Stats & Moves</span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-[120px] rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 flex items-center justify-center text-muted-foreground text-sm">
                Charts (radar base stats, bar max/min) — em breve
              </div>
              <Tabs defaultValue="level-up">
                <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                  <TabsTrigger value="level-up" className="text-xs">Level Up</TabsTrigger>
                  <TabsTrigger value="tm-hm" className="text-xs">TMs/HMs</TabsTrigger>
                  <TabsTrigger value="breeding" className="text-xs">Breeding</TabsTrigger>
                  <TabsTrigger value="tutor" className="text-xs">Tutor</TabsTrigger>
                  <TabsTrigger value="special" className="text-xs">Special</TabsTrigger>
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
            </CardContent>
          </Card>
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
                <TabsTrigger value="battle-exp" className="flex-1 text-xs">
                  Battle Exp.
                </TabsTrigger>
                <TabsTrigger value="catch-rate" className="flex-1 text-xs">
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
