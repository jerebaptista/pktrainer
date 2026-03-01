const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const FR_LG_VERSION_GROUP = "firered-leafgreen";

/** FireRed/LeafGreen move tutor locations (API move name → location). */
const TUTOR_LOCATIONS: Record<string, string> = {
  "mega-kick": "Route 4",
  "mega-punch": "Route 4",
  "seismic-toss": "Pewter City",
  "rock-slide": "Rock Tunnel",
  "soft-boiled": "Celadon City",
  counter: "Celadon City",
  mimic: "Saffron City",
  "thunder-wave": "Silph Co.",
  substitute: "Fuchsia City",
  "dream-eater": "Viridian City",
  metronome: "Cinnabar Island",
  "double-edge": "Victory Road",
  explosion: "Mt. Ember",
  "frenzy-plant": "Cape Brink",
  "blast-burn": "Cape Brink",
  "hydro-cannon": "Cape Brink",
  "body-slam": "Four Island",
  "swords-dance": "Seven Island",
};

type RawMove = {
  move: { name: string; url: string };
  version_group_details: Array<{
    move_learn_method: { name: string };
    version_group: { name: string };
    level_learned_at: number;
  }>;
};

export type MoveTableRow = {
  moveName: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  /** Level (level-up only). */
  level?: number;
  /** TM/HM id e.g. "TM24", "HM01" (tm-hm only). */
  id?: string;
  /** Tutor location if we have it (tutor only). */
  location?: string;
  /** Short effect text (en) for hover card. */
  effect?: string;
  /** Flavor text (en, FR/LG) for hover card. */
  flavor?: string;
};

type MoveFromAPI = {
  name: string;
  type?: { name: string };
  damage_class?: { name: string };
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effect_chance?: number | null;
  machines?: Array<{
    machine: { url: string };
    version_group: { name: string };
  }>;
  effect_entries?: Array<{
    effect?: string;
    short_effect?: string;
    language?: { name: string };
  }>;
  flavor_text_entries?: Array<{
    flavor_text?: string;
    language?: { name: string };
    version_group?: { name: string };
  }>;
};

type MachineFromAPI = {
  item?: { name: string };
};

function apiMethodToTabId(methodName: string): string {
  switch (methodName) {
    case "level-up":
      return "level-up";
    case "machine":
      return "tm-hm";
    case "egg":
      return "breeding";
    case "tutor":
      return "tutor";
    default:
      return "special";
  }
}

