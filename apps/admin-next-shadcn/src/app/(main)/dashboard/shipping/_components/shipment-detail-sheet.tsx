"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  AlertCircle,
  ArrowRight,
  Box,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  History,
  MapPin,
  Package,
  Truck,
  User,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { getMockAuditLogs, getMockTimeline } from "./api";
import type { AuditLog, Shipment, TimelineEvent } from "./types";
import { CARRIER_LABELS, CARRIER_TRACKING_URLS, STATUS_LABELS, STATUS_VARIANTS } from "./types";

interface ShipmentDetailSheetProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ステータスアイコンマッピング
const STATUS_ICONS = {
  CREATED: AlertCircle,
  READY: CheckCircle2,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  RETURNED: XCircle,
  CANCELLED: XCircle,
};

// ステータスグラデーションカラー
const STATUS_GRADIENTS = {
  CREATED: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  READY: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  SHIPPED: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  DELIVERED: "from-green-500/10 to-green-500/5 border-green-500/20",
  RETURNED: "from-red-500/10 to-red-500/5 border-red-500/20",
  CANCELLED: "from-gray-500/10 to-gray-500/5 border-gray-500/20",
};

const STATUS_ICON_COLORS = {
  CREATED: "text-amber-600 dark:text-amber-400",
  READY: "text-blue-600 dark:text-blue-400",
  SHIPPED: "text-emerald-600 dark:text-emerald-400",
  DELIVERED: "text-green-600 dark:text-green-400",
  RETURNED: "text-red-600 dark:text-red-400",
  CANCELLED: "text-gray-600 dark:text-gray-400",
};

export function ShipmentDetailSheet({ shipment, open, onOpenChange }: ShipmentDetailSheetProps) {
  if (!shipment) return null;

  const timeline = getMockTimeline(shipment.id);
  const auditLogs = getMockAuditLogs(shipment.id);
  const trackingUrl =
    shipment.carrier && shipment.tracking_number
      ? CARRIER_TRACKING_URLS[shipment.carrier] + shipment.tracking_number
      : null;

  const StatusIcon = STATUS_ICONS[shipment.status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-hidden sm:max-w-4xl">
        {/* ヘッダー - グラデーション背景 */}
        <SheetHeader className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 pb-8">
          <div className="absolute right-0 top-0 size-32 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-24 rounded-full bg-primary/5 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="rounded-xl bg-primary p-2.5 shadow-lg shadow-primary/20">
                  <Package className="size-6 text-primary-foreground" />
                </div>
                <span>発送詳細 #{shipment.order_id}</span>
              </SheetTitle>
              <SheetDescription className="text-base">発送情報と履歴を確認できます</SheetDescription>
            </div>
            <Badge
              variant={STATUS_VARIANTS[shipment.status]}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold shadow-sm"
            >
              <StatusIcon className="size-4" />
              {STATUS_LABELS[shipment.status]}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] px-6 pr-10">
          <div className="space-y-8 py-6">
            {/* ステータスカード - 大きく目立つ */}
            <Card className={`border-2 bg-gradient-to-br shadow-lg ${STATUS_GRADIENTS[shipment.status]}`}>
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className={`rounded-2xl bg-background p-5 shadow-inner ${STATUS_ICON_COLORS[shipment.status]}`}>
                    <StatusIcon className="size-12" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">現在のステータス</p>
                    <p className="text-2xl font-bold">{STATUS_LABELS[shipment.status]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">バージョン</p>
                    <p className="font-mono text-3xl font-bold">{shipment.version}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2カラムレイアウト：配送情報と配送先 */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* 配送情報カード */}
              <Card className="border-2 shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <Truck className="size-5 text-primary" />
                    </div>
                    配送情報
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
                    <Box className="size-6 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">配送業者</p>
                      <p className="font-semibold">
                        {shipment.carrier ? CARRIER_LABELS[shipment.carrier] || shipment.carrier : "-"}
                      </p>
                    </div>
                  </div>

                  {trackingUrl ? (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between rounded-lg border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">追跡番号</p>
                        <p className="font-mono text-sm font-semibold text-primary">{shipment.tracking_number}</p>
                      </div>
                      <ExternalLink className="size-5 text-primary transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed bg-muted/30 p-4">
                      <p className="text-xs text-muted-foreground">追跡番号</p>
                      <p className="font-mono text-sm text-muted-foreground">未設定</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 配送先住所カード */}
              <Card className="border-2 shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <MapPin className="size-5 text-primary" />
                    </div>
                    配送先住所
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-muted/50 p-5">
                    <p className="leading-relaxed">{shipment.shipping_address}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* タイムラインと監査ログ */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* タイムラインカード */}
              <Card className="border-2 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <History className="size-5 text-primary" />
                    </div>
                    ステータス履歴
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeline.length > 0 ? (
                    <Timeline events={timeline} />
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 py-8">
                      <Clock className="mb-2 size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">履歴がありません</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 監査ログカード */}
              <Card className="border-2 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <FileText className="size-5 text-primary" />
                    </div>
                    監査ログ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLogs.length > 0 ? (
                    <AuditLogList logs={auditLogs} />
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 py-8">
                      <FileText className="mb-2 size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">ログがありません</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* アクションカード */}
            <Card className="border-2 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">アクション</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {shipment.status === "CREATED" && (
                    <Button size="lg" className="flex-1 shadow-md">
                      <CheckCircle2 className="mr-2 size-5" />
                      出荷指示
                    </Button>
                  )}
                  {shipment.status === "READY" && (
                    <Button size="lg" className="flex-1 shadow-md">
                      <Truck className="mr-2 size-5" />
                      発送完了
                    </Button>
                  )}
                  {shipment.status === "SHIPPED" && (
                    <Button size="lg" variant="destructive" className="flex-1 shadow-md">
                      <XCircle className="mr-2 size-5" />
                      返送処理
                    </Button>
                  )}
                  {(shipment.status === "CREATED" || shipment.status === "READY") && (
                    <Button size="lg" variant="outline" className="flex-1">
                      <XCircle className="mr-2 size-5" />
                      キャンセル
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative space-y-4 pl-7">
      <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-muted" />
      {events.map((event, index) => {
        const StatusIcon = STATUS_ICONS[event.status];
        const isLatest = index === events.length - 1;

        return (
          <div key={event.id} className="relative group">
            <div
              className={`absolute -left-5 top-2 flex size-5 items-center justify-center rounded-full border-2 transition-all ${
                isLatest
                  ? "border-primary bg-primary shadow-lg shadow-primary/30 scale-110"
                  : "border-muted bg-background group-hover:border-primary/50"
              }`}
            >
              <StatusIcon className={`size-2.5 ${isLatest ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div className="rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant={STATUS_VARIANTS[event.status]} className="text-xs">
                  {STATUS_LABELS[event.status]}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {format(new Date(event.timestamp), "MM/dd HH:mm", { locale: ja })}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <User className="size-3 text-muted-foreground" />
                <span className="font-medium">{event.actor}</span>
              </div>
              {event.note && (
                <div className="mt-2 rounded-md bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">{event.note}</p>
                </div>
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
        <div key={log.id} className="group rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{log.action}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {format(new Date(log.timestamp), "MM/dd HH:mm", { locale: ja })}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="size-3" />
            {log.actor}
          </div>
          {log.changes && (
            <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-2">
              {Object.entries(log.changes).map(([key, value]) => (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive line-through">
                    {value.old}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary font-medium">{value.new}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
