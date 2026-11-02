"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GameSwitcher } from "@/components/game-switcher";
import { PokedexSearchInput, PokedexSearchProvider } from "@/components/pokedex-search";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const pageScrollRef = useRef<HTMLDivElement>(null);

  const showMenuLabel = pathname !== "/pokedex";

  useEffect(() => {
    const viewport = pageScrollRef.current?.querySelector<HTMLElement>("[data-slot='scroll-area-viewport']");
    viewport?.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return (
    <PokedexSearchProvider>
      <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarHeader>
          <GameSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/pokedex" || pathname.startsWith("/pokemon")} tooltip={t("pokedex")} className="group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!min-w-10">
                    <Link href="/pokedex" className="flex items-center gap-2">
                      <Image
                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                        alt=""
                        width={24}
                        height={24}
                        className="size-6 object-contain"
                      />
                      <span className="truncate">{t("pokedex")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center overflow-hidden px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Image
              src="/logo-pktrainer.png"
              alt="PK Trainer"
              width={140}
              height={28}
              className="h-6 w-auto object-contain object-left group-data-[collapsible=icon]:hidden"
            />
            <Image
              src="/logo-pk.png"
              alt="PK"
              width={40}
              height={20}
              className="hidden h-5 w-auto object-contain group-data-[collapsible=icon]:block"
            />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="overflow-hidden">
        <div ref={pageScrollRef} className="h-full">
        <ScrollArea className="h-full" type="always">
          <div className="flex min-h-full flex-col">
            <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/75 px-4 backdrop-blur-md md:px-6">
              <SidebarTrigger className="-ml-1" />
              {showMenuLabel ? (
                <span className="text-sm font-medium text-muted-foreground md:hidden">
                  {t("menu")}
                </span>
              ) : null}
              <PokedexSearchInput />
              <div className="ml-auto flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </header>
            <div className="min-h-0 min-w-0 flex-1">{children}</div>
          </div>
        </ScrollArea>
        </div>
      </SidebarInset>
      </SidebarProvider>
    </PokedexSearchProvider>
  );
}
