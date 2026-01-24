import { Badge } from "@/components/ui/badge";
import type { ShippingStatus } from "../types";

const statusConfig: Record<
  ShippingStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CREATED: { label: "未着手", variant: "secondary" },
  READY: { label: "出荷待ち", variant: "default" },
  SHIPPED: { label: "出荷済", variant: "outline" },
  DELIVERED: { label: "配達完了", variant: "outline" },
  RETURNED: { label: "返送", variant: "destructive" },
  CANCELLED: { label: "キャンセル", variant: "secondary" },
};

interface StatusBadgeProps {
  status: ShippingStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "secondary" as const };

  return (
    <Badge
      variant={config.variant}
      className={
        status === "READY"
          ? "bg-orange-500 hover:bg-orange-600 text-white"
          : status === "SHIPPED" || status === "DELIVERED"
          ? "bg-green-500 hover:bg-green-600 text-white border-0"
          : undefined
      }
    >
      {config.label}
    </Badge>
  );
}
