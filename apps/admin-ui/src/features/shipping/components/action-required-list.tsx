"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronRight, Truck } from "lucide-react";
import { usePriorityShipments } from "../api";
import { StatusBadge } from "./status-badge";
import type { Carrier, PriorityShipping } from "../types";

const carrierLabels: Record<Carrier, string> = {
  YAMATO: "ヤマト運輸",
  SAGAWA: "佐川急便",
  JAPAN_POST: "日本郵便",
};

const priorityReasonLabels: Record<PriorityShipping["priority_reason"], string> = {
  RETURNED: "返送/トラブル",
  CREATED_STALE: "24h超過",
  READY_OLD: "滞留中",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}日前`;
  if (diffHour > 0) return `${diffHour}時間前`;
  if (diffMin > 0) return `${diffMin}分前`;
  return "たった今";
}

interface ActionRequiredListProps {
  onRowClick?: (orderId: string) => void;
}

export function ActionRequiredList({ onRowClick }: ActionRequiredListProps) {
  const router = useRouter();
  const { data, isLoading, error } = usePriorityShipments(5);

  const handleViewAll = () => {
    router.push("/shipments?status=");
  };

  // Don't render if no data or error (graceful degradation)
  // Handle both array response and {data: []} response formats
  const items = Array.isArray(data) ? data : (data as any)?.data;

  if (error || (!isLoading && (!items || items.length === 0))) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          要対応発送
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm"
          onClick={handleViewAll}
        >
          すべて表示
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">注文ID</TableHead>
                  <TableHead className="w-[100px]">ステータス</TableHead>
                  <TableHead className="w-[120px]">配送業者</TableHead>
                  <TableHead className="w-[80px]">更新</TableHead>
                  <TableHead className="w-[80px]">理由</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((shipping: PriorityShipping) => (
                  <TableRow
                    key={shipping.order_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onRowClick?.(shipping.order_id)}
                  >
                    <TableCell className="font-mono text-sm">
                      {shipping.order_id}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={shipping.status} />
                    </TableCell>
                    <TableCell>
                      {shipping.carrier ? (
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          <span className="text-sm">
                            {carrierLabels[shipping.carrier as Carrier] ||
                              shipping.carrier}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatRelativeTime(shipping.updated_at)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          shipping.priority_reason === "RETURNED"
                            ? "bg-red-100 text-red-700"
                            : shipping.priority_reason === "CREATED_STALE"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {priorityReasonLabels[shipping.priority_reason]}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
