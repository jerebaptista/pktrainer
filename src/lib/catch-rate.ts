export type CatchStatus = "none" | "sleep" | "freeze" | "paralysis" | "burn" | "poison";

export type CatchBallId =
  | "poke"
  | "great"
  | "ultra"
  | "master"
  | "safari"
  | "net"
  | "nest"
  | "dive"
  | "repeat"
  | "timer"
  | "quick"
  | "dusk"
  | "fast"
  | "heavy"
  | "level"
  | "love"
  | "lure"
  | "moon"
  | "friend"
  | "sport"
  | "dream"
  | "beast";

export type CatchInput = {
  catchRate: number;
  generation: number;
  versionGroup?: string;
  ball: CatchBallId;
  hpPercent: number;
  exactlyOneHp?: boolean;
  status: CatchStatus;
  types?: string[];
  speciesId?: number;
  weightHg?: number;
  baseHp?: number;
  baseSpeed?: number;
  level?: number;
  playerLevel?: number;
  turn?: number;
  nightOrCave?: boolean;
  alreadyCaught?: boolean;
  fishing?: boolean;
  inWater?: boolean;
  darkGrass?: boolean;
  dexCaught?: number;
  badges?: number;
  catchingCharm?: boolean;
  offGuard?: boolean;
  capturePower?: 0 | 1 | 2 | 3;
  loveBallBonus?: boolean;
};

const MOON_FAMILY_HGSS = new Set([29, 30, 31, 32, 33, 34, 35, 36, 39, 40, 173, 174, 300, 301]);
const MOON_EVOLVERS = new Set([30, 33, 35, 39, 300, 517]);
const GEN2_FAST_IDS = new Set([81, 88, 114]);
const CRYSTAL_HEAVY_BUG_IDS = new Set([64, 128, 192]);
const ULTRA_BEAST_IDS = new Set([793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806]);
const KOMALA_ID = 775;

const GEN9_BADGE_LEVELS = [25, 30, 35, 40, 45, 50, 55, 60, 100];
const DEX_GRASS = [1229 / 4096, 0.5, 2867 / 4096, 3277 / 4096, 3686 / 4096, 1];
const DEX_CRIT = [0, 0.5, 1, 1.5, 2, 2.5];
const CAPTURE_POWER = { 0: 1, 1: 1.1, 2: 1.25, 3: 2 } as const;

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function down4096(value: number): number {
  return Math.floor(value * 4096) / 4096;
}

function round4096(value: number): number {
  return Math.round(value * 4096) / 4096;
}

function fround32(value: number): number {
  return Math.fround(value);
}

function dexCategory(dexCaught: number): number {
  let category = 0;
  if (dexCaught > 30) category += 1;
  if (dexCaught > 150) category += 1;
  if (dexCaught > 300) category += 1;
  if (dexCaught > 450) category += 1;
  if (dexCaught > 600) category += 1;
  return category;
}

function isUltraBeast(speciesId?: number): boolean {
  return speciesId != null && ULTRA_BEAST_IDS.has(speciesId);
}

function statusCode(status: CatchStatus): "none" | "psn" | "par" | "brn" | "slp" | "frz" {
  if (status === "poison") return "psn";
  if (status === "paralysis") return "par";
  if (status === "burn") return "brn";
  if (status === "sleep") return "slp";
  if (status === "freeze") return "frz";
  return "none";
}

function typicalMaxHp(baseHp: number | undefined, level: number, generation: number): number {
  if (baseHp == null || baseHp <= 0) return 100;
  if (baseHp === 1) return 1;
  if (generation <= 2) {
    return Math.floor(((2 * baseHp + 14) * level) / 100 + level + 10);
  }
  return Math.floor(((2 * baseHp + 15) * level) / 100 + level + 10);
}

function currentHp(maxHp: number, hpPercent: number, exactlyOneHp?: boolean): number {
  if (maxHp <= 1) return 1;
  if (exactlyOneHp) return 1;
  return Math.max(1, Math.round((maxHp * clampInt(hpPercent, 1, 100)) / 100));
}

