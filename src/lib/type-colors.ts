/** Tailwind background + text classes for each Pokémon type, palette 200/300 (use ! to override Badge variant). */
export const typeBadgeClasses: Record<string, string> = {
  normal: "!bg-slate-200 !text-slate-800 border-transparent dark:!bg-slate-300 dark:!text-slate-900",
  fire: "!bg-red-200 !text-red-900 border-transparent dark:!bg-red-300 dark:!text-red-950",
  water: "!bg-blue-200 !text-blue-900 border-transparent dark:!bg-blue-300 dark:!text-blue-950",
  grass: "!bg-green-200 !text-green-900 border-transparent dark:!bg-green-300 dark:!text-green-950",
  electric: "!bg-yellow-200 !text-yellow-900 border-transparent dark:!bg-yellow-300 dark:!text-yellow-950",
  ice: "!bg-cyan-200 !text-cyan-900 border-transparent dark:!bg-cyan-300 dark:!text-cyan-950",
  fighting: "!bg-orange-200 !text-orange-900 border-transparent dark:!bg-orange-300 dark:!text-orange-950",
  poison: "!bg-violet-200 !text-violet-900 border-transparent dark:!bg-violet-300 dark:!text-violet-950",
  ground: "!bg-amber-200 !text-amber-900 border-transparent dark:!bg-amber-300 dark:!text-amber-950",
  flying: "!bg-sky-200 !text-sky-900 border-transparent dark:!bg-sky-300 dark:!text-sky-950",
  psychic: "!bg-pink-200 !text-pink-900 border-transparent dark:!bg-pink-300 dark:!text-pink-950",
  bug: "!bg-lime-200 !text-lime-900 border-transparent dark:!bg-lime-300 dark:!text-lime-950",
  rock: "!bg-stone-200 !text-stone-900 border-transparent dark:!bg-stone-300 dark:!text-stone-950",
  ghost: "!bg-purple-200 !text-purple-900 border-transparent dark:!bg-purple-300 dark:!text-purple-950",
  dragon: "!bg-indigo-200 !text-indigo-900 border-transparent dark:!bg-indigo-300 dark:!text-indigo-950",
  dark: "!bg-neutral-300 !text-neutral-900 border-transparent dark:!bg-neutral-400 dark:!text-neutral-950",
  steel: "!bg-zinc-200 !text-zinc-800 border-transparent dark:!bg-zinc-300 dark:!text-zinc-950",
  fairy: "!bg-fuchsia-200 !text-fuchsia-900 border-transparent dark:!bg-fuchsia-300 dark:!text-fuchsia-950",
};

/** Hex background color per type (Tailwind 400 shade) for charts. */
export const typeChartColors: Record<string, string> = {
  normal: "#94a3b8",
  fire: "#f87171",
  water: "#60a5fa",
  grass: "#4ade80",
  electric: "#facc15",
  ice: "#22d3ee",
  fighting: "#fb923c",
  poison: "#a78bfa",
  ground: "#fbbf24",
  flying: "#38bdf8",
  psychic: "#f472b6",
  bug: "#a3e635",
  rock: "#a8a29e",
  ghost: "#c084fc",
  dragon: "#818cf8",
  dark: "#a3a3a3",
  steel: "#a1a1aa",
  fairy: "#e879f9",
};

export function getTypeChartColor(type: string): string {
  const key = type.toLowerCase();
  return typeChartColors[key] ?? "#a1a1aa";
}

export function getTypeBadgeClassName(type: string): string {
  const key = type.toLowerCase();
  return typeBadgeClasses[key] ?? "!bg-muted !text-muted-foreground border-transparent";
}
