"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";

type PokedexSearchValue = {
  query: string;
  setQuery: (value: string) => void;
};

const PokedexSearchContext = createContext<PokedexSearchValue | null>(null);

export function PokedexSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ query, setQuery }), [query]);
  return <PokedexSearchContext.Provider value={value}>{children}</PokedexSearchContext.Provider>;
}

export function usePokedexSearch() {
  const value = useContext(PokedexSearchContext);
  if (!value) throw new Error("usePokedexSearch must be used within PokedexSearchProvider");
  return value;
}

export function PokedexSearchInput() {
  const t = useTranslations("Pokedex");
  const pathname = usePathname();
  const search = useContext(PokedexSearchContext);
  if (!search || pathname !== "/pokedex") return null;

  return (
    <Input
      value={search.query}
      onChange={(event) => search.setQuery(event.target.value)}
      placeholder={t("searchPlaceholder")}
      aria-label={t("search")}
      className="min-w-0 max-w-xs flex-1"
    />
  );
}
