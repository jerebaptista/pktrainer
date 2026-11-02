export const GAME_COOKIE = "pk-trainer-game";
export const GAME_THEME_COOKIE = "pk-trainer-game-theme";
export const DEFAULT_GAME_ID = "firered";

export type GameThemeId =
  | "red"
  | "blue"
  | "yellow"
  | "amber"
  | "neutral"
  | "cyan"
  | "emerald"
  | "green"
  | "violet"
  | "fuchsia"
  | "orange"
  | "purple"
  | "teal"
  | "brown";

export const GAME_THEMES: Record<GameThemeId, { swatch: string }> = {
  red: { swatch: "oklch(0.63 0.22 25)" },
  blue: { swatch: "oklch(0.55 0.2 250)" },
  yellow: { swatch: "oklch(0.84 0.16 95)" },
  amber: { swatch: "oklch(0.75 0.16 75)" },
  neutral: { swatch: "oklch(0.45 0.01 0)" },
  cyan: { swatch: "oklch(0.65 0.12 200)" },
  emerald: { swatch: "oklch(0.6 0.15 160)" },
  green: { swatch: "oklch(0.55 0.16 145)" },
  violet: { swatch: "oklch(0.55 0.22 290)" },
  fuchsia: { swatch: "oklch(0.62 0.22 330)" },
  orange: { swatch: "oklch(0.68 0.18 55)" },
  purple: { swatch: "oklch(0.5 0.2 300)" },
  teal: { swatch: "oklch(0.58 0.1 180)" },
  brown: { swatch: "oklch(0.66 0.08 62)" },
};

export type GameDef = {
  id: string;
  generation: number;
  versionGroup: string;
  pokedex: string;
  spriteGen: string;
  spriteVersion: string;
  mascotId: number;
  theme: GameThemeId;
  generationLabel: string;
};

