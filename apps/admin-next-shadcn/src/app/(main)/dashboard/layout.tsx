"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RouteGuard } from "@/lib/auth/route-guard";
import { getClientCookie } from "@/lib/cookie.client";
import { cn } from "@/lib/utils";

import { AccountSwitcher } from "./_components/sidebar/account-switcher";
import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { LayoutControls } from "./_components/sidebar/layout-controls";
import { SearchDialog } from "./_components/sidebar/search-dialog";
import { ThemeSwitcher } from "./_components/sidebar/theme-switcher";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const [mounted, setMounted] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(true);
  const [variant, setVariant] = useState<"sidebar" | "floating" | "inset">("inset");
  const [collapsible, setCollapsible] = useState<"offcanvas" | "icon" | "none">("icon");

  useEffect(() => {
    setMounted(true);

    // Read preferences from client-side cookies
    const sidebarState = getClientCookie("sidebar_state");
    setDefaultOpen(sidebarState !== "false");

    const sidebarVariant = getClientCookie("sidebar_variant");
    if (sidebarVariant === "sidebar" || sidebarVariant === "floating" || sidebarVariant === "inset") {
      setVariant(sidebarVariant);
    }

    const sidebarCollapsible = getClientCookie("sidebar_collapsible");
    if (sidebarCollapsible === "offcanvas" || sidebarCollapsible === "icon" || sidebarCollapsible === "none") {
      setCollapsible(sidebarCollapsible);
    }
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <RouteGuard>
      <SidebarProvider defaultOpen={defaultOpen} suppressHydrationWarning>
        <AppSidebar variant={variant} collapsible={collapsible} />
        <SidebarInset
          className={cn(
            "[html[data-content-layout=centered]_&]:mx-auto! [html[data-content-layout=centered]_&]:max-w-screen-2xl!",
            // Adds right margin for inset sidebar in centered layout up to 113rem.
            // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
            "max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:mr-auto!",
          )}
        >
          <header
            className={cn(
              "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
              // Handle sticky navbar style with conditional classes so blur, background, z-index, and rounded corners remain consistent across all SidebarVariant layouts.
              "[html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
            )}
          >
            <div className="flex w-full items-center justify-between px-4 lg:px-6" suppressHydrationWarning>
              <div className="flex items-center gap-1 lg:gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <LayoutControls />
                <ThemeSwitcher />
                <AccountSwitcher />
              </div>
            </div>
          </header>
          <div className="h-full p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </RouteGuard>
  );
}