function gen1BallRange(ball: CatchBallId): number {
  if (ball === "great") return 201;
  if (ball === "ultra" || ball === "safari") return 151;
  return 256;
}

function gen1StatusThreshold(status: CatchStatus): number {
  if (status === "sleep" || status === "freeze") return 25;
  if (status === "paralysis" || status === "burn" || status === "poison") return 12;
  return 0;
}

function catchProbabilityGen1(input: CatchInput, maxHp: number, hp: number): number {
  if (input.ball === "master") return 1;
  const ballRange = gen1BallRange(input.ball);
  const statusValue = gen1StatusThreshold(input.status);
  const divisor = input.ball === "great" ? 8 : 12;
  const factor = Math.min(255, Math.floor(Math.floor((maxHp * 255) / divisor) / Math.max(1, Math.floor(hp / 4))));
  return (statusValue + Math.min(input.catchRate + 1, ballRange - statusValue) * ((factor + 1) / 256)) / ballRange;
}

function gen2ModifiedCatchRate(input: CatchInput): number {
  let catchRate = input.catchRate;
  switch (input.ball) {
    case "great":
    case "sport":
      catchRate = Math.floor(catchRate * 1.5);
      break;
    case "ultra":
      catchRate *= 2;
      break;
    case "fast":
      if (input.speciesId != null && GEN2_FAST_IDS.has(input.speciesId)) catchRate *= 4;
      break;
    case "heavy": {
      const weight = input.weightHg ?? 0;
      if (input.versionGroup === "crystal" && input.speciesId != null && CRYSTAL_HEAVY_BUG_IDS.has(input.speciesId)) {
        catchRate += 40;
      } else if (weight >= 4096) catchRate += 40;
      else if (weight >= 3072) catchRate += 30;
      else if (weight >= 2048) catchRate += 20;
      else if (weight < 1024) catchRate -= 20;
      break;
    }
    case "level": {
      const playerLevel = input.playerLevel ?? 50;
      const wildLevel = input.level ?? 20;
      if (Math.floor(playerLevel / 4) > wildLevel) catchRate *= 8;
      else if (Math.floor(playerLevel / 2) > wildLevel) catchRate *= 4;
      else if (playerLevel > wildLevel) catchRate *= 2;
      return Math.min(255, catchRate);
    }
    case "love":
      if (input.loveBallBonus) catchRate *= 8;
      break;
    case "lure":
      if (input.fishing) catchRate *= 3;
      break;
    default:
      break;
  }
  if (catchRate > 255) return 255;
  if (catchRate < 0) return 1;
  return catchRate;
}

function catchProbabilityGen2(input: CatchInput, maxHp: number, hp: number): number {
  if (input.ball === "master") return 1;
  const catchRate = gen2ModifiedCatchRate(input);
  if (input.ball === "level") return (Math.min(255, catchRate) + 1) / 256;

  let maxTerm = maxHp * 3;
  let currentTerm = hp * 2;
  if (maxTerm > 255) {
    maxTerm = Math.floor(maxTerm / 4);
    if (maxTerm > 255) {
      maxTerm %= 256;
      currentTerm = Math.floor(currentTerm / 4) % 256;
      if (currentTerm === 0) currentTerm = 1;
    } else {
      maxTerm %= 256;
      currentTerm = Math.floor(currentTerm / 4) % 256;
      if (currentTerm === 0) currentTerm = 1;
    }
  }
  if (maxTerm === 0) return 0;

  let difference = maxTerm - currentTerm;
  if (difference < 0) difference += 256;
  const beforeStatus = Math.floor(Math.max((difference * catchRate) / maxTerm, 1)) % 256;
  const statusValue = input.status === "sleep" || input.status === "freeze" ? 10 : 0;
  const x = Math.min(255, beforeStatus + statusValue);
  return (x + 1) / 256;
}