export const GAMES: GameDef[] = [
  { id: "red", generation: 1, versionGroup: "red-blue", pokedex: "kanto", spriteGen: "generation-i", spriteVersion: "red-blue", mascotId: 6, theme: "red", generationLabel: "I" },
  { id: "blue", generation: 1, versionGroup: "red-blue", pokedex: "kanto", spriteGen: "generation-i", spriteVersion: "red-blue", mascotId: 9, theme: "blue", generationLabel: "I" },
  { id: "yellow", generation: 1, versionGroup: "yellow", pokedex: "kanto", spriteGen: "generation-i", spriteVersion: "yellow", mascotId: 25, theme: "yellow", generationLabel: "I" },
  { id: "gold", generation: 2, versionGroup: "gold-silver", pokedex: "original-johto", spriteGen: "generation-ii", spriteVersion: "gold", mascotId: 250, theme: "amber", generationLabel: "II" },
  { id: "silver", generation: 2, versionGroup: "gold-silver", pokedex: "original-johto", spriteGen: "generation-ii", spriteVersion: "silver", mascotId: 249, theme: "neutral", generationLabel: "II" },
  { id: "crystal", generation: 2, versionGroup: "crystal", pokedex: "original-johto", spriteGen: "generation-ii", spriteVersion: "crystal", mascotId: 245, theme: "cyan", generationLabel: "II" },
  { id: "ruby", generation: 3, versionGroup: "ruby-sapphire", pokedex: "hoenn", spriteGen: "generation-iii", spriteVersion: "ruby-sapphire", mascotId: 383, theme: "red", generationLabel: "III" },
  { id: "sapphire", generation: 3, versionGroup: "ruby-sapphire", pokedex: "hoenn", spriteGen: "generation-iii", spriteVersion: "ruby-sapphire", mascotId: 382, theme: "blue", generationLabel: "III" },
  { id: "emerald", generation: 3, versionGroup: "emerald", pokedex: "hoenn", spriteGen: "generation-iii", spriteVersion: "emerald", mascotId: 384, theme: "emerald", generationLabel: "III" },
  { id: "firered", generation: 3, versionGroup: "firered-leafgreen", pokedex: "kanto", spriteGen: "generation-iii", spriteVersion: "firered-leafgreen", mascotId: 6, theme: "red", generationLabel: "III" },
  { id: "leafgreen", generation: 3, versionGroup: "firered-leafgreen", pokedex: "kanto", spriteGen: "generation-iii", spriteVersion: "firered-leafgreen", mascotId: 3, theme: "green", generationLabel: "III" },
  { id: "diamond", generation: 4, versionGroup: "diamond-pearl", pokedex: "original-sinnoh", spriteGen: "generation-iv", spriteVersion: "diamond-pearl", mascotId: 483, theme: "cyan", generationLabel: "IV" },
  { id: "pearl", generation: 4, versionGroup: "diamond-pearl", pokedex: "original-sinnoh", spriteGen: "generation-iv", spriteVersion: "diamond-pearl", mascotId: 484, theme: "fuchsia", generationLabel: "IV" },
  { id: "platinum", generation: 4, versionGroup: "platinum", pokedex: "extended-sinnoh", spriteGen: "generation-iv", spriteVersion: "platinum", mascotId: 10007, theme: "neutral", generationLabel: "IV" },
  { id: "heartgold", generation: 4, versionGroup: "heartgold-soulsilver", pokedex: "updated-johto", spriteGen: "generation-iv", spriteVersion: "heartgold-soulsilver", mascotId: 250, theme: "amber", generationLabel: "IV" },
  { id: "soulsilver", generation: 4, versionGroup: "heartgold-soulsilver", pokedex: "updated-johto", spriteGen: "generation-iv", spriteVersion: "heartgold-soulsilver", mascotId: 249, theme: "neutral", generationLabel: "IV" },
  { id: "black", generation: 5, versionGroup: "black-white", pokedex: "original-unova", spriteGen: "generation-v", spriteVersion: "black-white", mascotId: 643, theme: "neutral", generationLabel: "V" },
  { id: "white", generation: 5, versionGroup: "black-white", pokedex: "original-unova", spriteGen: "generation-v", spriteVersion: "black-white", mascotId: 644, theme: "neutral", generationLabel: "V" },
  { id: "black-2", generation: 5, versionGroup: "black-2-white-2", pokedex: "updated-unova", spriteGen: "generation-v", spriteVersion: "black-2-white-2", mascotId: 10022, theme: "neutral", generationLabel: "V" },
  { id: "white-2", generation: 5, versionGroup: "black-2-white-2", pokedex: "updated-unova", spriteGen: "generation-v", spriteVersion: "black-2-white-2", mascotId: 10023, theme: "neutral", generationLabel: "V" },
  { id: "x", generation: 6, versionGroup: "x-y", pokedex: "kalos-central", spriteGen: "generation-vi", spriteVersion: "x-y", mascotId: 716, theme: "blue", generationLabel: "VI" },
  { id: "y", generation: 6, versionGroup: "x-y", pokedex: "kalos-central", spriteGen: "generation-vi", spriteVersion: "x-y", mascotId: 717, theme: "red", generationLabel: "VI" },
  { id: "omega-ruby", generation: 6, versionGroup: "omega-ruby-alpha-sapphire", pokedex: "updated-hoenn", spriteGen: "generation-vi", spriteVersion: "omega-ruby-alpha-sapphire", mascotId: 10058, theme: "red", generationLabel: "VI" },
  { id: "alpha-sapphire", generation: 6, versionGroup: "omega-ruby-alpha-sapphire", pokedex: "updated-hoenn", spriteGen: "generation-vi", spriteVersion: "omega-ruby-alpha-sapphire", mascotId: 10057, theme: "blue", generationLabel: "VI" },
  { id: "sun", generation: 7, versionGroup: "sun-moon", pokedex: "original-alola", spriteGen: "generation-vii", spriteVersion: "ultra-sun-ultra-moon", mascotId: 791, theme: "orange", generationLabel: "VII" },
  { id: "moon", generation: 7, versionGroup: "sun-moon", pokedex: "original-alola", spriteGen: "generation-vii", spriteVersion: "ultra-sun-ultra-moon", mascotId: 792, theme: "purple", generationLabel: "VII" },
  { id: "ultra-sun", generation: 7, versionGroup: "ultra-sun-ultra-moon", pokedex: "updated-alola", spriteGen: "generation-vii", spriteVersion: "ultra-sun-ultra-moon", mascotId: 10155, theme: "orange", generationLabel: "VII" },
  { id: "ultra-moon", generation: 7, versionGroup: "ultra-sun-ultra-moon", pokedex: "updated-alola", spriteGen: "generation-vii", spriteVersion: "ultra-sun-ultra-moon", mascotId: 10156, theme: "purple", generationLabel: "VII" },
  { id: "lets-go-pikachu", generation: 7, versionGroup: "lets-go-pikachu-lets-go-eevee", pokedex: "letsgo-kanto", spriteGen: "generation-vii", spriteVersion: "ultra-sun-ultra-moon", mascotId: 25, theme: "yellow", generationLabel: "VII" },
  { id: "lets-go-eevee", generation: 7, versionGroup: "lets-go-pikachu-lets-go-eevee", pokedex: "letsgo-kanto", spriteGen: "generation-vii", spriteVersion: "ultra-sun-ultra-moon", mascotId: 133, theme: "brown", generationLabel: "VII" },
  { id: "sword", generation: 8, versionGroup: "sword-shield", pokedex: "galar", spriteGen: "generation-viii", spriteVersion: "icons", mascotId: 888, theme: "blue", generationLabel: "VIII" },
  { id: "shield", generation: 8, versionGroup: "sword-shield", pokedex: "galar", spriteGen: "generation-viii", spriteVersion: "icons", mascotId: 889, theme: "red", generationLabel: "VIII" },
  { id: "the-isle-of-armor", generation: 8, versionGroup: "sword-shield", pokedex: "isle-of-armor", spriteGen: "generation-viii", spriteVersion: "icons", mascotId: 891, theme: "orange", generationLabel: "VIII" },
  { id: "the-crown-tundra", generation: 8, versionGroup: "sword-shield", pokedex: "crown-tundra", spriteGen: "generation-viii", spriteVersion: "icons", mascotId: 898, theme: "teal", generationLabel: "VIII" },
  { id: "brilliant-diamond", generation: 8, versionGroup: "brilliant-diamond-and-shining-pearl", pokedex: "extended-sinnoh", spriteGen: "generation-viii", spriteVersion: "brilliant-diamond-shining-pearl", mascotId: 483, theme: "cyan", generationLabel: "VIII" },
  { id: "shining-pearl", generation: 8, versionGroup: "brilliant-diamond-and-shining-pearl", pokedex: "extended-sinnoh", spriteGen: "generation-viii", spriteVersion: "brilliant-diamond-shining-pearl", mascotId: 484, theme: "fuchsia", generationLabel: "VIII" },
  { id: "legends-arceus", generation: 8, versionGroup: "legends-arceus", pokedex: "hisui", spriteGen: "generation-viii", spriteVersion: "legends-arceus", mascotId: 493, theme: "neutral", generationLabel: "VIII" },
  { id: "scarlet", generation: 9, versionGroup: "scarlet-violet", pokedex: "paldea", spriteGen: "generation-viii", spriteVersion: "icons", mascotId: 1007, theme: "red", generationLabel: "IX" },
  { id: "violet", generation: 9, versionGroup: "scarlet-violet", pokedex: "paldea", spriteGen: "generation-viii", spriteVersion: "icons", mascotId: 1008, theme: "purple", generationLabel: "IX" },
  { id: "the-teal-mask", generation: 9, versionGroup: "scarlet-violet", pokedex: "kitakami", spriteGen: "generation-viii", spriteVersion: "icons", mascotId: 1017, theme: "green", generationLabel: "IX" },
  { id: "the-indigo-disk", generation: 9, versionGroup: "scarlet-violet", pokedex: "blueberry", spriteGen: "generation-viii", spriteVersion: "icons", mascotId: 1024, theme: "cyan", generationLabel: "IX" },
];

