"use client";

import { ShippingTable } from "./shipping-table";
import { ShippingDetailSheet } from "./shipping-detail-sheet";

export function ShippingListContent() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">発送一覧</h2>
          <ShippingTable />
        </section>
      </div>

      <ShippingDetailSheet />
    </div>
  );
}
