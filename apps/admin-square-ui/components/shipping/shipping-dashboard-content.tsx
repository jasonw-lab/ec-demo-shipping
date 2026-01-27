"use client";

import { useShippingStore } from "@/store/shipping-store";
import { ShippingStatCard } from "./shipping-stat-card";
import { PriorityShipments } from "./priority-shipments";
import { ShippingDetailSheet } from "./shipping-detail-sheet";

export function ShippingDashboardContent() {
  const summary = useShippingStore((state) => state.summary);

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        {/* KPI Cards */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">発送状況サマリー</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ShippingStatCard
              title="出荷準備中"
              value={summary.created}
              icon="created"
              href="/shipping/list?status=CREATED"
            />
            <ShippingStatCard
              title="出荷指示済み"
              value={summary.ready}
              icon="ready"
              href="/shipping/list?status=READY"
            />
            <ShippingStatCard
              title="本日発送"
              value={summary.shippedToday}
              icon="shipped"
              href="/shipping/list?status=SHIPPED"
            />
            <ShippingStatCard
              title="返品対応"
              value={summary.returned}
              icon="returned"
              href="/shipping/list?status=RETURNED"
              variant="destructive"
            />
          </div>
        </section>

        {/* Priority Shipments */}
        <section>
          <PriorityShipments />
        </section>
      </div>

      <ShippingDetailSheet />
    </div>
  );
}
