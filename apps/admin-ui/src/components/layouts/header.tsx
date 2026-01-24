"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onMenuClick: () => void;
}

export function Header({ isSidebarCollapsed, onMenuClick }: HeaderProps) {
  return (
    <header
      className={cn(
        "fixed top-0 z-30 h-16 border-b bg-background transition-all duration-300",
        isSidebarCollapsed ? "left-16" : "left-64",
        "right-0"
      )}
    >
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">発送管理システム</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Future: User menu, notifications, etc. */}
        </div>
      </div>
    </header>
  );
}
