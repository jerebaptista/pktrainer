/**
 * One-off script: list Kanto Pokémon that have NO FireRed/LeafGreen location in the API.
 * Excludes those we classify as evolution (Trade, Level up, stones) — returns the rest.
 * Run: node scripts/list-no-location-pokemon.mjs
 */

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const KANTO_DEX_LIMIT = 151;
const MEW_ID = 151;
const PORYGON_ID = 137;
const SPECIAL_EVENT_LABEL = "Special Event";
const GAME_CORNER_LABEL = "Game Corner";
const LEVEL_UP_LABEL = "Level up";
const STONE_ITEM_TO_LABEL = {
  "fire-stone": "Fire Stone",
  "water-stone": "Water Stone",
  "thunder-stone": "Thunder Stone",
  "leaf-stone": "Leaf Stone",
  "moon-stone": "Moon Stone",
};

function getTradeEvolvedFromChain(chain, out) {
  if (!chain?.evolves_to) return;
  for (const next of chain.evolves_to) {
    const isTrade = next.evolution_details?.some((d) => d.trigger?.name === "trade");
    if (isTrade && next.species?.name) out.add(next.species.name);
    getTradeEvolvedFromChain(next, out);
  }
}

function getStoneEvolvedFromChain(chain, out) {
  if (!chain?.evolves_to) return;
  for (const next of chain.evolves_to) {
    const d = next.evolution_details?.find((e) => e.trigger?.name === "use-item" && e.item?.name);
    if (d?.item?.name && next.species?.name && STONE_ITEM_TO_LABEL[d.item.name])
      out.set(next.species.name, STONE_ITEM_TO_LABEL[d.item.name]);
    getStoneEvolvedFromChain(next, out);
  }
}

function hasFRLGEncounter(encounters) {
  for (const area of encounters) {
    for (const vd of area.version_details ?? []) {
      const key = vd.version?.name?.toLowerCase();
      if (key === "firered" || key === "leafgreen") return true;
    }
  }
  return false;
}

function classifyNoLocation(pokemonId, speciesName, tradeSet, stoneMap) {
  if (pokemonId === MEW_ID) return SPECIAL_EVENT_LABEL;
  if (pokemonId === PORYGON_ID) return GAME_CORNER_LABEL;
  const key = speciesName.toLowerCase();
  if (tradeSet.has(key)) return "Trade";
  if (stoneMap.has(key)) return stoneMap.get(key);
  return LEVEL_UP_LABEL;
}

async function main() {
  const ids = Array.from({ length: KANTO_DEX_LIMIT }, (_, i) => i + 1);

  const [pokemonList, encounterList, speciesList] = await Promise.all([
    Promise.all(ids.map((id) => fetch(`${POKEAPI_BASE}/pokemon/${id}`).then((r) => r.json()))),
    Promise.all(ids.map((id) => fetch(`${POKEAPI_BASE}/pokemon/${id}/encounters`).then((r) => r.json()))),
    Promise.all(
      ids.map((id) =>
        fetch(`${POKEAPI_BASE}/pokemon/${id}`)
          .then((r) => r.json())
          .then((p) => fetch(p.species.url).then((r) => r.json()))
      )
    ),
  ]);

  const chainUrls = [...new Set(speciesList.map((s) => s?.evolution_chain?.url).filter(Boolean))];
  const chainList = await Promise.all(chainUrls.map((url) => fetch(url).then((r) => r.json())));
  const tradeEvolved = new Set();
  const stoneEvolved = new Map();
  for (const { chain } of chainList) {
    getTradeEvolvedFromChain(chain, tradeEvolved);
    getStoneEvolvedFromChain(chain, stoneEvolved);
  }

  const noLocation = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const encounters = encounterList[i] ?? [];
    if (!hasFRLGEncounter(encounters)) {
      const name = pokemonList[i].name;
      const speciesName = speciesList[i]?.name ?? name;
      const classification = classifyNoLocation(id, speciesName, tradeEvolved, stoneEvolved);
      noLocation.push({ id, name, classification });
    }
  }

  const evolutionTypes = new Set([
    LEVEL_UP_LABEL,
    "Trade",
    "Fire Stone",
    "Water Stone",
    "Thunder Stone",
    "Leaf Stone",
    "Moon Stone",
  ]);
  const notEvolution = noLocation.filter((p) => !evolutionTypes.has(p.classification));

  console.log("=== Pokémon SEM local de captura na API (FireRed/LeafGreen) ===\n");
  console.log("Total:", noLocation.length);
  console.log("\nTodos (com classificação atual):");
  noLocation.forEach((p) => console.log(`  #${String(p.id).padStart(3, "0")} ${p.name.padEnd(16)} → ${p.classification}`));
  console.log("\n--- Desconsiderando evolução (Trade, Level up, pedras) ---\n");
  console.log("Restam (sem local na API e que não são por evolução):");
  if (notEvolution.length === 0) {
    console.log("  (nenhum)");
  } else {
    notEvolution.forEach((p) => console.log(`  #${String(p.id).padStart(3, "0")} ${p.name.padEnd(16)} → ${p.classification}`));
  }
}

main().catch(console.error);
