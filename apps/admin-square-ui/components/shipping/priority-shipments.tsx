"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useShippingStore } from "@/store/shipping-store";
import { STATUS_LABELS, CARRIER_LABELS } from "@/mock-data/shipping";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  CREATED: "text-muted-foreground",
  READY: "text-blue-600",
  SHIPPED: "text-green-600",
  DELIVERED: "text-green-700",
  RETURNED: "text-red-600",
  CANCELLED: "text-muted-foreground",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}日前`;
  if (diffHours > 0) return `${diffHours}時間前`;
  if (diffMins > 0) return `${diffMins}分前`;
  return "たった今";
}

export function PriorityShipments() {
  const priorityShipments = useShippingStore((state) => state.priorityShipments);
  const setSelectedShipment = useShippingStore((state) => state.setSelectedShipment);

  if (priorityShipments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">要対応発送</h3>
        <p className="text-sm text-muted-foreground">対応が必要な発送はありません</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">要対応発送</h3>
          <p className="text-sm text-muted-foreground">優先度の高い順に表示（最大5件）</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/shipping/list?priority=true">
            すべて表示
            <ChevronRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>注文ID</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>配送業者</TableHead>
              <TableHead>理由</TableHead>
              <TableHead>更新日時</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {priorityShipments.slice(0, 5).map((shipment) => (
              <TableRow
                key={shipment.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedShipment(shipment)}
              >
                <TableCell className="font-medium">#{shipment.orderId}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium",
                      statusColors[shipment.status]
                    )}
                  >
                    {STATUS_LABELS[shipment.status]}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {CARRIER_LABELS[shipment.carrier] || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {shipment.priorityReason}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRelativeTime(shipment.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
