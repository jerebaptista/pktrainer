"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mars, Ruler, Scale, Sparkles, Venus, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import {
  getEncounterDisplayContent,
  getLocationDisplayName,
  getPokemonDisplayName,
} from "@/lib/api-adjustments";
import type { PokemonRow } from "@/lib/pokeapi";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatApiName } from "@/lib/utils";

type PokemonInfoCardProps = {
  pokemon: PokemonRow;
  theme?: "red" | "green";
  /** When true, render without Card wrapper (e.g. for compare view with separators). */
  noCard?: boolean;
};

export function PokemonInfoCard({ pokemon, theme: themeProp, noCard }: PokemonInfoCardProps) {
  const [spriteFront, setSpriteFront] = useState(true);
  const [shiny, setShiny] = useState(false);
  const [female, setFemale] = useState(false);
  const [themeState, setThemeState] = useState<"red" | "green">("red");

  const theme = themeProp ?? themeState;

  useEffect(() => {
    if (themeProp != null) return;
    const read = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setThemeState(t === "green" ? "green" : "red");
    };
    read();
    window.addEventListener("pk-trainer-theme-color-change", read);
    return () => window.removeEventListener("pk-trainer-theme-color-change", read);
  }, [themeProp]);

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

  const content = (
    <>
      <div className="flex w-full flex-col items-start gap-3">
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
                <Button
                  type="button"
                  variant="link"
                  className="h-auto py-0 px-0 text-primary font-normal hover:opacity-80 align-baseline"
                  onClick={(e) => e.preventDefault()}
                >
                  {formatApiName(a.name.trim())}
                  {a.isHidden ? " (Hidden)" : ""}
                </Button>
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
                      <Accordion
                        key={idx}
                        type="multiple"
                        className="text-sm text-foreground"
                      >
                        {block.byMethod.map(({ methodLabel, locations: locs }, mi) => (
                          <AccordionItem key={mi} value={methodLabel} className="border-border">
                            <AccordionTrigger className="py-2 text-left font-normal hover:no-underline">
                              {methodLabel}
                            </AccordionTrigger>
                            <AccordionContent className="pb-2 pt-0">
                              <span className="text-muted-foreground">in </span>
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
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    );
                  }
                  if (block.type === "static") {
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
    </>
  );

  if (noCard) {
    return <div className="space-y-4 w-full min-w-0">{content}</div>;
  }
  return (
    <Card className="w-full">
      <CardContent className="space-y-4">{content}</CardContent>
    </Card>
  );
}