function applyApricornCatchRate(input: CatchInput, catchRate: number): number {
  let next = catchRate;
  switch (input.ball) {
    case "fast":
      if ((input.baseSpeed ?? 0) >= 100) next *= 4;
      break;
    case "heavy": {
      const weight = input.weightHg ?? 0;
      if (weight >= 4096) next += 40;
      else if (weight >= 3072) next += 30;
      else if (weight >= 2048) next += 20;
      else next -= 20;
      break;
    }
    case "level": {
      const playerLevel = input.playerLevel ?? 50;
      const wildLevel = input.level ?? 20;
      if (Math.floor(playerLevel / 4) > wildLevel) next *= 8;
      else if (Math.floor(playerLevel / 2) > wildLevel) next *= 4;
      else if (playerLevel > wildLevel) next *= 2;
      break;
    }
    case "love":
      if (input.loveBallBonus) next *= 8;
      break;
    case "lure":
      if (input.fishing) next *= 3;
      break;
    case "moon":
      if (input.speciesId != null && MOON_FAMILY_HGSS.has(input.speciesId)) next *= 4;
      break;
    default:
      break;
  }
  if (next > 255) return 255;
  if (next < 0) return 1;
  return next;
}

function ballBonusGen34(input: CatchInput): number {
  switch (input.ball) {
    case "great":
    case "safari":
    case "sport":
      return 1.5;
    case "ultra":
      return 2;
    case "master":
      return -1;
    case "net":
      return input.types?.some((type) => type === "water" || type === "bug") ? 3 : 1;
    case "nest":
      return Math.max(1, (40 - (input.level ?? 20)) / 10);
    case "dive":
      return input.inWater ? 3.5 : 1;
    case "repeat":
      return input.alreadyCaught ? 3 : 1;
    case "timer":
      return Math.min(4, ((input.turn ?? 1) - 1 + 10) / 10);
    case "quick":
      return (input.turn ?? 1) === 1 ? 4 : 1;
    case "dusk":
      return input.nightOrCave ? 3.5 : 1;
    default:
      return 1;
  }
}

function catchProbabilityGen34(input: CatchInput, maxHp: number, hp: number): number {
  if (input.ball === "master") return 1;
  let catchRate = input.catchRate;
  if (input.versionGroup === "heartgold-soulsilver") {
    catchRate = applyApricornCatchRate(input, catchRate);
  }
  const bonus = ballBonusGen34(input);
  if (bonus === -1) return 1;
  const status =
    input.status === "sleep" || input.status === "freeze"
      ? 2
      : input.status === "none"
        ? 1
        : 1.5;
  const x = Math.max(
    1,
    Math.floor(Math.floor(((3 * maxHp - 2 * hp) * Math.floor(catchRate * bonus)) / (3 * maxHp)) * status)
  );
  if (x >= 255) return 1;
  const shake = Math.floor(1048560 / Math.floor(Math.sqrt(Math.floor(Math.sqrt(16711680 / x)))));
  return Math.min(1, (shake / 65536) ** 4);
}

function ballBonusGen5(input: CatchInput): number {
  switch (input.ball) {
    case "great":
    case "safari":
      return 1.5;
    case "ultra":
      return 2;
    case "master":
    case "dream":
      return -1;
    case "net":
      return input.types?.some((type) => type === "water" || type === "bug") ? 3 : 1;
    case "nest":
      return Math.max(1, (41 - (input.level ?? 20)) / 10);
    case "dive":
      return input.inWater ? 3.5 : 1;
    case "repeat":
      return input.alreadyCaught ? 3 : 1;
    case "timer":
      return Math.min(4, 1 + ((input.turn ?? 1) - 1) * (1229 / 4096));
    case "quick":
      return (input.turn ?? 1) === 1 ? 5 : 1;
    case "dusk":
      return input.nightOrCave ? 3.5 : 1;
    default:
      return 1;
  }
}

