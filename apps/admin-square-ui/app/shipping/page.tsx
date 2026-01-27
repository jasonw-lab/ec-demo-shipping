import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ShippingHeader } from "@/components/shipping/shipping-header";
import { ShippingDashboardContent } from "@/components/shipping/shipping-dashboard-content";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ShippingDashboardPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <ShippingHeader title="発送管理ダッシュボード" />
          <ShippingDashboardContent />
        </div>
      </div>
    </SidebarProvider>
  );
}
