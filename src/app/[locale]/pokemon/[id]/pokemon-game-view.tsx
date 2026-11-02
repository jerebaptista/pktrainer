"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Mars, RotateCw, Star, Venus, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import { getLocalizedPokemonName } from "@/lib/api-adjustments";
import type { GameMechanics } from "@/lib/games";
import { listSpriteFallback, type GameMove, type PokemonGameDetail } from "@/lib/pokeapi-game";
import { CatchCalculator } from "@/components/catch-calculator";
import { getTypeBadgeClassName } from "@/lib/type-colors";
import { cn, formatApiName } from "@/lib/utils";
import { useLocale } from "next-intl";

type NavEntry = { id: number; name: string; regionalNumber: number } | null;

const STAT_MAX = 255;

export function PokemonGameView({
  pokemon,
  mechanics,
  prev,
  next,
}: {
  pokemon: PokemonGameDetail;
  mechanics: GameMechanics;
  prev: NavEntry;
  next: NavEntry;
}) {
  const t = useTranslations("Pokemon");
  const tPokedex = useTranslations("Pokedex");
  const locale = useLocale();
  const name = getLocalizedPokemonName(pokemon.name, pokemon.localizedNames, locale);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [shiny, setShiny] = useState(false);
  const [female, setFemale] = useState(false);

  const showShiny = mechanics.shiny && Boolean(pokemon.sprites.frontShiny);
  const showGender = Boolean(
    pokemon.sprites.frontFemale ||
      pokemon.sprites.backFemale ||
      pokemon.sprites.frontShinyFemale ||
      pokemon.sprites.backShinyFemale,
  );
  const showBack = Boolean(pokemon.sprites.back);

  const spriteSrc = useMemo(() => {
    const sprites = pokemon.sprites;
    if (female && shiny && facing === "back") return sprites.backShinyFemale ?? sprites.backShiny ?? sprites.back;
    if (female && shiny) return sprites.frontShinyFemale ?? sprites.frontShiny ?? sprites.front;
    if (female && facing === "back") return sprites.backFemale ?? sprites.back;
    if (female) return sprites.frontFemale ?? sprites.front;
    if (shiny && facing === "back") return sprites.backShiny ?? sprites.back;
    if (shiny) return sprites.frontShiny ?? sprites.front;
    if (facing === "back") return sprites.back ?? sprites.front;
    return sprites.front;
  }, [facing, female, pokemon.sprites, shiny]);

  const moveGroups = useMemo(() => {
    const groups: Array<{ id: GameMove["method"]; label: string; rows: GameMove[] }> = [
      { id: "level-up", label: t("byLevel"), rows: [] },
      { id: "machine", label: t("byTm"), rows: [] },
      { id: "egg", label: t("egg"), rows: [] },
      { id: "tutor", label: t("tutor"), rows: [] },
      { id: "special", label: t("specialMoves"), rows: [] },
    ];
    for (const move of pokemon.moves) {
      groups.find((group) => group.id === move.method)?.rows.push(move);
    }
    for (const group of groups) {
      group.rows.sort((a, b) => a.level - b.level || a.localizedName.localeCompare(b.localizedName));
    }
    return groups.filter((group) => group.rows.length > 0);
  }, [pokemon.moves, t]);

  const flags = [
    mechanics.baby && pokemon.isBaby ? t("baby") : null,
    pokemon.isLegendary ? t("legendary") : null,
    pokemon.isMythical ? t("mythical") : null,
  ].filter(Boolean) as string[];

  const playCry = () => {
    if (!pokemon.cryUrl) return;
    const audio = new Audio(pokemon.cryUrl);
    void audio.play();
  };

  const regional = pokemon.regionalNumber ?? pokemon.nationalNumber;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <section className="flex flex-col gap-4 xl:col-span-1">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex aspect-square items-center justify-center">
            {spriteSrc ? (
              <Image
                src={spriteSrc}
                alt={name}
                width={192}
                height={192}
                className="size-44 object-contain pixelated"
                unoptimized
                onError={(event) => {
                  event.currentTarget.src = listSpriteFallback(pokemon.id);
                }}
              />
            ) : null}
          </div>
          <div className="mt-3 flex justify-center">
            <ButtonGroup>
              {showBack && (
                <SpriteControl
                  label={t("flip")}
                  pressed={facing === "back"}
                  onClick={() => setFacing((value) => (value === "front" ? "back" : "front"))}
                >
                  <RotateCw />
                </SpriteControl>
              )}
              {showGender && (
                <SpriteControl
                  label={female ? t("female") : t("male")}
                  pressed={female}
                  onClick={() => setFemale((value) => !value)}
                >
                  {female ? <Venus /> : <Mars />}
                </SpriteControl>
              )}
              {showShiny && (
                <SpriteControl
                  label={t("brilliant")}
                  pressed={shiny}
                  onClick={() => setShiny((value) => !value)}
                >
                  <Star className={cn(shiny && "fill-current")} />
                </SpriteControl>
              )}
              {pokemon.cryUrl && (
                <SpriteControl label={t("cry")} onClick={playCry}>
                  <Volume2 />
                </SpriteControl>
              )}
            </ButtonGroup>
          </div>
        </div>

        {pokemon.flavorText && (
          <p className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            {pokemon.flavorText}
          </p>
        )}

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap gap-1.5">
            {pokemon.types.map((type) => (
              <Badge key={type} className={cn("capitalize", getTypeBadgeClassName(type))}>
                {type}
              </Badge>
            ))}
          </div>
          {flags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {flags.map((flag) => (
                <Badge key={flag} variant="outline">
                  {flag}
                </Badge>
              ))}
            </div>
          )}
          <dl className="mt-4 space-y-2 text-sm">
            <Row label={t("species")} value={pokemon.genus} />
            <Row label={t("height")} value={formatHeight(pokemon.height)} />
            <Row label={t("weight")} value={formatWeight(pokemon.weight)} />
          </dl>
        </div>

        {mechanics.abilities && pokemon.abilities.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">{t("abilities")}</h2>
            <ul className="space-y-1 text-sm">
              {pokemon.abilities.map((ability) => (
                <li key={`${ability.name}-${ability.isHidden}`}>
                  {formatApiName(ability.name)}
                  {ability.isHidden ? <span className="text-muted-foreground"> · {t("hidden")}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pokemon.locations.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">{t("whereToFind")}</h2>
            <ul className="space-y-2 text-sm">
              {pokemon.locations.map((location, index) => (
                <li key={`${location.area}-${location.method}-${index}`}>
                  <p className="font-medium">{location.area}</p>
                  <p className="text-muted-foreground">
                    {location.method} · {location.levels}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 xl:col-span-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              #{String(pokemon.nationalNumber).padStart(4, "0")} · {tPokedex("national")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              #{String(regional).padStart(3, "0")} · {name}
            </h1>
          </div>
          <div className="flex gap-2">
            {prev && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/pokemon/${prev.id}`}>
                  <ChevronLeft />
                  #{String(prev.regionalNumber).padStart(3, "0")}
                </Link>
              </Button>
            )}
            {next && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/pokemon/${next.id}`}>
                  #{String(next.regionalNumber).padStart(3, "0")}
                  <ChevronRight />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">{t("stats")}</h2>
          <div className="space-y-2">
            {pokemon.stats.map((stat) => (
              <div key={stat.key} className="grid grid-cols-[7rem_2.5rem_1fr] items-center gap-2 text-sm">
                <span className="text-muted-foreground">{statLabel(stat.key, t)}</span>
                <span className="text-right font-medium">{stat.value}</span>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (stat.value / STAT_MAX) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {moveGroups.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">{t("moves")}</h2>
            <Tabs defaultValue={moveGroups[0]?.id}>
              <TabsList variant="line" className="flex-wrap">
                {moveGroups.map((group) => (
                  <TabsTrigger key={group.id} value={group.id}>
                    {group.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {moveGroups.map((group) => (
                <TabsContent key={group.id} value={group.id} className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr>
                        {group.id === "level-up" && <th className="pb-2 pr-3 font-medium">{t("level")}</th>}
                        <th className="pb-2 pr-3 font-medium">{t("moves")}</th>
                        <th className="pb-2 pr-3 font-medium">{t("moveType")}</th>
                        <th className="pb-2 pr-3 font-medium">{t("power")}</th>
                        <th className="pb-2 pr-3 font-medium">{t("accuracy")}</th>
                        <th className="pb-2 font-medium">{t("pp")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((move) => (
                        <tr key={`${group.id}-${move.name}-${move.level}`} className="border-t border-border/70">
                          {group.id === "level-up" && <td className="py-1.5 pr-3">{move.level || "—"}</td>}
                          <td className="py-1.5 pr-3 font-medium">{move.localizedName}</td>
                          <td className="py-1.5 pr-3">
                            <Badge className={cn("capitalize", getTypeBadgeClassName(move.type))}>{move.type}</Badge>
                          </td>
                          <td className="py-1.5 pr-3">{move.power ?? "—"}</td>
                          <td className="py-1.5 pr-3">{move.accuracy ?? "—"}</td>
                          <td className="py-1.5">{move.pp ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 xl:col-span-1">
        <InfoCard title={t("training")}>
          <dl className="flex flex-col gap-2 text-sm">
            {pokemon.evYield.length > 0 && (
              <Row
                label={t("evYield")}
                value={pokemon.evYield.map((entry) => `${entry.value} ${statLabel(entry.key, t)}`).join(", ")}
              />
            )}
            {mechanics.friendship && pokemon.baseFriendship != null && (
              <Row label={t("baseFriendship")} value={String(pokemon.baseFriendship)} />
            )}
            {pokemon.baseExperience != null && <Row label={t("baseExp")} value={String(pokemon.baseExperience)} />}
            {pokemon.growthRate && <Row label={t("growthRate")} value={formatApiName(pokemon.growthRate)} />}
          </dl>
        </InfoCard>

        {(mechanics.gender || mechanics.eggs) && (
          <InfoCard title={t("breeding")}>
            <dl className="flex flex-col gap-2 text-sm">
              {mechanics.gender && <Row label={t("gender")} value={genderLabel(pokemon.genderRate, t)} />}
              {mechanics.eggs && pokemon.eggGroups.length > 0 && (
                <Row label={t("eggGroups")} value={pokemon.eggGroups.map(formatApiName).join(", ")} />
              )}
              {mechanics.eggs && pokemon.eggCycles != null && (
                <Row label={t("eggCycles")} value={String(pokemon.eggCycles)} />
              )}
            </dl>
          </InfoCard>
        )}

        {pokemon.catchRate != null && (
          <InfoCard title={t("catching")}>
            <CatchCalculator
              catchRate={pokemon.catchRate}
              types={pokemon.types}
              speciesId={pokemon.nationalNumber}
              weightHg={pokemon.weight}
              baseHp={pokemon.stats.find((stat) => stat.key === "hp")?.value}
              baseSpeed={pokemon.stats.find((stat) => stat.key === "speed")?.value}
            />
          </InfoCard>
        )}

        {pokemon.evolutions.length > 1 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">{t("evolution")}</h2>
            <ol className="space-y-3">
              {pokemon.evolutions.map((node) => (
                <li key={node.id}>
                  <Link href={`/pokemon/${node.id}`} className="flex items-center gap-3 rounded-lg hover:bg-accent/50">
                    <Image
                      src={node.spriteUrl}
                      alt={node.localizedName}
                      width={48}
                      height={48}
                      className="size-12 object-contain"
                      unoptimized
                      onError={(event) => {
                        event.currentTarget.src = listSpriteFallback(node.id);
                      }}
                    />
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-medium", node.id === pokemon.id && "text-primary")}>
                        {node.localizedName}
                      </p>
                      {node.condition && <p className="text-xs text-muted-foreground">{node.condition}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}

function SpriteControl({
  label,
  pressed,
  className,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={label}
          aria-pressed={pressed}
          className={className}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function formatHeight(heightDm: number): string {
  const meters = heightDm / 10;
  const totalInches = meters * 39.37007874;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return `${meters.toFixed(1)} m (${feet}′${String(inches).padStart(2, "0")}″)`;
}

function formatWeight(weightHg: number): string {
  const kg = weightHg / 10;
  return `${kg.toFixed(1)} kg (${(kg * 2.20462).toFixed(1)} lbs)`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function statLabel(key: string, t: (key: "hp" | "attack" | "defense" | "specialAttack" | "specialDefense" | "special" | "speed") => string) {
  const map: Record<string, string> = {
    hp: t("hp"),
    attack: t("attack"),
    defense: t("defense"),
    "special-attack": t("specialAttack"),
    specialAttack: t("specialAttack"),
    "special-defense": t("specialDefense"),
    specialDefense: t("specialDefense"),
    special: t("special"),
    speed: t("speed"),
  };
  return map[key] ?? formatApiName(key);
}

function genderLabel(rate: number, t: (key: "genderless" | "male" | "female") => string) {
  if (rate < 0) return t("genderless");
  const female = (rate / 8) * 100;
  const male = 100 - female;
  return `${male}% ${t("male")} / ${female}% ${t("female")}`;
}