function withCritical(normal: number, criticalRate: number, criticalSuccess: number): number {
  return criticalRate * criticalSuccess + (1 - criticalRate) * normal;
}

function catchProbabilityGen5(input: CatchInput, maxHp: number, hp: number): number {
  const bonus = ballBonusGen5(input);
  if (bonus === -1) return 1;
  const status =
    input.status === "sleep" || input.status === "freeze"
      ? 2.5
      : input.status === "none"
        ? 1
        : 1.5;
  const grass = input.darkGrass ? DEX_GRASS[dexCategory(input.dexCaught ?? 0)] : 1;
  const x = Math.min(
    255,
    down4096(
      round4096(
        down4096(round4096(round4096((3 * maxHp - 2 * hp) * grass) * input.catchRate * bonus) / (3 * maxHp)) * status
      ) *
        100 /
        100
    )
  );
  if (x >= 256) return 1;
  const shake =
    x === 0 ? 0 : Math.floor(round4096(65536 / round4096(Math.sqrt(round4096(Math.sqrt(round4096(255 / x)))))));
  const shakeChance = Math.min(1, shake / 65536);
  const criticalCount = Math.floor(round4096(round4096(x * DEX_CRIT[dexCategory(input.dexCaught ?? 0)]) / 6));
  return withCritical(shakeChance ** 3, Math.min(1, criticalCount / 256), shakeChance);
}

function ballBonusModern(input: CatchInput): number {
  const generation = input.generation;
  const isGen7Plus = generation >= 7;
  if (isUltraBeast(input.speciesId) && input.ball !== "beast" && input.ball !== "master") {
    return 410 / 4096;
  }

  switch (input.ball) {
    case "great":
      return 1.5;
    case "safari":
      return generation <= 7 || input.versionGroup === "brilliant-diamond-and-shining-pearl" ? 1.5 : 1;
    case "ultra":
      return 2;
    case "master":
      return -1;
    case "dream":
      if (generation === 6) return -1;
      if (generation >= 8 && (input.status === "sleep" || input.speciesId === KOMALA_ID)) return 4;
      return 1;
    case "net":
      return input.types?.some((type) => type === "water" || type === "bug") ? (isGen7Plus ? 3.5 : 3) : 1;
    case "nest":
      return (input.level ?? 20) < 30 ? Math.max(1, (41 - (input.level ?? 20)) / 10) : 1;
    case "dive":
      return input.inWater ? 3.5 : 1;
    case "repeat":
      return input.alreadyCaught ? (isGen7Plus ? 3.5 : 3) : 1;
    case "timer":
      return Math.min(4, 1 + ((input.turn ?? 1) - 1) * (1229 / 4096));
    case "quick":
      return (input.turn ?? 1) === 1 ? 5 : 1;
    case "dusk":
      return input.nightOrCave ? (isGen7Plus ? 3 : 3.5) : 1;
    case "fast":
      return (input.baseSpeed ?? 0) >= 100 ? 4 : 1;
    case "level": {
      const playerLevel = input.playerLevel ?? 50;
      const wildLevel = input.level ?? 20;
      if (Math.floor(playerLevel / 4) >= wildLevel) return 8;
      if (Math.floor(playerLevel / 2) >= wildLevel) return 4;
      if (playerLevel > wildLevel) return 2;
      return 1;
    }
    case "love":
      return input.loveBallBonus ? 8 : 1;
    case "lure":
      if (generation >= 9) return input.inWater ? 4 : 1;
      if (generation === 8) return input.fishing ? 4 : 1;
      if (generation === 7) return input.fishing ? 5 : 1;
      return input.fishing ? 3 : 1;
    case "moon":
      return input.speciesId != null && MOON_EVOLVERS.has(input.speciesId) ? 4 : 1;
    case "beast":
      return isUltraBeast(input.speciesId) ? 5 : 410 / 4096;
    default:
      return 1;
  }
}

