"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeColorToggle } from "@/components/theme-color-toggle";

const navPokedex = [
  { label: "Pokémon", href: "/pokedex" },
  { label: "Moves", href: "/moves" },
  { label: "Abilities", href: "/abilities" },
];

const navGuides = [
  { label: "Walkthrough", href: "/walkthrough" },
  { label: "Locations", href: "/locations" },
  { label: "About", href: "/about" },
];

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"}>
                <Link href="/" className="block w-full">
                  <Image
                    src="/logo.png"
                    alt="PKtrainer"
                    width={110}
                    height={24}
                    className="h-6 w-auto object-contain object-left"
                    priority
                  />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Pokédex</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navPokedex.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Guides</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navGuides.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 px-2 text-xs font-medium text-sidebar-foreground/70">
              Theme
            </div>
            <ThemeColorToggle />
            <div className="flex items-center justify-between gap-2 px-2 text-xs font-medium text-sidebar-foreground/70">
              Mode
            </div>
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <span className="text-sm font-medium text-muted-foreground md:hidden">
            Menu
          </span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
