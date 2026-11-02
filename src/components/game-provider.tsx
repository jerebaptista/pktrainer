"use client";

import { createContext, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_GAME_ID, GAME_COOKIE, GAME_THEME_COOKIE, GAMES, getGame, type GameDef } from "@/lib/games";

type GameContextValue = {
  game: GameDef;
  isPending: boolean;
  setGameId: (id: string) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

function applyGameTheme(game: GameDef) {
  document.documentElement.setAttribute("data-game-theme", game.theme);
  document.documentElement.setAttribute("data-theme", game.theme);
  document.cookie = `${GAME_COOKIE}=${game.id}; path=/; max-age=31536000; samesite=lax`;
  document.cookie = `${GAME_THEME_COOKIE}=${game.theme}; path=/; max-age=31536000; samesite=lax`;
  localStorage.setItem(GAME_COOKIE, game.id);
  localStorage.setItem(GAME_THEME_COOKIE, game.theme);
}

export function GameProvider({
  initialGameId,
  children,
}: {
  initialGameId?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("Game");
  const [isPending, startTransition] = useTransition();
  const [gameId, setGameIdState] = useState(initialGameId && getGame(initialGameId).id === initialGameId ? initialGameId : DEFAULT_GAME_ID);
  const game = useMemo(() => getGame(gameId), [gameId]);

  useEffect(() => {
    applyGameTheme(game);
  }, [game]);

  const setGameId = (id: string) => {
    if (!GAMES.some((item) => item.id === id) || id === gameId) return;
    const nextGame = getGame(id);
    setGameIdState(id);
    applyGameTheme(nextGame);
    if (nextGame.pokedex !== game.pokedex) {
      document.querySelector<HTMLElement>("[data-slot='scroll-area-viewport']")?.scrollTo({ top: 0, left: 0 });
    }
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <GameContext.Provider value={{ game, isPending, setGameId }}>
      {children}
      {isPending ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label={t("loading")}
        >
          <Spinner className="size-8 text-primary" />
        </div>
      ) : null}
    </GameContext.Provider>
  );
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used within GameProvider");
  return value;
}
