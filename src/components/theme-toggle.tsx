"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("Theme");
  const isDark = resolvedTheme === "dark";

  return (
    <Toggle
      variant="outline"
      size="default"
      pressed={isDark}
      onPressedChange={() => setTheme(isDark ? "light" : "dark")}
      className={cn("size-9 p-0 data-[state=on]:bg-transparent data-[state=on]:text-foreground hover:data-[state=on]:bg-muted", className)}
      aria-label={isDark ? t("dark") : t("light")}
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Toggle>
  );
}
