/**
 * One-off script: fetch all encounter location names for FireRed and LeafGreen from PokeAPI.
 * Run: node scripts/list-frlg-locations.mjs
 * Output: two lists (firered, leafgreen) of unique location_area names.
 */

const POKEAPI = "https://pokeapi.co/api/v2";
const KANTO_LIMIT = 151;

const byVersion = { firered: new Set(), leafgreen: new Set() };

for (let id = 1; id <= KANTO_LIMIT; id++) {
  const res = await fetch(`${POKEAPI}/pokemon/${id}/encounters`);
  const entries = await res.json();
  for (const area of entries) {
    const name = area.location_area?.name;
    if (!name) continue;
    for (const vd of area.version_details ?? []) {
      const v = (vd.version?.name || "").toLowerCase();
      if (v === "firered") byVersion.firered.add(name);
      if (v === "leafgreen") byVersion.leafgreen.add(name);
    }
  }
}

const fr = [...byVersion.firered].sort();
const lg = [...byVersion.leafgreen].sort();

console.log("=== FireRed (firered) ===\n");
fr.forEach((n) => console.log(n));

console.log("\n=== LeafGreen (leafgreen) ===\n");
lg.forEach((n) => console.log(n));

console.log("\n=== All unique (firered + leafgreen) ===\n");
const all = [...new Set([...fr, ...lg])].sort();
all.forEach((n) => console.log(n));