function applyModernHeavyBall(input: CatchInput, catchRate: number): number {
  if (input.ball !== "heavy") return catchRate;
  const weight = input.weightHg ?? 0;
  let next = catchRate;
  if (weight >= 3000) next += 30;
  else if (weight >= 2000) next += 20;
  else if (weight < 1000) next -= 20;
  const minimum = input.generation === 7 && input.versionGroup !== "ultra-sun-ultra-moon" ? 0 : 1;
  return Math.min(255, Math.max(minimum, next));
}

function shakeChanceModern(x: number, useFloatPow: boolean): number {
  if (x === 0) return 0;
  const powered = useFloatPow
    ? fround32(Math.pow(round4096(255 / x), 3 / 16))
    : Math.pow(round4096(255 / x), 3 / 16);
  const shake = Math.floor(round4096(65536 / round4096(powered)));
  return Math.min(1, shake / 65536);
}

function catchProbabilityGen67(input: CatchInput, maxHp: number, hp: number): number {
  const catchRate = applyModernHeavyBall(input, input.catchRate);
  const bonus = ballBonusModern(input);
  if (bonus === -1) return 1;
  const status =
    input.status === "sleep" || input.status === "freeze"
      ? 2.5
      : input.status === "none"
        ? 1
        : 1.5;
  const grass = input.darkGrass ? DEX_GRASS[dexCategory(input.dexCaught ?? 0)] : 1;
  const x = Math.min(
    255,
    down4096(
      round4096(
        down4096(round4096(round4096((3 * maxHp - 2 * hp) * grass) * catchRate * bonus) / (3 * maxHp)) * status
      ) *
        100 /
        100
    )
  );
  if (x >= 256) return 1;
  const shakeChance = shakeChanceModern(x, false);
  const criticalCount = Math.floor(round4096(round4096(x * DEX_CRIT[dexCategory(input.dexCaught ?? 0)]) / 6));
  return withCritical(shakeChance ** 4, Math.min(1, criticalCount / 256), shakeChance);
}

function catchProbabilityGen8(input: CatchInput, maxHp: number, hp: number): number {
  const catchRate = Math.max(1, applyModernHeavyBall(input, input.catchRate));
  const bonus = ballBonusModern(input);
  if (bonus === -1) return 1;
  const status =
    input.status === "sleep" || input.status === "freeze"
      ? 2.5
      : input.status === "none"
        ? 1
        : 1.5;
  const grass = input.darkGrass ? DEX_GRASS[dexCategory(input.dexCaught ?? 0)] : 1;
  const lowLevel = (input.level ?? 20) < 21 ? 30 - (input.level ?? 20) : 10;
  const difficulty = (input.badges ?? 8) < 8 && (input.playerLevel ?? 70) < (input.level ?? 20) ? 410 : 4096;
  const x = Math.min(
    255,
    round4096(
      (round4096(
        down4096(down4096(round4096(round4096((3 * maxHp - 2 * hp) * grass) * catchRate * bonus) / (3 * maxHp)) * (lowLevel / 10)) *
          status
      ) *
        difficulty) /
        4096
    )
  );
  if (x >= 255) return 1;
  const shakeChance = shakeChanceModern(x, true);
  const charm = input.catchingCharm ? 2 : 1;
  const criticalCount = Math.floor(round4096((Math.min(x, 255) * DEX_CRIT[dexCategory(input.dexCaught ?? 0)] * charm) / 6));
  return withCritical(shakeChance ** 4, Math.min(1, criticalCount / 256), shakeChance);
}

