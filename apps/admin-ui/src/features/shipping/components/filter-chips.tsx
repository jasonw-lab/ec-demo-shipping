"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Carrier, ShippingStatus } from "../types";

const statusLabels: Record<ShippingStatus, string> = {
  CREATED: "未着手",
  READY: "出荷待ち",
  SHIPPED: "出荷済",
  DELIVERED: "配達完了",
  RETURNED: "返送",
  CANCELLED: "キャンセル",
};

const carrierLabels: Record<Carrier, string> = {
  YAMATO: "ヤマト運輸",
  SAGAWA: "佐川急便",
  JAPAN_POST: "日本郵便",
};

interface FilterChipsProps {
  status: ShippingStatus | "";
  carrier: Carrier | "";
  keyword: string;
  onRemoveStatus: () => void;
  onRemoveCarrier: () => void;
  onRemoveKeyword: () => void;
}

export function FilterChips({
  status,
  carrier,
  keyword,
  onRemoveStatus,
  onRemoveCarrier,
  onRemoveKeyword,
}: FilterChipsProps) {
  const hasFilters = status || carrier || keyword;

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status && (
        <Badge variant="secondary" className="gap-1 pr-1">
          ステータス: {statusLabels[status]}
          <button
            onClick={onRemoveStatus}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {carrier && (
        <Badge variant="secondary" className="gap-1 pr-1">
          配送業者: {carrierLabels[carrier]}
          <button
            onClick={onRemoveCarrier}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {keyword && (
        <Badge variant="secondary" className="gap-1 pr-1">
          検索: {keyword}
          <button
            onClick={onRemoveKeyword}
            className="ml-1 rounded-full hover:bg-muted p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}
