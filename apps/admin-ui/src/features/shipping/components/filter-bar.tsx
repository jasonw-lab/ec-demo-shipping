"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { Carrier, ShippingStatus } from "../types";

interface FilterBarProps {
  status: ShippingStatus | "";
  carrier: Carrier | "";
  keyword: string;
  onStatusChange: (status: ShippingStatus | "") => void;
  onCarrierChange: (carrier: Carrier | "") => void;
  onKeywordChange: (keyword: string) => void;
  onReset: () => void;
}

const ALL_VALUE = "__all__";

const statusOptions: { value: string; label: string }[] = [
  { value: ALL_VALUE, label: "全て" },
  { value: "CREATED", label: "未着手" },
  { value: "READY", label: "出荷待ち" },
  { value: "SHIPPED", label: "出荷済" },
  { value: "DELIVERED", label: "配達完了" },
  { value: "RETURNED", label: "返送" },
  { value: "CANCELLED", label: "キャンセル" },
];

const carrierOptions: { value: string; label: string }[] = [
  { value: ALL_VALUE, label: "全て" },
  { value: "YAMATO", label: "ヤマト運輸" },
  { value: "SAGAWA", label: "佐川急便" },
  { value: "JAPAN_POST", label: "日本郵便" },
];

export function FilterBar({
  status,
  carrier,
  keyword,
  onStatusChange,
  onCarrierChange,
  onKeywordChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select
        value={status || ALL_VALUE}
        onValueChange={(value) =>
          onStatusChange(value === ALL_VALUE ? "" : (value as ShippingStatus))
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="ステータス" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={carrier || ALL_VALUE}
        onValueChange={(value) =>
          onCarrierChange(value === ALL_VALUE ? "" : (value as Carrier))
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="配送業者" />
        </SelectTrigger>
        <SelectContent>
          {carrierOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="注文ID / 追跡番号で検索..."
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Button variant="outline" onClick={onReset}>
        <X className="mr-2 h-4 w-4" />
        リセット
      </Button>
    </div>
  );
}