function catchProbabilityGen9(input: CatchInput, maxHp: number, hp: number): number {
  let catchRate = input.catchRate;
  if (input.ball === "heavy") {
    catchRate = applyModernHeavyBall(input, catchRate);
    catchRate = Math.max(1, catchRate);
  }
  const bonus = ballBonusModern(input);
  if (bonus === -1) return 1;
  const status =
    input.status === "sleep" || input.status === "freeze"
      ? 2.5
      : input.status === "none"
        ? 1
        : 1.5;
  const grass = input.darkGrass ? DEX_GRASS[dexCategory(input.dexCaught ?? 0)] : 1;
  const lowLevel = (input.level ?? 20) < 13 ? 36 - 2 * (input.level ?? 20) : 10;
  let badgePenalty = 1;
  const badges = clampInt(input.badges ?? 8, 0, 8);
  if (badges < 8) {
    for (let missing = 0; GEN9_BADGE_LEVELS[badges + missing]! < (input.level ?? 20); missing += 1) {
      badgePenalty = fround32(badgePenalty * 0.8);
    }
    badgePenalty = round4096(badgePenalty);
  }
  const difficulty = CAPTURE_POWER[input.capturePower ?? 0] * (input.offGuard ? 2 : 1);
  const x = Math.min(
    255,
    round4096(
      round4096(
        down4096(
          down4096(
            (round4096(round4096(round4096((3 * maxHp - 2 * hp) * grass) * catchRate * bonus) * badgePenalty) /
              (3 * maxHp)) *
              (lowLevel / 10)
          )
        ) * status
      ) * difficulty
    )
  );
  if (x >= 255) return 1;
  const shakeChance = shakeChanceModern(x, true);
  const charm = input.catchingCharm ? 2 : 1;
  const criticalCount = Math.floor(round4096((Math.min(x, 255) * DEX_CRIT[dexCategory(input.dexCaught ?? 0)] * charm) / 6));
  return withCritical(shakeChance ** 4, Math.min(1, criticalCount / 256), shakeChance);
}

export function ballsForGeneration(generation: number, versionGroup?: string): CatchBallId[] {
  const balls: CatchBallId[] = ["poke", "great", "ultra", "master"];
  if (generation === 1) return [...balls, "safari"];
  if (generation === 2) {
    return [...balls, "fast", "heavy", "level", "love", "lure", "moon", "friend", "sport"];
  }
  balls.push("net", "nest", "dive", "repeat", "timer");
  if (generation === 3) return [...balls, "safari"];
  balls.push("dusk", "quick");
  if (generation === 4) {
    if (versionGroup === "heartgold-soulsilver") {
      balls.push("fast", "heavy", "level", "love", "lure", "moon");
    }
    return balls;
  }
  if (generation === 5) return [...balls, "dream"];
  balls.push("fast", "heavy", "level", "love", "lure", "moon");
  if (generation >= 7) balls.push("beast");
  if (generation >= 8) balls.push("dream");
  if (versionGroup === "brilliant-diamond-and-shining-pearl") balls.push("safari");
  return balls;
}

export function catchProbability(input: CatchInput): number {
  if (input.catchRate <= 0 && input.ball !== "master" && input.ball !== "heavy") return 0;
  const level = clampInt(input.level ?? 20, 1, 100);
  const maxHp = typicalMaxHp(input.baseHp, level, input.generation);
  const hp = currentHp(maxHp, input.hpPercent, input.exactlyOneHp);
  const resolved = { ...input, level };

  if (input.generation <= 1) return Math.min(1, Math.max(0, catchProbabilityGen1(resolved, maxHp, hp)));
  if (input.generation === 2) return Math.min(1, Math.max(0, catchProbabilityGen2(resolved, maxHp, hp)));
  if (input.generation <= 4) return Math.min(1, Math.max(0, catchProbabilityGen34(resolved, maxHp, hp)));
  if (input.generation === 5) return Math.min(1, Math.max(0, catchProbabilityGen5(resolved, maxHp, hp)));
  if (input.generation <= 7) return Math.min(1, Math.max(0, catchProbabilityGen67(resolved, maxHp, hp)));
  if (input.generation === 8) return Math.min(1, Math.max(0, catchProbabilityGen8(resolved, maxHp, hp)));
  return Math.min(1, Math.max(0, catchProbabilityGen9(resolved, maxHp, hp)));
}

export function formatCatchChance(probability: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: probability >= 0.1 ? 1 : 2,
  }).format(probability);
}
