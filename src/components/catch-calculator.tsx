"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useGame } from "@/components/game-provider";
import {
  ballsForGeneration,
  catchProbability,
  formatCatchChance,
  type CatchBallId,
  type CatchStatus,
} from "@/lib/catch-rate";

const STATUSES: CatchStatus[] = ["none", "sleep", "freeze", "paralysis", "burn", "poison"];

const BALL_KEYS = {
  poke: "ballPoke",
  great: "ballGreat",
  ultra: "ballUltra",
  master: "ballMaster",
  safari: "ballSafari",
  net: "ballNet",
  nest: "ballNest",
  dive: "ballDive",
  repeat: "ballRepeat",
  timer: "ballTimer",
  quick: "ballQuick",
  dusk: "ballDusk",
  fast: "ballFast",
  heavy: "ballHeavy",
  level: "ballLevel",
  love: "ballLove",
  lure: "ballLure",
  moon: "ballMoon",
  friend: "ballFriend",
  sport: "ballSport",
  dream: "ballDream",
  beast: "ballBeast",
} as const;

const STATUS_KEYS = {
  none: "statusNone",
  sleep: "statusSleep",
  freeze: "statusFreeze",
  paralysis: "statusParalysis",
  burn: "statusBurn",
  poison: "statusPoison",
} as const;

function FieldCheck({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-muted-foreground">
      <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      <span>{label}</span>
    </label>
  );
}

