"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useBulkUpdate } from "../api";
import type { Shipping, ShippingStatus, BulkUpdateResponse } from "../types";

const statusOptions: { value: ShippingStatus; label: string }[] = [
  { value: "READY", label: "出荷待ちに変更" },
  { value: "SHIPPED", label: "出荷済に変更" },
  { value: "DELIVERED", label: "配達完了に変更" },
  { value: "RETURNED", label: "返送に変更" },
];

interface BulkActionsProps {
  selectedItems: Shipping[];
  onClearSelection: () => void;
  onUpdateComplete?: (response: BulkUpdateResponse) => void;
}

export function BulkActions({
  selectedItems,
  onClearSelection,
  onUpdateComplete,
}: BulkActionsProps) {
  const bulkUpdateMutation = useBulkUpdate();

  const handleBulkStatusChange = async (newStatus: ShippingStatus) => {
    if (selectedItems.length === 0) return;

    try {
      const response = await bulkUpdateMutation.mutateAsync({
        items: selectedItems.map((item) => ({
          order_id: item.order_id,
          status: newStatus,
          version: item.version,
        })),
      });

      if (response.failure_count > 0) {
        toast.warning(
          `${response.success_count}件成功、${response.failure_count}件失敗`,
          {
            description: "一部の更新に失敗しました。詳細を確認してください。",
          }
        );
      } else {
        toast.success(`${response.success_count}件のステータスを更新しました`);
        onClearSelection();
      }

      onUpdateComplete?.(response);
    } catch {
      toast.error("一括更新に失敗しました");
    }
  };

  const handleExportCSV = () => {
    if (selectedItems.length === 0) return;

    const headers = [
      "注文ID",
      "ステータス",
      "配送業者",
      "追跡番号",
      "配送先住所",
      "作成日時",
      "更新日時",
    ];

    const rows = selectedItems.map((item) => [
      item.order_id,
      item.status,
      item.carrier || "",
      item.tracking_number || "",
      `"${item.shipping_address.replace(/"/g, '""')}"`,
      item.created_at,
      item.updated_at,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shippings_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`${selectedItems.length}件をCSVに出力しました`);
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
      <span className="text-sm font-medium">
        {selectedItems.length}件選択中
      </span>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={bulkUpdateMutation.isPending}
          >
            {bulkUpdateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            ステータス変更
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>一括ステータス変更</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleBulkStatusChange(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" onClick={handleExportCSV}>
        <Download className="mr-2 h-4 w-4" />
        CSV出力
      </Button>

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        選択解除
      </Button>
    </div>
  );
}
