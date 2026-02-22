"use client";

import { useMemo } from "react";

import Link from "next/link";

import { CircleHelp, ClipboardList, Command, Database, File, Search, Settings } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { type NavGroup, type NavMainItem, sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { useAuth, usePermissions } from "@/stores/auth/auth-provider";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

const _data = {
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: CircleHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardList,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: File,
    },
  ],
};

/**
 * ユーザーのロールに基づいてサイドバー項目をフィルタリング
 */
function filterSidebarItemsByRole(items: readonly NavGroup[], hasRole: (role: string) => boolean): NavGroup[] {
  return items
    .map((group) => ({
      ...group,
      items: group.items.filter((item: NavMainItem) => {
        if (item.requiredRole && !hasRole(item.requiredRole)) {
          return false;
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
      isSynced: s.isSynced,
    })),
  );
  const { user: authUser } = useAuth();
  const { hasRole } = usePermissions();

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  // ロールに基づいてサイドバー項目をフィルタリング
  const filteredSidebarItems = useMemo(() => filterSidebarItemsByRole(sidebarItems, hasRole), [hasRole]);

  // 認証済みユーザー情報をNavUser用の形式に変換
  const navUser = {
    name: authUser?.display_name || authUser?.username || "User",
    email: authUser?.email || "",
    avatar: "",
  };

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/dashboard/default">
                <Command />
                <span className="font-semibold text-base">{APP_CONFIG.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredSidebarItems} />
        {/* <NavDocuments items={data.documents} /> */}
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