export function CatchCalculator({
  catchRate,
  types,
  speciesId,
  weightHg,
  baseHp,
  baseSpeed,
}: {
  catchRate: number;
  types: string[];
  speciesId?: number;
  weightHg?: number;
  baseHp?: number;
  baseSpeed?: number;
}) {
  const t = useTranslations("Pokemon");
  const locale = useLocale();
  const { game } = useGame();
  const generation = game.generation;
  const balls = ballsForGeneration(generation, game.versionGroup);
  const [ball, setBall] = useState<CatchBallId>("poke");
  const [hpPercent, setHpPercent] = useState(100);
  const [exactlyOneHp, setExactlyOneHp] = useState(false);
  const [status, setStatus] = useState<CatchStatus>("none");
  const [level, setLevel] = useState(20);
  const [playerLevel, setPlayerLevel] = useState(50);
  const [turn, setTurn] = useState(1);
  const [nightOrCave, setNightOrCave] = useState(false);
  const [alreadyCaught, setAlreadyCaught] = useState(false);
  const [fishing, setFishing] = useState(false);
  const [inWater, setInWater] = useState(false);
  const [darkGrass, setDarkGrass] = useState(false);
  const [dexCaught, setDexCaught] = useState(0);
  const [badges, setBadges] = useState(8);
  const [catchingCharm, setCatchingCharm] = useState(false);
  const [offGuard, setOffGuard] = useState(false);
  const [capturePower, setCapturePower] = useState<0 | 1 | 2 | 3>(0);
  const [loveBallBonus, setLoveBallBonus] = useState(false);
  const selectedBall = balls.includes(ball) ? ball : "poke";

  const chance = useMemo(
    () =>
      catchProbability({
        catchRate,
        generation,
        versionGroup: game.versionGroup,
        ball: selectedBall,
        hpPercent,
        exactlyOneHp,
        status,
        types,
        speciesId,
        weightHg,
        baseHp,
        baseSpeed,
        level,
        playerLevel,
        turn,
        nightOrCave,
        alreadyCaught,
        fishing,
        inWater,
        darkGrass,
        dexCaught,
        badges,
        catchingCharm,
        offGuard,
        capturePower,
        loveBallBonus,
      }),
    [
      alreadyCaught,
      badges,
      baseHp,
      baseSpeed,
      capturePower,
      catchRate,
      catchingCharm,
      darkGrass,
      dexCaught,
      exactlyOneHp,
      fishing,
      game.versionGroup,
      generation,
      hpPercent,
      inWater,
      level,
      loveBallBonus,
      nightOrCave,
      offGuard,
      playerLevel,
      selectedBall,
      speciesId,
      status,
      turn,
      types,
      weightHg,
    ]
  );

  const showLevel = generation >= 2;
  const showTurn = generation >= 3;
  const showPlayerLevel = selectedBall === "level" || generation >= 8;
  const showNight = generation >= 4;
  const showRegistered = generation >= 3;
  const showFishing = generation >= 2 && generation <= 8;
  const showWater = generation >= 3;
  const showDarkGrass = generation === 5;
  const showDex = generation >= 5;
  const showBadges = generation >= 8;
  const showGen9 = generation >= 9;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">{t("catchRate")}</span>
        <span className="font-medium">{catchRate}</span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-muted-foreground">{t("ball")}</span>
        <Select value={selectedBall} onValueChange={(value) => setBall(value as CatchBallId)}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {balls.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(BALL_KEYS[item])}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between gap-3 text-muted-foreground">
          {t("hpRemaining")}
          <span className="font-medium text-foreground">{exactlyOneHp ? "1 HP" : `${hpPercent}%`}</span>
        </span>
        <Slider
          min={1}
          max={100}
          value={[hpPercent]}
          onValueChange={(value) => {
            setExactlyOneHp(false);
            setHpPercent(value[0] ?? 100);
          }}
          aria-label={t("hpRemaining")}
          disabled={exactlyOneHp}
        />
        <FieldCheck id="hp-one" label={t("hpExactlyOne")} checked={exactlyOneHp} onCheckedChange={setExactlyOneHp} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-muted-foreground">{t("status")}</span>
        <Select value={status} onValueChange={(value) => setStatus(value as CatchStatus)}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(STATUS_KEYS[item])}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </label>

      {showLevel || showTurn || showPlayerLevel ? (
        <div className="grid grid-cols-2 gap-2">
          {showLevel ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-muted-foreground">{t("wildLevel")}</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={level}
                onChange={(event) => setLevel(clampNumber(event.target.value, 1, 100, 20))}
              />
            </label>
          ) : null}
          {showPlayerLevel ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-muted-foreground">{t("playerLevel")}</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={playerLevel}
                onChange={(event) => setPlayerLevel(clampNumber(event.target.value, 1, 100, 50))}
              />
            </label>
          ) : null}
          {showTurn ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-muted-foreground">{t("turn")}</span>
              <Input
                type="number"
                min={1}
                max={99}
                value={turn}
                onChange={(event) => setTurn(clampNumber(event.target.value, 1, 99, 1))}
              />
            </label>
          ) : null}
          {showBadges ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-muted-foreground">{t("badges")}</span>
              <Input
                type="number"
                min={0}
                max={8}
                value={badges}
                onChange={(event) => setBadges(clampNumber(event.target.value, 0, 8, 8))}
              />
            </label>
          ) : null}
          {showDex ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-muted-foreground">{t("dexCaught")}</span>
              <Input
                type="number"
                min={0}
                max={1025}
                value={dexCaught}
                onChange={(event) => setDexCaught(clampNumber(event.target.value, 0, 1025, 0))}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {showNight || showRegistered || showFishing || showWater || showDarkGrass || selectedBall === "love" || showGen9 ? (
        <div className="flex flex-col gap-2">
          {showNight ? (
            <FieldCheck id="night" label={t("nightOrCave")} checked={nightOrCave} onCheckedChange={setNightOrCave} />
          ) : null}
          {showRegistered ? (
            <FieldCheck
              id="registered"
              label={t("alreadyCaught")}
              checked={alreadyCaught}
              onCheckedChange={setAlreadyCaught}
            />
          ) : null}
          {showFishing ? (
            <FieldCheck id="fishing" label={t("fishing")} checked={fishing} onCheckedChange={setFishing} />
          ) : null}
          {showWater ? (
            <FieldCheck id="water" label={t("inWater")} checked={inWater} onCheckedChange={setInWater} />
          ) : null}
          {showDarkGrass ? (
            <FieldCheck id="grass" label={t("darkGrass")} checked={darkGrass} onCheckedChange={setDarkGrass} />
          ) : null}
          {selectedBall === "love" ? (
            <FieldCheck id="love" label={t("loveBallMatch")} checked={loveBallBonus} onCheckedChange={setLoveBallBonus} />
          ) : null}
          {showGen9 ? (
            <>
              <FieldCheck id="off-guard" label={t("offGuard")} checked={offGuard} onCheckedChange={setOffGuard} />
              <FieldCheck
                id="charm"
                label={t("catchingCharm")}
                checked={catchingCharm}
                onCheckedChange={setCatchingCharm}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-muted-foreground">{t("capturePower")}</span>
                <Select
                  value={String(capturePower)}
                  onValueChange={(value) => setCapturePower(Number(value) as 0 | 1 | 2 | 3)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="0">{t("capturePowerNone")}</SelectItem>
                      <SelectItem value="1">{t("capturePower1")}</SelectItem>
                      <SelectItem value="2">{t("capturePower2")}</SelectItem>
                      <SelectItem value="3">{t("capturePower3")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-muted-foreground">{t("catchChance")}</span>
        <span className="text-lg font-semibold text-primary">{formatCatchChance(chance, locale)}</span>
      </div>
    </div>
  );
}

function clampNumber(value: string, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
