"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ShippingList } from "@/components/shipping/shipping-list";
import { ShippingDetailSheet } from "@/components/shipping/shipping-detail-sheet";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useShippingStore } from "@/store/shipping-store";

export default function ShippingListPage() {
  const { selectedShipping, setSelectedShipping } = useShippingStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Open sheet when shipping is selected
  if (selectedShipping && !sheetOpen) {
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      setSelectedShipping(null);
    }
  }

  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
            <div className="mx-auto w-full">
              <ShippingList />
            </div>
          </div>
        </div>
      </div>
      <ShippingDetailSheet open={sheetOpen} onOpenChange={handleSheetOpenChange} />
      <Toaster />
    </SidebarProvider>
  );
}
