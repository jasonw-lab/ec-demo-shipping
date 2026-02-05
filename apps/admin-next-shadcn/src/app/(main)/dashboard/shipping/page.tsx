"use client";

import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";

import { fetchPriorityShipmentsWithReason, fetchShippingSummary } from "./_components/api";
import { KpiCards } from "./_components/kpi-cards";
import { PriorityList } from "./_components/priority-list";
import type { PriorityShipment, ShippingSummary } from "./_components/types";

export default function ShippingDashboardPage() {
  const [summary, setSummary] = useState<ShippingSummary>({ created: 0, ready: 0, shipped_today: 0, returned: 0 });
  const [priorityShipments, setPriorityShipments] = useState<PriorityShipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryData, shipmentsData] = await Promise.all([
          fetchShippingSummary(),
          fetchPriorityShipmentsWithReason(5),
        ]);

        setSummary(summaryData);
        setPriorityShipments(shipmentsData);
      } catch (error) {
        console.error("Failed to fetch shipping data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">発送管理ダッシュボード</h1>
          <p className="text-muted-foreground">発送状況の概要と要対応案件を確認できます</p>
        </div>
        <LoadingCards />
        <LoadingList />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">発送管理</h1>
        <p className="text-muted-foreground">発送状況の概要と要対応案件を確認できます</p>
      </div>

      <KpiCards summary={summary} />
      <PriorityList shipments={priorityShipments} />
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

function LoadingList() {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border bg-card">
      <Spinner className="size-6" />
    </div>
  );
}
