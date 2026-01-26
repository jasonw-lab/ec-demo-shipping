'use client';

import { useSummary } from '../api';
import { SummaryCard } from './summary-card';
import { PriorityList } from './priority-list';

export function Dashboard() {
  const { data, isLoading, error } = useSummary();

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">
        サマリーデータの取得に失敗しました
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          ダッシュボード
        </h2>
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

      <PriorityList />
    </div>
  );
}
