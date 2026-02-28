/**
 * API adjustments – single place for all overrides and corrections on top of the PokéAPI.
 * Use this module wherever we consume API data (table, individual Pokémon pages, etc.).
 *
 * - Display names: nidoran-f → Nidoran♀, mr-mime → Mr. Mime, etc.
 * - FRLG availability: Game Corner, NPC Trade, Fossil, exclusives, evolution labels.
 * - (Future: other fields we want to correct or enrich.)
 */

export { getPokemonDisplayName } from "./display-names";

export {
  buildAvailability,
  getTradeEvolvedSpeciesFromChain,
  getStoneEvolvedSpeciesFromChain,
  getLevelEvolvedSpeciesFromChain,
  GAME_CORNER_IDS,
  GAME_CORNER_FR_ONLY_IDS,
  GAME_CORNER_LG_ONLY_IDS,
  NPC_TRADE_IDS,
  NPC_TRADE_FR_IDS,
  NPC_TRADE_LG_IDS,
  FOSSIL_IDS,
  GIFT_ONLY_IDS,
  WILD_LG_ONLY_IDS,
  WILD_FR_ONLY_IDS,
  IN_BOTH_GAMES_OVERRIDE_IDS,
  FR_ONLY_LABEL,
  LG_ONLY_LABEL,
  type EncounterEntry,
  type EvolutionChainNode,
  type BuildAvailabilityParams,
} from "./availability";