export const GAME_BY_ID = Object.fromEntries(GAMES.map((game) => [game.id, game])) as Record<string, GameDef>;

export const VERSION_GROUP_ORDER = [
  "red-blue",
  "yellow",
  "gold-silver",
  "crystal",
  "ruby-sapphire",
  "emerald",
  "firered-leafgreen",
  "colosseum",
  "xd",
  "diamond-pearl",
  "platinum",
  "heartgold-soulsilver",
  "black-white",
  "black-2-white-2",
  "x-y",
  "omega-ruby-alpha-sapphire",
  "sun-moon",
  "ultra-sun-ultra-moon",
  "lets-go-pikachu-lets-go-eevee",
  "sword-shield",
  "brilliant-diamond-and-shining-pearl",
  "legends-arceus",
  "scarlet-violet",
] as const;

export function versionGroupOrder(name?: string | null): number {
  if (!name) return -1;
  return VERSION_GROUP_ORDER.indexOf(name as (typeof VERSION_GROUP_ORDER)[number]);
}

export function getGame(id: string | null | undefined): GameDef {
  if (id && GAME_BY_ID[id]) return GAME_BY_ID[id]!;
  return GAME_BY_ID[DEFAULT_GAME_ID]!;
}

export type GameMechanics = {
  shiny: boolean;
  gender: boolean;
  genderSprites: boolean;
  abilities: boolean;
  hiddenAbility: boolean;
  eggs: boolean;
  friendship: boolean;
  baby: boolean;
  specialSplit: boolean;
};

