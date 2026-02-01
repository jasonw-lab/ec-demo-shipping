import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ShippingDashboard } from "@/components/shipping/shipping-dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function ShippingDashboardPage() {
  return (
    <SidebarProvider className="bg-sidebar">
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <DashboardHeader />
          <div className="w-full overflow-y-auto overflow-x-hidden p-4 h-full">
            <div className="mx-auto w-full">
              <ShippingDashboard />
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
