"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { ThemeGameCovers } from "@/components/theme-game-covers";
import { LanguageSwitcher } from "@/components/language-switcher";

const ITEM_SPRITES_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
function itemSpriteUrl(slug: string) {
  return `${ITEM_SPRITES_BASE}/${slug}.png`;
}

type NavLabelKey =
  | "pokemon"
  | "moves"
  | "abilities"
  | "iv"
  | "ev"
  | "personality"
  | "nature"
  | "breeding"
  | "walkthrough"
  | "locations"
  | "items"
  | "blog"
  | "about";

type NavItem = { labelKey: NavLabelKey; href: string; iconSlug: string; iconLocal?: string };

const navPokedex: NavItem[] = [
  { labelKey: "pokemon", href: "/pokedex", iconSlug: "poke-ball" },
  { labelKey: "moves", href: "/moves", iconSlug: "machine-part" },
  { labelKey: "abilities", href: "/abilities", iconSlug: "lucky-egg" },
  { labelKey: "iv", href: "/pokedex/iv", iconSlug: "power-weight" },
  { labelKey: "ev", href: "/pokedex/ev", iconSlug: "macho-brace" },
  { labelKey: "personality", href: "/pokedex/personality", iconSlug: "soothe-bell" },
  { labelKey: "nature", href: "/pokedex/nature", iconSlug: "leaf-stone" },
  { labelKey: "breeding", href: "/pokedex/breeding", iconSlug: "mystery-egg" },
];

const navGuides: NavItem[] = [
  { labelKey: "walkthrough", href: "/walkthrough", iconSlug: "fame-checker", iconLocal: "/running-shoes.png" },
  { labelKey: "locations", href: "/locations", iconSlug: "town-map" },
  { labelKey: "items", href: "/items", iconSlug: "potion" },
];

const navOthers: NavItem[] = [
  { labelKey: "blog", href: "/blog", iconSlug: "journal" },
  { labelKey: "about", href: "/about", iconSlug: "rare-candy" },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"} tooltip={t("home")} className="group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!min-w-10">
                <Link href="/" className="flex items-center gap-2 overflow-hidden">
                  <span className="flex h-8 shrink-0 items-center justify-center overflow-hidden rounded min-w-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:min-w-10">
                    <Image
                      src="/logo-pktrainer.png"
                      alt="PK Trainer"
                      width={140}
                      height={24}
                      className="h-6 w-auto max-w-full object-contain object-left group-data-[collapsible=icon]:hidden"
                      priority
                    />
                    <Image
                      src="/logo-pk.png"
                      alt="PK"
                      width={64}
                      height={32}
                      className="hidden h-6 w-8 object-contain group-data-[collapsible=icon]:!block group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-9"
                      priority
                    />
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="pb-2 pl-4 pr-4 pt-4 group-data-[collapsible=icon]:px-2">
            <ThemeGameCovers />
          </div>
          <SidebarGroup>
            <SidebarGroupLabel>{t("pokedexGroup")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navPokedex.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={t(item.labelKey)} className="group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!min-w-10">
                      <Link href={item.href} className="flex items-center gap-2">
                        <span className="flex h-6 w-6 min-h-6 min-w-6 shrink-0 items-center justify-center">
                          <Image
                            src={item.iconLocal ?? itemSpriteUrl(item.iconSlug)}
                            alt=""
                            width={24}
                            height={24}
                            className="size-6 object-contain"
                          />
                        </span>
                        <span className="truncate">{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t("guidesGroup")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navGuides.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={t(item.labelKey)} className="group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!min-w-10">
                      <Link href={item.href} className="flex items-center gap-2">
                        <span className="flex h-6 w-6 min-h-6 min-w-6 shrink-0 items-center justify-center">
                          <Image
                            src={item.iconLocal ?? itemSpriteUrl(item.iconSlug)}
                            alt=""
                            width={24}
                            height={24}
                            className="size-6 object-contain"
                          />
                        </span>
                        <span className="truncate">{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t("othersGroup")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navOthers.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={t(item.labelKey)} className="group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!min-w-10">
                      <Link href={item.href} className="flex items-center gap-2">
                        <span className="flex h-6 w-6 min-h-6 min-w-6 shrink-0 items-center justify-center">
                          <Image
                            src={item.iconLocal ?? itemSpriteUrl(item.iconSlug)}
                            alt=""
                            width={24}
                            height={24}
                            className="size-6 object-contain"
                          />
                        </span>
                        <span className="truncate">{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-medium text-muted-foreground md:hidden">
            {t("menu")}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
