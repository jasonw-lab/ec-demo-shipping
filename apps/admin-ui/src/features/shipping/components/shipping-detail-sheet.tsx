"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useShippingDetail, useUpdateShipping } from "../api";
import type { ApiError, ValidationError } from "../types";
import { ShippingInfo } from "./shipping-info";
import { StatusActionButton } from "./status-action-button";
import { ShipForm, type ShipFormData } from "./ship-form";

interface ShippingDetailSheetProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShippingDetailSheet({
  orderId,
  open,
  onOpenChange,
}: ShippingDetailSheetProps) {
  const {
    data: shipping,
    isLoading,
    error,
    refetch,
  } = useShippingDetail(orderId);

  const updateMutation = useUpdateShipping();

  // Handle 404 error - close sheet
  useEffect(() => {
    const apiError = error as unknown as ApiError | null;
    if (apiError && apiError.status === 404) {
      toast.error("データが見つかりません");
      onOpenChange(false);
    }
  }, [error, onOpenChange]);

  const handleStatusUpdate = async (
    newStatus: "READY" | "SHIPPED" | "DELIVERED",
    additionalData?: { carrier?: string; tracking_number?: string }
  ) => {
    if (!shipping) return;

    try {
      await updateMutation.mutateAsync({
        orderId: shipping.order_id,
        data: {
          status: newStatus,
          version: shipping.version,
          ...additionalData,
        },
      });
      toast.success("ステータスを更新しました");
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 409) {
        toast.error(
          "データの競合が発生しました。他のユーザーが既に更新しています。",
          {
            action: {
              label: "最新情報を読み込む",
              onClick: () => refetch(),
            },
          }
        );
        refetch();
      } else if (apiError.status === 404) {
        toast.error("データが見つかりません");
        onOpenChange(false);
      } else if (apiError.status === 400) {
        toast.error(apiError.message || "入力内容に誤りがあります");
      } else {
        toast.error("更新に失敗しました");
      }
    }
  };

  const handleReadyClick = () => handleStatusUpdate("READY");
  const handleDeliveredClick = () => handleStatusUpdate("DELIVERED");

  const handleShipSubmit = (data: ShipFormData) => {
    handleStatusUpdate("SHIPPED", {
      carrier: data.carrier,
      tracking_number: data.tracking_number,
    });
  };

  const mutationError = updateMutation.error as unknown as ApiError | null;
  const serverErrors: ValidationError[] =
    mutationError && mutationError.errors ? mutationError.errors : [];

  // Cast error to check status
  const fetchError = error as unknown as ApiError | null;
  const showError = fetchError && fetchError.status !== 404;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>発送詳細</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : shipping ? (
            <>
              <ShippingInfo shipping={shipping} />

              {/* Status-specific actions */}
              <div className="pt-4 border-t space-y-4">
                {shipping.status === "READY" ? (
                  <ShipForm
                    onSubmit={handleShipSubmit}
                    isLoading={updateMutation.isPending}
                    serverErrors={serverErrors}
                  />
                ) : (
                  <StatusActionButton
                    currentStatus={shipping.status}
                    isLoading={updateMutation.isPending}
                    onReadyClick={handleReadyClick}
                    onDeliveredClick={handleDeliveredClick}
                  />
                )}
              </div>
            </>
          ) : showError ? (
            <div className="text-center text-destructive py-8">
              データの取得に失敗しました
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
