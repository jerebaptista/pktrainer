/**
 * Lista Pokémon que:
 * - Têm "Wild" na tabela (sem FR Only / LG Only),
 * - E a API NÃO retorna nenhuma localidade FRLG para eles.
 *
 * Run: node scripts/list-wild-no-locations-from-api.mjs
 *
 * Última execução: nenhum Pokémon atendeu (todos com Wild sem FR/LG only
 * retornam ao menos uma localidade na API). Mantemos enriquecimento de
 * Safari Zone para Nidoran♀, Nidoran♂, Nidorina, Nidorino em encounter-display.
 */

const POKEAPI = "https://pokeapi.co/api/v2";
const KANTO_LIMIT = 151;

const WILD_FR_ONLY_IDS = new Set([
  23, 24, 43, 44, 45, 182, 56, 57, 58, 59, 110, 117, 125,
]);
const WILD_LG_ONLY_IDS = new Set([
  27, 28, 37, 38, 52, 53, 69, 70, 71, 89, 99, 126,
]);
const GIFT_ONLY_IDS = new Set([106, 107]);

function getLocationsForVersion(encounters, version) {
  return encounters
    .filter((enc) =>
      enc.versionDetails.some((vd) => vd.versionName.toLowerCase() === version)
    )
    .map((enc) => enc.locationAreaName)
    .filter((name) => name && name !== "—");
}

const results = [];

for (let id = 1; id <= KANTO_LIMIT; id++) {
  const res = await fetch(`${POKEAPI}/pokemon/${id}/encounters`);
  const entries = await res.json();

  const encounters = entries.map((area) => ({
    locationAreaName: area.location_area?.name ?? "—",
    versionDetails: (area.version_details ?? []).map((vd) => ({
      versionName: vd.version?.name ?? "—",
    })),
  }));

  const locsFR = getLocationsForVersion(encounters, "firered");
  const locsLG = getLocationsForVersion(encounters, "leafgreen");
  const noLocationsFromApi = locsFR.length === 0 && locsLG.length === 0;

  let versions = new Set();
  let onlyGift = true;
  for (const area of entries) {
    for (const vd of area.version_details ?? []) {
      const v = (vd.version?.name ?? "").toLowerCase();
      if (v === "firered" || v === "leafgreen") {
        versions.add(v);
        for (const ed of vd.encounter_details ?? []) {
          const method = (ed.method?.name ?? "").toLowerCase();
          if (method && method !== "gift") onlyGift = false;
        }
      }
    }
  }

  const hasWildInTable =
    !GIFT_ONLY_IDS.has(id) &&
    !onlyGift &&
    !WILD_FR_ONLY_IDS.has(id) &&
    !WILD_LG_ONLY_IDS.has(id) &&
    versions.size > 0;

  if (hasWildInTable && noLocationsFromApi) {
    results.push(id);
  }
}

const names = [];
for (const id of results) {
  const res = await fetch(`${POKEAPI}/pokemon/${id}`);
  const data = await res.json();
  names.push({ id, name: data.name });
}

console.log("Pokémon com Wild (sem FR/LG only) e SEM localidades retornadas pela API:\n");
console.log("IDs:", results.join(", ") || "(nenhum)");
console.log("\n(id) name");
names.forEach(({ id, name }) => console.log(`#${id} ${name}`));
