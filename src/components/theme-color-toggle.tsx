"use client";

import { useEffect, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const THEME_COLOR_KEY = "pk-trainer-theme-color";
type ThemeColor = "green" | "red";

export function ThemeColorToggle({ className }: { className?: string }) {
  const [themeColor, setThemeColor] = useState<ThemeColor>("green");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_COLOR_KEY) as ThemeColor | null;
    const theme = stored === "red" ? "red" : "green";
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
      <div className={cn("flex gap-1", className)}>
        <span className="text-muted-foreground text-xs">Green</span>
        <span className="text-muted-foreground text-xs">Red</span>
      </div>
    );
  }

  return (
    <ToggleGroup
      type="single"
      value={themeColor}
      onValueChange={(v) => v && setThemeColor(v as ThemeColor)}
      className={cn("gap-0", className)}
      size="sm"
    >
      <ToggleGroupItem value="green" aria-label="Green theme (LeafGreen)">
        Green
      </ToggleGroupItem>
      <ToggleGroupItem value="red" aria-label="Red theme (FireRed)">
        Red
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
