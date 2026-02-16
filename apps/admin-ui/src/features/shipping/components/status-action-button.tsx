"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShippingStatus } from "../types";

const statusLabels: Record<ShippingStatus, string> = {
  CREATED: "未着手",
  READY: "出荷準備完了",
  SHIPPED: "出荷済",
  DELIVERED: "配達完了",
  RETURNED: "返送",
  CANCELLED: "キャンセル",
};

// Define allowed next statuses for each current status
const allowedTransitions: Partial<Record<ShippingStatus, ShippingStatus[]>> = {
  CREATED: ["READY"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
};

interface StatusActionButtonProps {
  currentStatus: ShippingStatus;
  isLoading?: boolean;
  onStatusChange?: (newStatus: ShippingStatus) => void;
}

export function StatusActionButton({
  currentStatus,
  isLoading,
  onStatusChange,
}: StatusActionButtonProps) {
  const [selectedStatus, setSelectedStatus] = useState<ShippingStatus>(currentStatus);

  const nextStatuses = allowedTransitions[currentStatus];

  // No transitions available
  if (!nextStatuses || nextStatuses.length === 0) {
    return null;
  }

  const handleChange = () => {
    if (selectedStatus === currentStatus) return;
    onStatusChange?.(selectedStatus);
  };

  const isChanged = selectedStatus !== currentStatus;
  const isReturned = selectedStatus === "RETURNED";

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          ステータス変更
        </label>
        <Select
          value={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value as ShippingStatus)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={currentStatus}>
              {statusLabels[currentStatus]}（現在）
            </SelectItem>
            {nextStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleChange}
        disabled={isLoading || !isChanged}
        className="w-full"
        variant={isReturned ? "destructive" : "default"}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {isReturned ? "返送処理を実行" : "ステータスを変更"}
      </Button>
    </div>
  );
}