/** Parse raw Pokémon moves into lists by learn method (FR/LG only). */
export function parseMovesByMethod(moves: RawMove[] | undefined): {
  "level-up": Array<{ level: number; moveName: string }>;
  "tm-hm": Array<{ moveName: string }>;
  breeding: Array<{ moveName: string }>;
  tutor: Array<{ moveName: string }>;
  special: Array<{ moveName: string }>;
} {
  const result: ReturnType<typeof parseMovesByMethod> = {
    "level-up": [],
    "tm-hm": [],
    breeding: [],
    tutor: [],
    special: [],
  };
  const seen = new Set<string>();
  for (const entry of moves ?? []) {
    const moveName = entry.move.name;
    for (const vg of entry.version_group_details ?? []) {
      if (vg.version_group?.name !== FR_LG_VERSION_GROUP) continue;
      const method = vg.move_learn_method?.name ?? "";
      const tabId = apiMethodToTabId(method) as keyof typeof result;
      const key = `${tabId}:${moveName}${tabId === "level-up" ? `:${vg.level_learned_at}` : ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (tabId === "level-up") {
        result["level-up"].push({ level: vg.level_learned_at ?? 0, moveName });
      } else {
        (result[tabId] as Array<{ moveName: string }>).push({ moveName });
      }
    }
  }
  result["level-up"].sort((a, b) => a.level - b.level || a.moveName.localeCompare(b.moveName));
  result["tm-hm"].sort((a, b) => a.moveName.localeCompare(b.moveName));
  result.breeding.sort((a, b) => a.moveName.localeCompare(b.moveName));
  result.tutor.sort((a, b) => a.moveName.localeCompare(b.moveName));
  result.special.sort((a, b) => a.moveName.localeCompare(b.moveName));
  return result;
}

async function fetchMove(name: string): Promise<MoveFromAPI | null> {
  try {
    const res = await fetch(`${POKEAPI_BASE}/move/${encodeURIComponent(name)}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as MoveFromAPI;
  } catch {
    return null;
  }
}

async function fetchMachineItemName(machineUrl: string): Promise<string | null> {
  try {
    const res = await fetch(machineUrl, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = (await res.json()) as MachineFromAPI;
    const name = data.item?.name;
    if (!name) return null;
    return name.toUpperCase().replace(/-/g, "");
  } catch {
    return null;
  }
}

function formatTmHmId(itemName: string): string {
  return itemName.toUpperCase().replace(/-/g, "");
}

/** Get TM/HM id for a move in FR/LG (e.g. "TM24", "HM01"). */
async function getMachineIdForMove(move: MoveFromAPI): Promise<string | null> {
  const entry = move.machines?.find((m) => m.version_group?.name === FR_LG_VERSION_GROUP);
  if (!entry?.machine?.url) return null;
  const itemName = await fetchMachineItemName(entry.machine.url);
  return itemName ? formatTmHmId(itemName) : null;
}
function categoryLabel(name: string): string {
  if (name === "physical") return "Physical";
  if (name === "special") return "Special";
  if (name === "status") return "Status";
  return name;
}

export type MovesTableData = {
  "level-up": MoveTableRow[];
  "tm-hm": MoveTableRow[];
  breeding: MoveTableRow[];
  tutor: MoveTableRow[];
  special: MoveTableRow[];
};

/** Fetch move details and build full table data. Caches by move name. */
export async function fetchMovesTableData(moves: RawMove[] | undefined): Promise<MovesTableData> {
  const byMethod = parseMovesByMethod(moves);
  const moveDetailsCache = new Map<string, MoveFromAPI | null>();

  async function getMoveDetails(moveName: string): Promise<MoveFromAPI | null> {
    let cached = moveDetailsCache.get(moveName);
    if (cached === undefined) {
      cached = await fetchMove(moveName);
      moveDetailsCache.set(moveName, cached);
    }
    return cached;
  }

  async function toRow(
    item: { moveName: string; level?: number },
    method: keyof MovesTableData
  ): Promise<MoveTableRow> {
    const move = await getMoveDetails(item.moveName);
    const type = move?.type?.name ?? "—";
    const category = move?.damage_class?.name ? categoryLabel(move.damage_class.name) : "—";
    const power = move?.power ?? null;
    const accuracy = move?.accuracy ?? null;
    const pp = move?.pp ?? null;
    const row: MoveTableRow = {
      moveName: item.moveName.replace(/-/g, " "),
      type,
      category,
      power,
      accuracy,
      pp,
    };
    if (method === "level-up" && "level" in item) row.level = item.level;
    if (method === "tm-hm" && move) {
      const id = await getMachineIdForMove(move);
      if (id) row.id = id;
    }
    if (method === "tutor") {
      const loc = TUTOR_LOCATIONS[item.moveName];
      if (loc) row.location = loc;
    }
    const enEffect = move?.effect_entries?.find((e) => e.language?.name === "en");
    if (enEffect?.short_effect) {
      const chance = move?.effect_chance ?? 0;
      row.effect = enEffect.short_effect.replace(/\$effect_chance/g, String(chance));
    }
    const enFlavor = move?.flavor_text_entries?.find(
      (e) => e.language?.name === "en" && e.version_group?.name === FR_LG_VERSION_GROUP
    );
    if (enFlavor?.flavor_text) row.flavor = enFlavor.flavor_text.replace(/\n/g, " ").trim();
    return row;
  }

  const [levelUp, tmHm, breeding, tutor, special] = await Promise.all([
    Promise.all(byMethod["level-up"].map((x) => toRow(x, "level-up"))),
    Promise.all(byMethod["tm-hm"].map((x) => toRow(x, "tm-hm"))),
    Promise.all(byMethod.breeding.map((x) => toRow(x, "breeding"))),
    Promise.all(byMethod.tutor.map((x) => toRow(x, "tutor"))),
    Promise.all(byMethod.special.map((x) => toRow(x, "special"))),
  ]);

  tmHm.sort((a, b) => {
    const idA = a.id ?? "";
    const idB = b.id ?? "";
    const hmA = idA.startsWith("HM");
    const hmB = idB.startsWith("HM");
    if (hmA !== hmB) return hmA ? -1 : 1;
    return idA.localeCompare(idB, undefined, { numeric: true });
  });

  return { "level-up": levelUp, "tm-hm": tmHm, breeding, tutor, special };
}

/** Single row for global Moves page: one move with all availability methods. */
export type GlobalMoveRow = {
  moveName: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  maxPP: number | null;
  /** e.g. ["Level Up", "TM", "Breeding"] for filtering and display. */
  availability: string[];
  effect?: string;
  flavor?: string;
};

const AVAILABILITY_LABELS: Record<string, string> = {
  "level-up": "Level Up",
  "tm-hm": "TM",
  "tm": "TM",
  "hm": "HM",
  breeding: "Breeding",
  tutor: "Tutor",
  special: "Special",
};

/** Gen 3: base PP + 4 PP Ups (each +20%), cap 64. */
function calcMaxPP(pp: number | null): number | null {
  if (pp == null || pp <= 0) return null;
  return Math.min(64, pp + Math.floor(pp * 0.2) * 4);
}

/** Merge MovesTableData into one list: one row per move with availability array. */
export function mergeMovesTableDataToGlobal(data: MovesTableData): GlobalMoveRow[] {
  const byMove = new Map<string, GlobalMoveRow>();

  function addRow(row: MoveTableRow, method: keyof MovesTableData) {
    const key = row.moveName;
    const availabilityPart =
      method === "tm-hm" && row.id
        ? row.id.startsWith("HM")
          ? "HM"
          : "TM"
        : AVAILABILITY_LABELS[method] ?? method;
    if (!byMove.has(key)) {
      byMove.set(key, {
        moveName: row.moveName,
        type: row.type,
        category: row.category,
        power: row.power,
        accuracy: row.accuracy,
        pp: row.pp,
        maxPP: calcMaxPP(row.pp),
        availability: [],
        effect: row.effect,
        flavor: row.flavor,
      });
    }
    const r = byMove.get(key)!;
    if (availabilityPart && !r.availability.includes(availabilityPart)) {
      r.availability.push(availabilityPart);
    }
  }

  data["level-up"].forEach((r) => addRow(r, "level-up"));
  data["tm-hm"].forEach((r) => addRow(r, "tm-hm"));
  data.breeding.forEach((r) => addRow(r, "breeding"));
  data.tutor.forEach((r) => addRow(r, "tutor"));
  data.special.forEach((r) => addRow(r, "special"));

  const availabilityOrder = ["Level Up", "TM", "HM", "Breeding", "Tutor", "Special"];
  for (const r of byMove.values()) {
    r.availability.sort(
      (a, b) =>
        availabilityOrder.indexOf(a) - availabilityOrder.indexOf(b) || a.localeCompare(b)
    );
  }
  const out = Array.from(byMove.values());
  out.sort((a, b) => a.moveName.localeCompare(b.moveName, undefined, { sensitivity: "base" }));
  return out;
}

const KANTO_DEX_LIMIT = 151;

type PokemonMovesFromAPI = { moves?: RawMove[] };

/** Fetch one Pokémon's moves (FR/LG relevant). */
async function fetchPokemonMoves(id: number): Promise<RawMove[]> {
  try {
    const res = await fetch(`${POKEAPI_BASE}/pokemon/${id}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as PokemonMovesFromAPI;
    return data.moves ?? [];
  } catch {
    return [];
  }
}

/** Aggregate moves from all Kanto Pokémon by learn method. Level-up keeps min level per move. */
function aggregateKantoMovesByMethod(movesPerPokemon: RawMove[][]): {
  "level-up": Array<{ moveName: string; level: number }>;
  "tm-hm": Array<{ moveName: string }>;
  breeding: Array<{ moveName: string }>;
  tutor: Array<{ moveName: string }>;
  special: Array<{ moveName: string }>;
} {
  const levelUpMin = new Map<string, number>();
  const tmHm = new Set<string>();
  const breeding = new Set<string>();
  const tutor = new Set<string>();
  const special = new Set<string>();

  for (const moves of movesPerPokemon) {
    const parsed = parseMovesByMethod(moves);
    for (const { moveName, level } of parsed["level-up"]) {
      const prev = levelUpMin.get(moveName);
      levelUpMin.set(moveName, prev === undefined ? level : Math.min(prev, level));
    }
    parsed["tm-hm"].forEach((x) => tmHm.add(x.moveName));
    parsed.breeding.forEach((x) => breeding.add(x.moveName));
    parsed.tutor.forEach((x) => tutor.add(x.moveName));
    parsed.special.forEach((x) => special.add(x.moveName));
  }

  const levelUpList = Array.from(levelUpMin.entries())
    .map(([moveName, level]) => ({ moveName, level }))
    .sort((a, b) => a.level - b.level || a.moveName.localeCompare(b.moveName));
  return {
    "level-up": levelUpList,
    "tm-hm": Array.from(tmHm).sort().map((moveName) => ({ moveName })),
    breeding: Array.from(breeding).sort().map((moveName) => ({ moveName })),
    tutor: Array.from(tutor).sort().map((moveName) => ({ moveName })),
    special: Array.from(special).sort().map((moveName) => ({ moveName })),
  };
}

/** Fetch all moves in the game (Kanto/FR-LG) by tab: Level Up, TM/HM, Breeding, Tutor, Special. */
export async function fetchAllGameMovesTableData(): Promise<MovesTableData> {
  const BATCH = 25;
  const ids = Array.from({ length: KANTO_DEX_LIMIT }, (_, i) => i + 1);
  const movesPerPokemon: RawMove[][] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const results = await Promise.all(chunk.map((id) => fetchPokemonMoves(id)));
    movesPerPokemon.push(...results);
  }
  const byMethod = aggregateKantoMovesByMethod(movesPerPokemon);
  return fetchMovesTableDataFromAggregate(byMethod);
}

/** Build MovesTableData from pre-aggregated lists (used by fetchAllGameMovesTableData). */
async function fetchMovesTableDataFromAggregate(byMethod: {
  "level-up": Array<{ moveName: string; level: number }>;
  "tm-hm": Array<{ moveName: string }>;
  breeding: Array<{ moveName: string }>;
  tutor: Array<{ moveName: string }>;
  special: Array<{ moveName: string }>;
}): Promise<MovesTableData> {
  const moveDetailsCache = new Map<string, MoveFromAPI | null>();

  async function getMoveDetails(moveName: string): Promise<MoveFromAPI | null> {
    let cached = moveDetailsCache.get(moveName);
    if (cached === undefined) {
      cached = await fetchMove(moveName);
      moveDetailsCache.set(moveName, cached);
    }
    return cached;
  }

  async function toRow(
    item: { moveName: string; level?: number },
    method: keyof MovesTableData
  ): Promise<MoveTableRow> {
    const move = await getMoveDetails(item.moveName);
    const type = move?.type?.name ?? "—";
    const category = move?.damage_class?.name ? categoryLabel(move.damage_class.name) : "—";
    const power = move?.power ?? null;
    const accuracy = move?.accuracy ?? null;
    const pp = move?.pp ?? null;
    const row: MoveTableRow = {
      moveName: item.moveName.replace(/-/g, " "),
      type,
      category,
      power,
      accuracy,
      pp,
    };
    if (method === "level-up" && "level" in item) row.level = item.level;
    if (method === "tm-hm" && move) {
      const id = await getMachineIdForMove(move);
      if (id) row.id = id;
    }
    if (method === "tutor") {
      const loc = TUTOR_LOCATIONS[item.moveName];
      if (loc) row.location = loc;
    }
    const enEffect = move?.effect_entries?.find((e) => e.language?.name === "en");
    if (enEffect?.short_effect) {
      const chance = move?.effect_chance ?? 0;
      row.effect = enEffect.short_effect.replace(/\$effect_chance/g, String(chance));
    }
    const enFlavor = move?.flavor_text_entries?.find(
      (e) => e.language?.name === "en" && e.version_group?.name === FR_LG_VERSION_GROUP
    );
    if (enFlavor?.flavor_text) row.flavor = enFlavor.flavor_text.replace(/\n/g, " ").trim();
    return row;
  }

  const [levelUp, tmHm, breeding, tutor, special] = await Promise.all([
    Promise.all(byMethod["level-up"].map((x) => toRow(x, "level-up"))),
    Promise.all(byMethod["tm-hm"].map((x) => toRow(x, "tm-hm"))),
    Promise.all(byMethod.breeding.map((x) => toRow(x, "breeding"))),
    Promise.all(byMethod.tutor.map((x) => toRow(x, "tutor"))),
    Promise.all(byMethod.special.map((x) => toRow(x, "special"))),
  ]);

  tmHm.sort((a, b) => {
    const idA = a.id ?? "";
    const idB = b.id ?? "";
    const hmA = idA.startsWith("HM");
    const hmB = idB.startsWith("HM");
    if (hmA !== hmB) return hmA ? -1 : 1;
    return idA.localeCompare(idB, undefined, { numeric: true });
  });

  return { "level-up": levelUp, "tm-hm": tmHm, breeding, tutor, special };
}