export function getGameMechanics(generation: number): GameMechanics {
  return {
    shiny: generation >= 2,
    gender: generation >= 2,
    genderSprites: generation >= 4,
    abilities: generation >= 3,
    hiddenAbility: generation >= 5,
    eggs: generation >= 2,
    friendship: generation >= 2,
    baby: generation >= 2,
    specialSplit: generation >= 2,
  };
}

const SPRITE_CDN = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

const GAME_COVERS: Partial<Record<string, string>> = {
  red: "/covers/250px-Red_EN_boxart.png",
  blue: "/covers/250px-Blue_EN_boxart.png",
  yellow: "/covers/250px-Yellow_EN_boxart.png",
  gold: "/covers/250px-Gold_EN_boxart.png",
  silver: "/covers/250px-Silver_EN_boxart.png",
  crystal: "/covers/250px-Crystal_EN_boxart.png",
  ruby: "/covers/250px-Ruby_EN_boxart.png",
  sapphire: "/covers/250px-Sapphire_EN_boxart.png",
  emerald: "/covers/250px-Emerald_EN_boxart.jpg",
  firered: "/covers/firered-cover.png",
  leafgreen: "/covers/leafgreen-cover.png",
  diamond: "/covers/250px-Diamond_EN_boxart.jpg",
  pearl: "/covers/250px-Pearl_EN_boxart.jpg",
  platinum: "/covers/250px-Platinum_EN_boxart.png",
  heartgold: "/covers/250px-HeartGold_EN_boxart.jpg",
  soulsilver: "/covers/250px-SoulSilver_EN_boxart.jpg",
  black: "/covers/250px-Black_EN_boxart.png",
  white: "/covers/250px-White_EN_boxart.png",
  "black-2": "/covers/250px-Black_2_EN_boxart.png",
  "white-2": "/covers/250px-White_2_EN_boxart.png",
  x: "/covers/250px-X_EN_boxart.png",
  y: "/covers/250px-Y_EN_boxart.png",
  "omega-ruby": "/covers/250px-Omega_Ruby_EN_boxart.png",
  "alpha-sapphire": "/covers/250px-Alpha_Sapphire_EN_boxart.png",
  sun: "/covers/250px-Sun_EN_boxart.png",
  moon: "/covers/250px-Moon_EN_boxart.png",
  "ultra-sun": "/covers/250px-Ultra_Sun_EN_boxart.png",
  "ultra-moon": "/covers/250px-Ultra_Moon_EN_boxart.png",
  "lets-go-pikachu": "/covers/250px-Lets_Go_Pikachu_EN_boxart.png",
  "lets-go-eevee": "/covers/250px-Lets_Go_Eevee_EN_boxart.png",
  sword: "/covers/250px-Sword_EN_boxart.png",
  shield: "/covers/250px-Shield_EN_boxart.png",
  "the-isle-of-armor": "/covers/250px-Sword_EN_boxart.png",
  "the-crown-tundra": "/covers/250px-Shield_EN_boxart.png",
  "brilliant-diamond": "/covers/250px-Brilliant_Diamond_EN_boxart.png",
  "shining-pearl": "/covers/250px-Shining_Pearl_EN_boxart.png",
  "legends-arceus": "/covers/250px-Legends_Arceus_EN_boxart.png",
  scarlet: "/covers/250px-Scarlet_EN_boxart.png",
  violet: "/covers/250px-Violet_EN_boxart.png",
  "the-teal-mask": "/covers/250px-Scarlet_EN_boxart.png",
  "the-indigo-disk": "/covers/250px-Violet_EN_boxart.png",
};

