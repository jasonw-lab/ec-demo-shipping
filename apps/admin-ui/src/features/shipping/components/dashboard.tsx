"use client";

import { useState } from "react";
import { useSummary } from "../api";
import { SummaryCard } from "./summary-card";
import { ActionRequiredList } from "./action-required-list";
import { ShippingDetailSheet } from "./shipping-detail-sheet";

export function Dashboard() {
  const { data, isLoading, error } = useSummary();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleRowClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedOrderId(null);
    }
  };

  if (error) {
    return (
      <div className="text-center text-destructive py-8">
        サマリーデータの取得に失敗しました
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          type="created"
          count={data?.created ?? 0}
          isLoading={isLoading}
        />
        <SummaryCard
          type="ready"
          count={data?.ready ?? 0}
          isLoading={isLoading}
        />
        <SummaryCard
          type="shipped_today"
          count={data?.shipped_today ?? 0}
          isLoading={isLoading}
        />
        <SummaryCard
          type="returned"
          count={data?.returned ?? 0}
          isLoading={isLoading}
        />
      </div>

      <ActionRequiredList onRowClick={handleRowClick} />

      <ShippingDetailSheet
        orderId={selectedOrderId}
        open={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}
