"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={isDark}
      onPressedChange={() => setTheme(isDark ? "light" : "dark")}
      className={cn("size-8 p-0 data-[state=on]:bg-transparent data-[state=on]:text-foreground hover:data-[state=on]:bg-muted", className)}
      aria-label={isDark ? "Dark mode (click for light)" : "Light mode (click for dark)"}
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Toggle>
  );
}
