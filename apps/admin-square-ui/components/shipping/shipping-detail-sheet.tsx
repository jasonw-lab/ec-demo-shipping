"use client";

import {
  ExternalLink,
  MapPin,
  Package,
  Truck,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useShippingStore } from "@/store/shipping-store";
import { cn } from "@/lib/utils";
import type { ShippingStatus, TimelineEvent, AuditLog } from "@/mock-data/shipping";
import { STATUS_LABELS, CARRIER_LABELS, CARRIER_TRACKING_URLS } from "@/mock-data/shipping";

const statusIcons: Record<ShippingStatus, React.ElementType> = {
  CREATED: Clock,
  READY: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  RETURNED: AlertTriangle,
  CANCELLED: XCircle,
};

const statusColors: Record<ShippingStatus, string> = {
  CREATED: "text-muted-foreground bg-muted",
  READY: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  SHIPPED: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
  DELIVERED: "text-green-600 bg-green-100 dark:bg-green-900/30",
  RETURNED: "text-red-600 bg-red-100 dark:bg-red-900/30",
  CANCELLED: "text-muted-foreground bg-muted",
};

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ShippingDetailSheet() {
  const selectedShipment = useShippingStore((state) => state.selectedShipment);
  const setSelectedShipment = useShippingStore((state) => state.setSelectedShipment);
  const getTimeline = useShippingStore((state) => state.getTimeline);
  const getAuditLogs = useShippingStore((state) => state.getAuditLogs);

  if (!selectedShipment) return null;

  const timeline = getTimeline(selectedShipment.id);
  const auditLogs = getAuditLogs(selectedShipment.id);
  const trackingUrl =
    selectedShipment.carrier && selectedShipment.trackingNumber
      ? CARRIER_TRACKING_URLS[selectedShipment.carrier] + selectedShipment.trackingNumber
      : null;

  const StatusIcon = statusIcons[selectedShipment.status];

  return (
    <Sheet open={!!selectedShipment} onOpenChange={(open) => !open && setSelectedShipment(null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="size-5" />
            発送詳細 #{selectedShipment.orderId}
          </SheetTitle>
          <SheetDescription>発送情報と履歴を確認できます</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
          {/* ステータスカード */}
          <div
            className={cn(
              "rounded-xl border-2 p-6",
              statusColors[selectedShipment.status]
            )}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-background p-4 shadow-sm">
                <StatusIcon className="size-8" />
              </div>
              <div className="flex-1">
                <p className="text-sm opacity-70">現在のステータス</p>
                <p className="text-xl font-bold">{STATUS_LABELS[selectedShipment.status]}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-70">バージョン</p>
                <p className="font-mono text-2xl font-bold">{selectedShipment.version}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 配送情報 */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm">
              <Truck className="size-4" />
              配送情報
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground">配送業者</span>
                <span className="font-medium">
                  {CARRIER_LABELS[selectedShipment.carrier] || "-"}
                </span>
              </div>
              {trackingUrl ? (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 p-3 transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="text-xs text-muted-foreground">追跡番号</p>
                    <p className="font-mono text-sm font-medium text-primary">
                      {selectedShipment.trackingNumber}
                    </p>
                  </div>
                  <ExternalLink className="size-4 text-primary" />
                </a>
              ) : (
                <div className="rounded-lg border-2 border-dashed bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">追跡番号</p>
                  <p className="font-mono text-sm text-muted-foreground">未設定</p>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* 配送先住所 */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm">
              <MapPin className="size-4" />
              配送先住所
            </h3>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm leading-relaxed">{selectedShipment.shippingAddress}</p>
            </div>
          </section>

          <Separator />

          {/* タイムライン */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm">
              <Clock className="size-4" />
              ステータス履歴
            </h3>
            {timeline.length > 0 ? (
              <Timeline events={timeline} />
            ) : (
              <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
                <Clock className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">履歴がありません</p>
              </div>
            )}
          </section>

          <Separator />

          {/* 監査ログ */}
          <section>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-sm">
              <FileText className="size-4" />
              監査ログ
            </h3>
            {auditLogs.length > 0 ? (
              <AuditLogList logs={auditLogs} />
            ) : (
              <div className="rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center">
                <FileText className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">ログがありません</p>
              </div>
            )}
          </section>

          <Separator />

          {/* アクション */}
          <section>
            <h3 className="mb-3 font-semibold text-sm">アクション</h3>
            <div className="flex flex-wrap gap-2">
              {selectedShipment.status === "CREATED" && (
                <Button className="flex-1">
                  <CheckCircle2 className="mr-2 size-4" />
                  出荷指示
                </Button>
              )}
              {selectedShipment.status === "READY" && (
                <Button className="flex-1">
                  <Truck className="mr-2 size-4" />
                  発送完了
                </Button>
              )}
              {selectedShipment.status === "SHIPPED" && (
                <Button variant="destructive" className="flex-1">
                  <XCircle className="mr-2 size-4" />
                  返送処理
                </Button>
              )}
              {(selectedShipment.status === "CREATED" || selectedShipment.status === "READY") && (
                <Button variant="outline" className="flex-1">
                  <XCircle className="mr-2 size-4" />
                  キャンセル
                </Button>
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative space-y-4 pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
      {events.map((event, index) => {
        const StatusIcon = statusIcons[event.status];
        const isLatest = index === events.length - 1;

        return (
          <div key={event.id} className="relative">
            <div
              className={cn(
                "absolute -left-4 top-1 flex size-4 items-center justify-center rounded-full border-2",
                isLatest
                  ? "border-primary bg-primary"
                  : "border-muted bg-background"
              )}
            >
              <StatusIcon
                className={cn(
                  "size-2",
                  isLatest ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                    statusColors[event.status]
                  )}
                >
                  {STATUS_LABELS[event.status]}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {formatDateTime(event.timestamp)}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <User className="size-3 text-muted-foreground" />
                <span>{event.actor}</span>
              </div>
              {event.note && (
                <p className="mt-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                  {event.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AuditLogList({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{log.action}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {formatDateTime(log.timestamp)}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <User className="size-3" />
            {log.actor}
          </div>
          {log.changes && (
            <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-2">
              {Object.entries(log.changes).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="rounded bg-red-100 px-1 text-red-600 line-through dark:bg-red-900/30">
                    {value.old}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span className="rounded bg-green-100 px-1 font-medium text-green-600 dark:bg-green-900/30">
                    {value.new}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
