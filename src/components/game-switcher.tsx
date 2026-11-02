"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useGame } from "@/components/game-provider";
import { gameAvatarUrl, gameCoverUrl, gameMascotUrl, GAMES, modernSpriteUrl, type GameDef } from "@/lib/games";
import { cn, formatApiName } from "@/lib/utils";

function gameName(id: string) {
  return formatApiName(id);
}

function gameInitial(id: string) {
  return gameName(id).charAt(0).toUpperCase();
}

function GameAvatar({ game, size = "default" }: { game: GameDef; size?: "default" | "sm" }) {
  const cover = gameCoverUrl(game);

  return (
    <Avatar size={size} className="rounded-lg bg-primary/10">
      <AvatarImage
        src={gameAvatarUrl(game)}
        alt=""
        className={cn(cover ? "object-cover" : cn("object-contain p-0.5", game.generation <= 5 && "pixelated"))}
        onError={(event) => {
          event.currentTarget.src = cover ? gameMascotUrl(game) : modernSpriteUrl(game.mascotId);
        }}
      />
      <AvatarFallback className="rounded-lg bg-primary/10 font-medium">
        {gameInitial(game.id)}
      </AvatarFallback>
    </Avatar>
  );
}

export function GameSwitcher() {
  const { game, isPending, setGameId } = useGame();
  const { isMobile } = useSidebar();
  const t = useTranslations("Game");
  const [open, setOpen] = useState(false);
  const groups = [...new Set(GAMES.map((item) => item.generationLabel))];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              requestAnimationFrame(() => {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              });
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={gameName(game.id)}
              aria-label={t("label")}
              disabled={isPending}
              className="group/switcher focus:ring-0 focus-visible:ring-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <GameAvatar game={game} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{gameName(game.id)}</span>
                <span className="truncate text-xs">{t("generation", { gen: game.generationLabel })}</span>
              </div>
              {isPending ? (
                <Spinner className="ml-auto" />
              ) : (
                <ChevronDown className="ml-auto opacity-0 transition-opacity group-hover/switcher:opacity-100 group-data-[state=open]/switcher:opacity-100 group-data-[collapsible=icon]:hidden" />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 overflow-hidden rounded-lg p-0"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
            }}
          >
            <ScrollArea className="h-72">
              <div className="p-1">
                {groups.map((generation) => (
                  <DropdownMenuGroup key={generation}>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      {t("generation", { gen: generation })}
                    </DropdownMenuLabel>
                    {GAMES.filter((item) => item.generationLabel === generation).map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        className="gap-2 p-2"
                        onClick={() => {
                          setOpen(false);
                          if (item.id === game.id) return;
                          window.setTimeout(() => setGameId(item.id), 0);
                        }}
                      >
                        <GameAvatar game={item} size="sm" />
                        <span className="truncate">{gameName(item.id)}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                ))}
              </div>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
