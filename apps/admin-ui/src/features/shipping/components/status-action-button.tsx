"use client";

import { Loader2, PackageCheck, Truck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShippingStatus } from "../types";

interface StatusActionButtonProps {
  currentStatus: ShippingStatus;
  isLoading?: boolean;
  onReadyClick?: () => void;
  onDeliveredClick?: () => void;
}

export function StatusActionButton({
  currentStatus,
  isLoading,
  onReadyClick,
  onDeliveredClick,
}: StatusActionButtonProps) {
  if (currentStatus === "CREATED") {
    return (
      <Button
        onClick={onReadyClick}
        disabled={isLoading}
        className="w-full"
        variant="default"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <PackageCheck className="mr-2 h-4 w-4" />
        )}
        出荷準備完了
      </Button>
    );
  }

  if (currentStatus === "SHIPPED") {
    return (
      <Button
        onClick={onDeliveredClick}
        disabled={isLoading}
        className="w-full"
        variant="default"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4" />
        )}
        配達完了
      </Button>
    );
  }

  return null;
}
