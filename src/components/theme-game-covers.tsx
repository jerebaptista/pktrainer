"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const THEME_COLOR_KEY = "pk-trainer-theme-color";
type ThemeColor = "green" | "red";

const POKEMON_SPRITES_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen";
const CHARIZARD_ID = 6;
const VENUSAUR_ID = 3;

const COVER_FIRERED = "/covers/firered-cover.png";
const COVER_LEAFGREEN = "/covers/leafgreen-cover.png";

export function ThemeGameCovers({ className }: { className?: string }) {
  const { state: sidebarState } = useSidebar();
  const [themeColor, setThemeColor] = useState<ThemeColor>("red");
  const [mounted, setMounted] = useState(false);
  const [frShowImg, setFrShowImg] = useState(false);
  const [lgShowImg, setLgShowImg] = useState(false);
  const isCollapsed = sidebarState === "collapsed";

  useEffect(() => {
    const stored = localStorage.getItem(THEME_COLOR_KEY) as ThemeColor | null;
    const theme = stored === "green" ? "green" : "red";
    setThemeColor(theme);
    document.documentElement.setAttribute("data-theme", theme);
    if (stored !== theme) localStorage.setItem(THEME_COLOR_KEY, theme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", themeColor);
    localStorage.setItem(THEME_COLOR_KEY, themeColor);
    window.dispatchEvent(new CustomEvent("pk-trainer-theme-color-change", { detail: { theme: themeColor } }));
  }, [themeColor, mounted]);

  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme?: ThemeColor }>;
      const next = customEvent.detail?.theme;
      if (next === "red" || next === "green") setThemeColor(next);
    };
    window.addEventListener("pk-trainer-theme-color-change", onThemeChange);
    return () => window.removeEventListener("pk-trainer-theme-color-change", onThemeChange);
  }, []);

  const cycleTheme = () => setThemeColor((t) => (t === "red" ? "green" : "red"));

  if (!mounted) {
    return (
      <div className={cn("flex gap-2", className)}>
        {!isCollapsed && (
          <>
            <div className="size-24 shrink-0 rounded-md bg-red-500/20" />
            <div className="size-24 shrink-0 rounded-md bg-green-500/20" />
          </>
        )}
        {isCollapsed && <div className="size-10 rounded border border-red-200 bg-red-100" />}
      </div>
    );
  }

  if (isCollapsed) {
    const themeLabel = themeColor === "red" ? "FireRed" : "LeafGreen";
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            size="sm"
            pressed={false}
            onClick={cycleTheme}
            aria-label={`${themeLabel} (clique para alternar)`}
            className={cn(
              "h-10 min-w-10 w-full rounded-md border p-1 transition-all",
              themeColor === "red"
                ? "border-red-500 bg-red-100 hover:bg-red-100 data-[state=on]:bg-red-100"
                : "border-green-600 bg-green-100 hover:bg-green-100 data-[state=on]:bg-green-100"
            )}
          >
            <Image
              src={themeColor === "red" ? `${POKEMON_SPRITES_BASE}/${CHARIZARD_ID}.png` : `${POKEMON_SPRITES_BASE}/${VENUSAUR_ID}.png`}
              alt=""
              width={32}
              height={32}
              className="size-6 object-contain"
            />
          </Toggle>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          {themeLabel}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <button
        type="button"
        onClick={() => setThemeColor("red")}
        aria-label="FireRed theme (red)"
        className={cn(
          "relative size-24 shrink-0 overflow-hidden rounded-md border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          themeColor === "red"
            ? "border-primary ring-2 ring-primary/30"
            : "border-transparent opacity-40 hover:opacity-90"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-red-600 via-orange-600 to-red-800">
          <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-wide text-white drop-shadow">
            FireRed
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={COVER_FIRERED}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          onLoad={() => setFrShowImg(true)}
          onError={() => setFrShowImg(false)}
          style={{ opacity: frShowImg ? 1 : 0 }}
        />
      </button>
      <button
        type="button"
        onClick={() => setThemeColor("green")}
        aria-label="LeafGreen theme (green)"
        className={cn(
          "relative size-24 shrink-0 overflow-hidden rounded-md border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          themeColor === "green"
            ? "border-primary ring-2 ring-primary/30"
            : "border-transparent opacity-40 hover:opacity-90"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-green-600 via-emerald-600 to-green-800">
          <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-wide text-white drop-shadow">
            LeafGreen
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={COVER_LEAFGREEN}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          onLoad={() => setLgShowImg(true)}
          onError={() => setLgShowImg(false)}
          style={{ opacity: lgShowImg ? 1 : 0 }}
        />
      </button>
    </div>
  );
}
