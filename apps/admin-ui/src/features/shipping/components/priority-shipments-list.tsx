"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { usePriorityShippings } from "../api";
import { StatusBadge } from "./status-badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export function PriorityShippingsList() {
  const { data, isLoading, error } = usePriorityShippings(5);

  // Don't show the component if there are no priority items
  if (!isLoading && (!data || data.length === 0)) {
    return null;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">要対応発送</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-4">
            データの取得に失敗しました
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">要対応発送</CardTitle>
        <Link
          href="/shipments"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          すべて表示
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {data?.map((shipping) => (
              <Link
                key={shipping.id}
                href={`/shipments?order_id=${shipping.order_id}`}
                className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">
                      {shipping.order_id}
                    </span>
                    <StatusBadge status={shipping.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {shipping.carrier && (
                      <span className="font-medium">{shipping.carrier}</span>
                    )}
                    <span>
                      {format(new Date(shipping.updated_at), "M/d HH:mm", {
                        locale: ja,
                      })}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
