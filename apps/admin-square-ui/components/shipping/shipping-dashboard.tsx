"use client";

import { useEffect, useState } from "react";
import { Package, PackageCheck, PackageX, Truck, AlertCircle, Clock } from "lucide-react";
import { useShippingStore } from "@/store/shipping-store";
import { shippingApi, ShippingApiError } from "@/lib/api/shipping-client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Shipping } from "@/lib/types/shipping";
import { STATUS_LABELS, CARRIER_LABELS } from "@/lib/types/shipping";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  onClick?: () => void;
}

function SummaryCard({ title, value, icon, onClick }: SummaryCardProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow text-left w-full"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="size-12 rounded-lg bg-muted/50 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </button>
  );
}

interface PriorityShippingItemProps {
  shipping: Shipping;
  onClick: () => void;
}

function PriorityShippingItem({ shipping, onClick }: PriorityShippingItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "RETURNED":
        return "text-red-600 bg-red-50 border-red-200";
      case "CREATED":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "READY":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityIcon = (status: string) => {
    switch (status) {
      case "RETURNED":
        return <AlertCircle className="size-4 text-red-600" />;
      case "CREATED":
        return <Clock className="size-4 text-amber-600" />;
      case "READY":
        return <Package className="size-4 text-blue-600" />;
      default:
        return <Package className="size-4" />;
    }
  };

  const getCarrierLabel = (carrier: string | null): string => {
    if (!carrier) return "";
    const carrierMap: Record<string, string> = {
      YAMATO: "ヤマト運輸",
      SAGAWA: "佐川急便",
      JAPAN_POST: "日本郵便",
    };
    return carrierMap[carrier] || carrier;
  };

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-border bg-card p-4 hover:shadow-md transition-all text-left"
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${getStatusColor(shipping.status)}`}>
          {getPriorityIcon(shipping.status)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-mono text-sm font-semibold">{shipping.order_id}</p>
            <Badge variant={shipping.status === "RETURNED" ? "destructive" : "default"}>
              {STATUS_LABELS[shipping.status]}
            </Badge>
          </div>
          {shipping.carrier && (
            <p className="text-xs text-muted-foreground">
              {getCarrierLabel(shipping.carrier)}
              {shipping.tracking_number && ` • ${shipping.tracking_number}`}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(shipping.updated_at), {
              addSuffix: true,
              locale: ja,
            })}
          </p>
        </div>
      </div>
    </button>
  );
}

export function ShippingDashboard() {
  const { summary, setSummary, setFilter, setSelectedShipping } = useShippingStore();
  const [priorityShippings, setPriorityShippings] = useState<Shipping[]>([]);
  const [isLoadingPriority, setIsLoadingPriority] = useState(false);

  useEffect(() => {
    loadSummary();
    loadPriorityShippings();
  }, []);

  async function loadSummary() {
    try {
      const data = await shippingApi.getSummary();
      setSummary(data);
    } catch (error) {
      if (error instanceof ShippingApiError) {
        toast.error("サマリーの取得に失敗しました", {
          description: error.message,
        });
      } else {
        toast.error("サマリーの取得に失敗しました");
      }
    }
  }

  async function loadPriorityShippings() {
    setIsLoadingPriority(true);
    try {
      const data = await shippingApi.getPriority(5);
      setPriorityShippings(data);
    } catch (error) {
      if (error instanceof ShippingApiError) {
        toast.error("要対応発送リストの取得に失敗しました", {
          description: error.message,
        });
      } else {
        toast.error("要対応発送リストの取得に失敗しました");
      }
    } finally {
      setIsLoadingPriority(false);
    }
  }

  function handleCardClick(status: string) {
    setFilter({ status });
    window.location.href = "/shipping/list";
  }

  function handlePriorityItemClick(shipping: Shipping) {
    setSelectedShipping(shipping);
    window.location.href = "/shipping/list";
  }

  if (!summary) {
    return (
      <div className="w-full p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 h-24 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold">発送管理ダッシュボード</h2>
        <p className="text-sm text-muted-foreground mt-1">
          発送ステータス別の件数を確認できます
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="未着手"
          value={summary.created}
          icon={<Package className="size-6 text-amber-600" />}
          onClick={() => handleCardClick("CREATED")}
        />
        <SummaryCard
          title="出荷作業待ち"
          value={summary.ready}
          icon={<PackageCheck className="size-6 text-blue-600" />}
          onClick={() => handleCardClick("READY")}
        />
        <SummaryCard
          title="本日出荷"
          value={summary.shipped_today}
          icon={<Truck className="size-6 text-emerald-600" />}
          onClick={() => handleCardClick("SHIPPED")}
        />
        <SummaryCard
          title="返送/トラブル"
          value={summary.returned}
          icon={<PackageX className="size-6 text-red-600" />}
          onClick={() => handleCardClick("RETURNED")}
        />
      </div>

      {/* Priority Shippings */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">要対応発送リスト</h3>
              <p className="text-sm text-muted-foreground mt-1">
                優先度の高い発送を表示しています
              </p>
            </div>
            <AlertCircle className="size-5 text-muted-foreground" />
          </div>
        </div>
        <div className="p-4">
          {isLoadingPriority ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-4 h-20 animate-pulse"
                />
              ))}
            </div>
          ) : priorityShippings.length === 0 ? (
            <div className="text-center py-8">
              <PackageCheck className="size-12 mx-auto text-emerald-600 mb-3" />
              <p className="text-sm font-medium">全ての発送作業が完了しました</p>
              <p className="text-xs text-muted-foreground mt-1">
                優先対応が必要な発送はありません
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {priorityShippings.map((shipping) => (
                <PriorityShippingItem
                  key={shipping.id}
                  shipping={shipping}
                  onClick={() => handlePriorityItemClick(shipping)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
