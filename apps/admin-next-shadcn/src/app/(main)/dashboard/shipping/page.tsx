import { Suspense } from "react";

import { Spinner } from "@/components/ui/spinner";

import { mockPriorityShipments, mockSummary } from "./_components/api";
import { KpiCards } from "./_components/kpi-cards";
import { PriorityList } from "./_components/priority-list";

// Server Component でデータを取得
async function getShippingData() {
  // TODO: 実際のAPIに接続する場合は以下を使用
  // const [summary, priorityShipments] = await Promise.all([
  //   fetchShippingSummary(),
  //   fetchPriorityShipments(5),
  // ]);

  // 開発用モックデータを使用
  return {
    summary: mockSummary,
    priorityShipments: mockPriorityShipments,
  };
}

export default async function ShippingDashboardPage() {
  const { summary, priorityShipments } = await getShippingData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">発送管理</h1>
        <p className="text-muted-foreground">発送状況の概要と要対応案件を確認できます</p>
      </div>

      <Suspense fallback={<LoadingCards />}>
        <KpiCards summary={summary} />
      </Suspense>

      <Suspense fallback={<LoadingList />}>
        <PriorityList shipments={priorityShipments} />
      </Suspense>
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
