"use client";

import { Link } from "@/i18n/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import { usePokemonName } from "@/hooks/use-pokemon-name";
import type { BaseStats, PokemonRow } from "@/lib/pokeapi";
import { cn } from "@/lib/utils";
import Tilt from "react-parallax-tilt";
import type { StatsMode } from "./pokedex-filters";
import type { ReactNode } from "react";

const POKEMON_WITH_GLARE = new Set(["articuno", "zapdos", "moltres", "mewtwo", "mew"]);
const LEGENDARY_GLARE_COLOR: Record<string, string> = {
  articuno: "lightblue",
  zapdos: "lightyellow",
  moltres: "lightcoral",
  mewtwo: "plum",
  mew: "lightpink",
};
const MAX_SELECT_FOR_COMPARE = 6;

type PokedexCardViewProps = {
  sorted: PokemonRow[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  flippedCardId: number | null;
  onFlippedCardIdChange: (id: number | null) => void;
  cardViewShiny: boolean;
  statsMode: StatsMode;
  statColumns: readonly string[];
  statLabels: Record<string, string>;
  heightWeightUnit: "imperial" | "metric";
  renderAvailabilityPart: (part: string, p: PokemonRow) => ReactNode;
  formatHeight: (heightDm: number, unit: "imperial" | "metric") => string;
  formatWeight: (weightHg: number, unit: "imperial" | "metric") => string;
};

export function PokedexCardView({
  sorted,
  selectedIds,
  onToggleSelect,
  flippedCardId,
  onFlippedCardIdChange,
  cardViewShiny,
  statsMode,
  statColumns,
  statLabels,
  heightWeightUnit,
  renderAvailabilityPart,
  formatHeight,
  formatWeight,
}: PokedexCardViewProps) {
  const getName = usePokemonName();
  return (
    <div className="@container w-full p-6">
      <div className="grid grid-cols-2 gap-4 items-start @[24rem]:grid-cols-3 @[32rem]:grid-cols-4 @[40rem]:grid-cols-5 @[48rem]:grid-cols-6 @[56rem]:grid-cols-7 @[64rem]:grid-cols-8">
        {sorted.map((p) => {
          const hasGlare = POKEMON_WITH_GLARE.has(p.name);
          const isSelected = selectedIds.includes(p.id);
          const isFlipped = flippedCardId === p.id;
          const cardSpriteUrl = cardViewShiny && p.spriteUrlShiny ? p.spriteUrlShiny : p.spriteUrl;
          const toggleFlip = () => {
            onFlippedCardIdChange(isFlipped ? null : p.id);
          };
          return (
            <div key={p.id} className="group relative">
              <div className="block rounded-lg">
                <Tilt
                  tiltMaxAngleX={20}
                  tiltMaxAngleY={20}
                  perspective={800}
                  glareEnable={hasGlare}
                  glareMaxOpacity={0.55}
                  glareColor={hasGlare ? LEGENDARY_GLARE_COLOR[p.name] ?? "white" : "white"}
                  glareBorderRadius="0.5rem"
                >
                  <div
                    className="relative cursor-pointer [perspective:1000px]"
                    onClick={toggleFlip}
                  >
                    {!isFlipped && (selectedIds.length < MAX_SELECT_FOR_COMPARE || isSelected) && (
                      <div
                        className={cn(
                          "absolute left-2 top-2.5 z-20 px-1.5 py-0.5 bg-background rounded-sm border-border transition-opacity",
                          "opacity-0 group-hover:opacity-100",
                          isSelected && "opacity-100"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        role="presentation"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleSelect(p.id)}
                          aria-label={`Select ${getName(p)} for comparison`}
                          className="border-border"
                        />
                      </div>
                    )}
                    <div
                      className={cn(
                        "relative w-full transition-transform duration-300 [transform-style:preserve-3d]",
                        isFlipped && "[transform:rotateY(180deg)]"
                      )}
                    >
                      <div
                        className={cn(
                          "flex min-h-[220px] flex-col gap-2 rounded-xl border bg-card px-4 py-4 shadow-none [backface-visibility:hidden]",
                          isSelected ? "border-primary" : "border-border",
                          isFlipped && "pointer-events-none"
                        )}
                      >
                        <div className="relative flex min-h-[100px] w-full items-center justify-center rounded-lg p-3">
                          <div className="absolute inset-0 rounded-lg bg-muted/50 mix-blend-multiply" aria-hidden />
                          <div className="relative z-10 flex items-center justify-center">
                            {cardSpriteUrl ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (p.cryUrl) {
                                    const audio = new Audio(p.cryUrl);
                                    audio.volume = 0.3;
                                    audio.play().catch(() => {});
                                  }
                                }}
                                disabled={!p.cryUrl}
                                className={cn(
                                  "rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border-0 bg-transparent p-0",
                                  p.cryUrl && "cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                                )}
                                aria-label={p.cryUrl ? `Play ${getName(p)} cry` : undefined}
                              >
                                <Tilt
                                  tiltReverse
                                  tiltMaxAngleX={15}
                                  tiltMaxAngleY={15}
                                  perspective={800}
                                  className="inline-block"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={cardSpriteUrl}
                                    alt={getName(p)}
                                    width={96}
                                    height={96}
                                    className="object-contain pointer-events-none"
                                  />
                                </Tilt>
                              </button>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs font-normal text-muted-foreground">
                            #{String(p.id).padStart(3, "0")}
                          </span>
                          <Link
                            href={`/pokemon/${p.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block w-fit max-w-full truncate font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                          >
                            {getName(p)}
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {p.types.map((t) => (
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
                        <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{formatHeight(p.height, heightWeightUnit)}</span>
                            </TooltipTrigger>
                            <TooltipContent>Height</TooltipContent>
                          </Tooltip>
                          <span aria-hidden>·</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{formatWeight(p.weight, heightWeightUnit)}</span>
                            </TooltipTrigger>
                            <TooltipContent>Weight</TooltipContent>
                          </Tooltip>
                        </p>
                        <p className="truncate text-xs text-muted-foreground" title={p.availability}>
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
                        </p>
                      </div>
                      <div
                        className={cn(
                          "absolute inset-0 flex flex-col gap-1 rounded-xl border bg-card px-4 py-4 shadow-none [backface-visibility:hidden] [transform:rotateY(180deg)]",
                          isSelected ? "border-primary" : "border-border"
                        )}
                      >
                        {(() => {
                          const statsSource =
                            statsMode === "base" ? p.baseStats : statsMode === "max" ? p.maxStats : p.minStats;
                          return (
                            <div className="flex flex-col gap-1 text-xs">
                              {statColumns.map((key) => (
                                <span key={key} className="flex justify-between font-mono">
                                  <span className="text-muted-foreground">{statLabels[key]}</span>
                                  <span>
                                    {statsSource[key as keyof BaseStats] ?? "—"}
                                  </span>
                                </span>
                              ))}
                              <div className="my-1.5 border-t border-border" role="separator" />
                              <span className="flex justify-between font-mono">
                                <span className="text-muted-foreground">Base Exp.</span>
                                <span>{p.baseExperience ?? "—"}</span>
                              </span>
                              <span className="flex justify-between font-mono">
                                <span className="text-muted-foreground">Catch rate</span>
                                <span>{p.catchRate ?? "—"}</span>
                              </span>
                              <span className="flex justify-between">
                                <span className="text-muted-foreground">EV Yield</span>
                                <span className="truncate">{p.evYield ?? "—"}</span>
                              </span>
                              <span className="flex justify-between font-mono">
                                <span className="text-muted-foreground">Friendship</span>
                                <span>{p.baseFriendship ?? "—"}</span>
                              </span>
                              <span className="flex justify-between">
                                <span className="text-muted-foreground">Growth rate</span>
                                <span>
                                  {p.growthRate
                                    ? p.growthRate.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                                    : "—"}
                                </span>
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </Tilt>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
