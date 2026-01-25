"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ShippingStatus } from "../types";

type SummaryCardType = "created" | "ready" | "shipped_today" | "returned";

interface SummaryCardConfig {
  label: string;
  sublabel: string;
  filterStatus: ShippingStatus;
  colorClasses: {
    card: string;
    title: string;
    value: string;
    sublabel: string;
  };
}

const cardConfigs: Record<SummaryCardType, SummaryCardConfig> = {
  created: {
    label: "未着手",
    sublabel: "CREATED",
    filterStatus: "CREATED",
    colorClasses: {
      card: "",
      title: "text-muted-foreground",
      value: "",
      sublabel: "text-muted-foreground",
    },
  },
  ready: {
    label: "出荷作業待ち",
    sublabel: "READY",
    filterStatus: "READY",
    colorClasses: {
      card: "border-orange-300 bg-orange-50 hover:bg-orange-100",
      title: "text-orange-700",
      value: "text-orange-700",
      sublabel: "text-orange-600",
    },
  },
  shipped_today: {
    label: "本日出荷",
    sublabel: "SHIPPED TODAY",
    filterStatus: "SHIPPED",
    colorClasses: {
      card: "border-blue-200 bg-blue-50/50 hover:bg-blue-100/50",
      title: "text-blue-700",
      value: "text-blue-700",
      sublabel: "text-blue-600",
    },
  },
  returned: {
    label: "返送/トラブル",
    sublabel: "RETURNED",
    filterStatus: "RETURNED",
    colorClasses: {
      card: "border-red-200 bg-red-50/50 hover:bg-red-100/50",
      title: "text-red-700",
      value: "text-red-700",
      sublabel: "text-red-600",
    },
  },
};

interface SummaryCardProps {
  type: SummaryCardType;
  count: number;
  isLoading?: boolean;
}

export function SummaryCard({ type, count, isLoading }: SummaryCardProps) {
  const router = useRouter();
  const config = cardConfigs[type];

  const handleClick = () => {
    router.push(`/shipments?status=${config.filterStatus}`);
  };

  // Special case: READY with 0 count shows positive message
  const showPositiveMessage = type === "ready" && count === 0 && !isLoading;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:shadow-md",
        config.colorClasses.card
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", config.colorClasses.title)}>
          {config.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </>
        ) : showPositiveMessage ? (
          <>
            <div className={cn("text-lg font-semibold", config.colorClasses.value)}>
              全ての発送作業が完了しました
            </div>
          </>
        ) : (
          <>
            <div className={cn("text-3xl font-bold", config.colorClasses.value)}>
              {count}
            </div>
            <p className={cn("text-xs", config.colorClasses.sublabel)}>
              {config.sublabel}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