export function gameCoverUrl(game: GameDef): string | undefined {
  return GAME_COVERS[game.id];
}

export function gameSpriteUrl(game: GameDef, id: number, options?: { back?: boolean; shiny?: boolean }): string {
  const folder = [options?.back ? "back" : null, options?.shiny ? "shiny" : null].filter(Boolean).join("/");
  const suffix = folder ? `${folder}/` : "";
  return `${SPRITE_CDN}/versions/${game.spriteGen}/${game.spriteVersion}/${suffix}${id}.png`;
}

export function gameAvatarUrl(game: GameDef): string {
  return gameCoverUrl(game) ?? gameMascotUrl(game);
}

export function gameMascotUrl(game: GameDef): string {
  const id = game.mascotId;
  if (game.id === "black-2" || game.id === "white-2") {
    return `${SPRITE_CDN}/versions/generation-v/black-white/${id}.png`;
  }
  if (game.generation <= 2) {
    return `${SPRITE_CDN}/versions/${game.spriteGen}/${game.spriteVersion}/transparent/${id}.png`;
  }
  if (game.generation <= 6) {
    return gameSpriteUrl(game, id);
  }
  if (game.generation === 7) {
    return `${SPRITE_CDN}/versions/generation-vii/icons/${id}.png`;
  }
  if (game.id === "brilliant-diamond" || game.id === "shining-pearl") {
    return `${SPRITE_CDN}/versions/generation-viii/brilliant-diamond-shining-pearl/${id}.webp`;
  }
  if (game.id === "legends-arceus") {
    return `${SPRITE_CDN}/versions/generation-viii/legends-arceus/${id}.webp`;
  }
  if (game.generation === 8) {
    return `${SPRITE_CDN}/versions/generation-viii/sword-shield/${id}.webp`;
  }
  return `${SPRITE_CDN}/versions/generation-ix/scarlet-violet/${id}.webp`;
}

export function modernSpriteUrl(id: number, options?: { back?: boolean; shiny?: boolean }): string {
  if (options?.back && options?.shiny) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/${id}.png`;
  if (options?.back) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`;
  if (options?.shiny) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}
