const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const FR_LG_VERSION_GROUP = "firered-leafgreen";
const LIST_PAGE_SIZE = 100;
const MAX_ITEMS_TO_CHECK = 2500;
const FETCH_CHUNK_SIZE = 25;

/** Normalize item name for whitelist match (Serebii slug vs PokeAPI name). */
function normalizeItemSlug(name: string): string {
  return name.toLowerCase().replace(/[-.\s]/g, "");
}

/**
 * Whitelist of items that appear in Pokémon FireRed & LeafGreen (Serebii item list).
 * https://www.serebii.net/fireredleafgreen/items.shtml
 * Slugs normalized (no hyphens, no dots) for matching PokeAPI item names.
 */
const FRLG_ITEM_SLUGS = new Set([
  "greatball",
  "masterball",
  "pokeball",
  "safariball",
  "ultraball",
  "deepseascale",
  "deepseatooth",
  "dragonscale",
  "firestone",
  "kingsrock",
  "leafstone",
  "metalcoat",
  "moonstone",
  "sunstone",
  "thunderstone",
  "upgrade",
  "waterstone",
  "auroraticket",
  "berrypouch",
  "bikevoucher",
  "cardkey",
  "coincase",
  "expshare",
  "famechecker",
  "goldteeth",
  "goodrod",
  "itemfinder",
  "liftkey",
  "meteorite",
  "mysticticket",
  "oaksparcel",
  "oldrod",
  "pokeflute",
  "powderjar",
  "rainbowpass",
  "ruby",
  "ssticket",
  "sapphire",
  "secretkey",
  "silphscope",
  "squirtbottle",
  "superrod",
  "tmcase",
  "tea",
  "teachytv",
  "townmap",
  "tripass",
  "vsseeker",
  "bigmushroom",
  "bigpearl",
  "blackflute",
  "blueflute",
  "blueshard",
  "escaperope",
  "fluffytail",
  "greenshard",
  "heartscale",
  "maxrepel",
  "nugget",
  "pearl",
  "pokedoll",
  "redflute",
  "redshard",
  "repel",
  "shoalsalt",
  "shoalshell",
  "starpiece",
  "stardust",
  "superrepel",
  "tinymushroom",
  "whiteflute",
  "yellowflute",
  "yellowshard",
  "antidote",
  "awakening",
  "berryjuice",
  "burnheal",
  "elixir",
  "energypowder",
  "energyroot",
  "ether",
  "freshwater",
  "fullheal",
  "fullrestore",
  "healpowder",
  "hyperpotion",
  "iceheal",
  "lavacookie",
  "lemonade",
  "maxelixir",
  "maxether",
  "maxpotion",
  "maxrevive",
  "moomoomilk",
  "paralyzeheal",
  "potion",
  "revivalherb",
  "revive",
  "sacredash",
  "sodapop",
  "superpotion",
  "direhit",
  "guardspec",
  "xaccuracy",
  "xattack",
  "xdefense",
  "xspatk",
  "xspeed",
  "domefossil",
  "helixfossil",
  "oldamber",
  "aguavberry",
  "apicotberry",
  "aspearberry",
  "belueberry",
  "blukberry",
  "cheriberry",
  "chestoberry",
  "cornnberry",
  "durinberry",
  "enigmaberry",
  "figyberry",
  "ganlonberry",
  "grepaberry",
  "hondewberry",
  "iapapaberry",
  "kelpsyberry",
  "lansatberry",
  "leppaberry",
  "liechiberry",
  "lumberry",
  "magoberry",
  "magostberry",
  "nanabberry",
  "nomelberry",
  "oranberry",
  "pamtreberry",
  "pechaberry",
  "persimberry",
  "petayaberry",
  "pinapberry",
  "pomegberry",
  "qualotberry",
  "rabutaberry",
  "rawstberry",
  "razzberry",
  "salacberry",
  "sitrusberry",
  "spelonberry",
  "starfberry",
  "tamatoberry",
  "watmelberry",
  "wepearberry",
  "wikiberry",
  "amuletcoin",
  "blackbelt",
  "blackglasses",
  "bluescarf",
  "brightpowder",
  "charcoal",
  "choiceband",
  "cleansetag",
  "dragonfang",
  "everstone",
  "focusband",
  "greenscarf",
  "hardstone",
  "laxincense",
  "leftovers",
  "lightball",
  "luckyegg",
  "luckypunch",
  "machobrace",
  "magnet",
  "mentalherb",
  "metalpowder",
  "miracleseed",
  "mysticwater",
  "nevermeltice",
  "pinkscarf",
  "poisonbarb",
  "quickclaw",
  "redscarf",
  "scopelens",
  "seaincense",
  "sharpbeak",
  "shellbell",
  "silkscarf",
  "silverpowder",
  "smokeball",
  "softsand",
  "soothebell",
  "souldew",
  "spelltag",
  "stick",
  "thickclub",
  "twistedspoon",
  "whiteherb",
  "yellowscarf",
  ...Array.from({ length: 5 }, (_, i) => `hm${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: 50 }, (_, i) => `tm${String(i + 1).padStart(2, "0")}`),
]);

type ItemFromAPI = {
  id: number;
  name: string;
  category?: { name: string };
  effect_entries?: Array<{
    effect?: string;
    short_effect?: string;
    language?: { name: string };
  }>;
  flavor_text_entries?: Array<{
    language?: { name: string };
    version_group?: { name: string };
  }>;
  sprites?: { default?: string | null };
};

export const ITEM_TAB_IDS = [
  "items",
  "pokeballs",
  "evolutionary",
  "key-items",
  "tm-case",
  "berry-pouch",
  "miscellaneous",
] as const;
export type ItemTabId = (typeof ITEM_TAB_IDS)[number];

/** Map API category name to tab ID for FR/LG-style grouping. */
function getTabForCategory(apiCategory: string): ItemTabId {
  const c = apiCategory.replace(/\s/g, "-").toLowerCase();
  if (["standard-balls", "special-balls", "apricorn-balls"].includes(c)) return "pokeballs";
  if (["evolution", "mega-stones"].includes(c)) return "evolutionary";
  if (["plot-advancement", "event-items", "gameplay", "dex-completion", "flutes"].includes(c))
    return "key-items";
  if (c === "all-machines") return "tm-case";
  if (
    ["baking-only", "picky-healing", "effort-drop", "effort-training", "in-a-pinch", "medicine", "other"].includes(c)
  )
    return "berry-pouch";
  if (
    [
      "healing",
      "pp-recovery",
      "revival",
      "status-cures",
      "vitamins",
      "stat-boosts",
      "training",
      "type-protection",
    ].includes(c)
  )
    return "items";
  return "miscellaneous";
}

export type ItemRow = {
  name: string;
  category: string;
  effect: string | null;
  spriteUrl: string | null;
  /** Tab to show this item in. */
  tabId: ItemTabId;
};

function getEffectEn(item: ItemFromAPI): string | null {
  const en = item.effect_entries?.find((e) => e.language?.name === "en");
  return en?.short_effect ?? en?.effect ?? null;
}

function hasFlavorForFrLg(item: ItemFromAPI): boolean {
  return (item.flavor_text_entries ?? []).some(
    (e) => e.version_group?.name === FR_LG_VERSION_GROUP
  );
}

async function fetchItemByUrl(url: string): Promise<ItemFromAPI | null> {
  const res = await fetch(url, { next: { revalidate: 86400 } }).catch(() => null);
  if (!res?.ok) return null;
  return res.json().catch(() => null);
}

async function fetchItemList(offset: number, limit: number): Promise<Array<{ name: string; url: string }>> {
  const res = await fetch(
    `${POKEAPI_BASE}/item?offset=${offset}&limit=${limit}`,
    { next: { revalidate: 86400 } }
  ).catch(() => null);
  if (!res?.ok) return [];
  const data = (await res.json().catch(() => null)) as { results?: Array<{ name: string; url: string }> };
  return data.results ?? [];
}

/**
 * Fetch items that appear in FireRed / LeafGreen (have flavor text for that version group).
 * Fetches a limited set of items from the API and filters by FR/LG.
 */
export async function fetchFrLgItems(): Promise<ItemRow[]> {
  const allUrls: string[] = [];
  for (let offset = 0; offset < MAX_ITEMS_TO_CHECK; offset += LIST_PAGE_SIZE) {
    const page = await fetchItemList(offset, LIST_PAGE_SIZE);
    for (const r of page) allUrls.push(r.url);
    if (page.length < LIST_PAGE_SIZE) break;
  }

  const rows: ItemRow[] = [];
  for (let i = 0; i < allUrls.length; i += FETCH_CHUNK_SIZE) {
    const chunk = allUrls.slice(i, i + FETCH_CHUNK_SIZE);
    const items = await Promise.all(chunk.map((url) => fetchItemByUrl(url)));
    for (const item of items) {
      if (!item?.name || !hasFlavorForFrLg(item)) continue;
      if (!FRLG_ITEM_SLUGS.has(normalizeItemSlug(item.name))) continue;
      const categoryName = item.category?.name ?? "unknown";
      const tabId = getTabForCategory(categoryName);
      const rawName = item.name.replace(/-/g, " ");
      let categoryDisplay = categoryName.replace(/-/g, " ");
      if (categoryName === "all-machines") {
        categoryDisplay = item.name.toLowerCase().startsWith("hm") ? "hm" : "tm";
      }
      rows.push({
        name: rawName,
        category: categoryDisplay,
        effect: getEffectEn(item),
        spriteUrl: item.sprites?.default ?? null,
        tabId,
      });
    }
  }

  rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return rows;
}
