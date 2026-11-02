import { cookies } from "next/headers";
import { GAME_COOKIE, getGame, type GameDef } from "@/lib/games";

export async function getRequestGame(): Promise<GameDef> {
  const store = await cookies();
  return getGame(store.get(GAME_COOKIE)?.value);
}
