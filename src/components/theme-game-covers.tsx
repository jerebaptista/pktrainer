"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEME_COLOR_KEY = "pk-trainer-theme-color";
type ThemeColor = "green" | "red";

const COVER_FIRERED = "/covers/firered-cover.png";
const COVER_LEAFGREEN = "/covers/leafgreen-cover.png";

export function ThemeGameCovers({ className }: { className?: string }) {
  const [themeColor, setThemeColor] = useState<ThemeColor>("red");
  const [mounted, setMounted] = useState(false);
  const [frShowImg, setFrShowImg] = useState(false);
  const [lgShowImg, setLgShowImg] = useState(false);

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
  }, [themeColor, mounted]);

  if (!mounted) {
    return (
      <div className={cn("flex gap-2", className)}>
        <div className="size-24 shrink-0 rounded-md bg-red-500/20" />
        <div className="size-24 shrink-0 rounded-md bg-green-500/20" />
      </div>
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
