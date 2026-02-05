"use client";

import { useState, useEffect } from "react";
import {
  ExternalLink,
  Package,
  MapPin,
  Calendar,
  Loader2,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { useShippingStore } from "@/store/shipping-store";
import { shippingApi, ShippingApiError } from "@/lib/api/shipping-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Shipping, Carrier, UpdateShippingRequest, ShippingStatus } from "@/lib/types/shipping";
import {
  STATUS_LABELS,
  CARRIER_LABELS,
  getTrackingUrl,
  validateTrackingNumber,
  TRACKING_ERROR_MESSAGES,
} from "@/lib/types/shipping";

interface ShippingDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Status gradients for visual hierarchy
const STATUS_GRADIENTS: Record<ShippingStatus, string> = {
  CREATED: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  READY: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  SHIPPED: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  DELIVERED: "from-green-500/10 to-green-500/5 border-green-500/20",
  RETURNED: "from-red-500/10 to-red-500/5 border-red-500/20",
  CANCELLED: "from-gray-500/10 to-gray-500/5 border-gray-500/20",
};

// Status icons
const STATUS_ICONS: Record<ShippingStatus, React.ReactNode> = {
  CREATED: <Package className="size-10 text-amber-600" />,
  READY: <Clock className="size-10 text-blue-600" />,
  SHIPPED: <Truck className="size-10 text-emerald-600" />,
  DELIVERED: <CheckCircle2 className="size-10 text-green-600" />,
  RETURNED: <XCircle className="size-10 text-red-600" />,
  CANCELLED: <AlertCircle className="size-10 text-gray-600" />,
};

export function ShippingDetailSheet({ open, onOpenChange }: ShippingDetailSheetProps) {
  const { selectedShipping, setSelectedShipping, updateShipping } = useShippingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    carrier: Carrier | "";
    tracking_number: string;
  }>({
    carrier: "",
    tracking_number: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedShipping) {
      setFormData({
        carrier: (selectedShipping.carrier as Carrier) || "",
        tracking_number: selectedShipping.tracking_number || "",
      });
      setErrors({});
    }
  }, [selectedShipping]);

  async function handleReload() {
    if (!selectedShipping) return;
    try {
      const updated = await shippingApi.getDetail(selectedShipping.order_id);
      setSelectedShipping(updated);
      updateShipping(updated);
      toast.success("最新情報を読み込みました");
    } catch (error) {
      if (error instanceof ShippingApiError) {
        toast.error("再読み込みに失敗しました", {
          description: error.message,
        });
      }
    }
  }

  async function handleSubmit(newStatus: string) {
    if (!selectedShipping) return;

    // Validate
    const newErrors: Record<string, string> = {};

    if (!formData.carrier) {
      newErrors.carrier = "配送業者を選択してください";
    }

    if (!formData.tracking_number) {
      newErrors.tracking_number = "追跡番号を入力してください";
    } else if (formData.carrier && !validateTrackingNumber(formData.carrier as Carrier, formData.tracking_number)) {
      newErrors.tracking_number = TRACKING_ERROR_MESSAGES[formData.carrier as Carrier];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const request: UpdateShippingRequest = {
        status: newStatus as any,
        carrier: formData.carrier as Carrier,
        tracking_number: formData.tracking_number,
        version: selectedShipping.version,
      };

      const updated = await shippingApi.update(selectedShipping.order_id, request);
      setSelectedShipping(updated);
      updateShipping(updated);
      toast.success("発送情報を更新しました");
    } catch (error) {
      if (error instanceof ShippingApiError) {
        if (error.status === 409) {
          toast.error("データの競合が発生しました", {
            description: "他のユーザーが既に更新しています。",
            action: {
              label: "最新情報を読み込む",
              onClick: handleReload,
            },
          });
        } else if (error.status === 400) {
          const validationError = error.data as any;
          if (validationError?.errors) {
            const fieldErrors: Record<string, string> = {};
            validationError.errors.forEach((err: any) => {
              fieldErrors[err.field] = err.reason;
            });
            setErrors(fieldErrors);
          }
          toast.error("入力内容を確認してください");
        } else {
          toast.error("更新に失敗しました", {
            description: error.message,
          });
        }
      } else {
        toast.error("更新に失敗しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!selectedShipping) return null;

  const canEdit = selectedShipping.status === "READY" || selectedShipping.status === "SHIPPED";
  const isReady = selectedShipping.status === "READY";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl overflow-y-auto">
        {/* Header with gradient background */}
        <SheetHeader className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 mb-6">
          {/* Decorative blur elements */}
          <div className="absolute top-0 right-0 size-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 size-24 bg-primary/10 rounded-full blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-background p-3 shadow-lg shadow-primary/20">
                <Package className="size-8 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-2xl">発送詳細</SheetTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  {selectedShipping.order_id}
                </p>
              </div>
            </div>
            <Badge
              variant={selectedShipping.status === "READY" ? "default" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {STATUS_LABELS[selectedShipping.status]}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status Card with gradient */}
          <div className={`rounded-2xl border-2 bg-gradient-to-br ${STATUS_GRADIENTS[selectedShipping.status]} p-6 shadow-md hover:shadow-lg transition-shadow`}>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-background/50 p-4 shadow-inner">
                {STATUS_ICONS[selectedShipping.status]}
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">現在のステータス</p>
                <p className="text-2xl font-bold mt-1">
                  {STATUS_LABELS[selectedShipping.status]}
                </p>
              </div>
            </div>
          </div>

          {/* Two column layout for info cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shipping Address */}
            <div className="rounded-lg border-2 bg-card p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-muted/50 p-2">
                  <MapPin className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-2">配送先住所</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedShipping.shipping_address}
                  </p>
                </div>
              </div>
            </div>

            {/* Carrier Info */}
            {selectedShipping.carrier && (
              <div className="rounded-lg border-2 bg-card p-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <Truck className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold mb-2">配送情報</p>
                    <p className="text-sm text-muted-foreground">
                      {CARRIER_LABELS[selectedShipping.carrier as Carrier]}
                    </p>
                    {selectedShipping.tracking_number && (
                      <p className="text-sm font-mono mt-1">
                        {selectedShipping.tracking_number}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-lg border-2 bg-card p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="size-5 text-primary" />
              <p className="text-sm font-semibold">タイムライン</p>
            </div>

            <div className="relative space-y-4 pl-6">
              {/* Gradient timeline line */}
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-muted" />

              {/* Timeline events */}
              {[
                { label: "作成日時", date: selectedShipping.created_at, icon: <Package className="size-4" /> },
                selectedShipping.ready_at && { label: "出荷指示", date: selectedShipping.ready_at, icon: <Clock className="size-4" /> },
                selectedShipping.shipped_at && { label: "出荷完了", date: selectedShipping.shipped_at, icon: <Truck className="size-4" /> },
                selectedShipping.delivered_at && { label: "配送完了", date: selectedShipping.delivered_at, icon: <CheckCircle2 className="size-4" /> },
              ].filter(Boolean).map((event: any, index, arr) => (
                <div key={index} className="relative flex items-start gap-3">
                  <div className={`absolute left-[-1.25rem] rounded-full bg-primary border-4 border-background p-1.5 ${index === arr.length - 1 ? 'scale-110 shadow-lg shadow-primary/30' : ''}`}>
                    {event.icon}
                  </div>
                  <div className="flex-1 rounded-lg border bg-card p-3 hover:shadow-md transition-shadow ml-4">
                    <p className="text-xs text-muted-foreground">{event.label}</p>
                    <p className="text-sm font-mono mt-1">
                      {format(new Date(event.date), "yyyy/MM/dd HH:mm", { locale: ja })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Link (for SHIPPED) */}
          {selectedShipping.status === "SHIPPED" && selectedShipping.carrier && selectedShipping.tracking_number && (
            <a
              href={getTrackingUrl(selectedShipping.carrier as Carrier, selectedShipping.tracking_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-lg border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <Truck className="size-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold">配送状況を確認</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  配送業者のサイトで追跡できます
                </p>
              </div>
              <ExternalLink className="size-5 text-primary group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}

          {/* Edit Form */}
          {canEdit && (
            <div className="rounded-lg border-2 bg-card p-6 shadow-md space-y-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                {isReady ? (
                  <>
                    <CheckCircle2 className="size-4 text-primary" />
                    出荷完了登録
                  </>
                ) : (
                  <>
                    <Package className="size-4 text-primary" />
                    配送情報修正
                  </>
                )}
              </p>

              <div className="space-y-4">
                {/* Carrier */}
                <div className="space-y-2">
                  <Label htmlFor="carrier">配送業者 *</Label>
                  <Select
                    value={formData.carrier}
                    onValueChange={(value) =>
                      setFormData({ ...formData, carrier: value as Carrier })
                    }
                  >
                    <SelectTrigger id="carrier">
                      <SelectValue placeholder="配送業者を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YAMATO">ヤマト運輸</SelectItem>
                      <SelectItem value="SAGAWA">佐川急便</SelectItem>
                      <SelectItem value="JAPAN_POST">日本郵便</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.carrier && (
                    <p className="text-sm text-destructive">{errors.carrier}</p>
                  )}
                </div>

                {/* Tracking Number */}
                <div className="space-y-2">
                  <Label htmlFor="tracking_number">追跡番号 *</Label>
                  <Input
                    id="tracking_number"
                    className="font-mono"
                    placeholder="追跡番号を入力"
                    value={formData.tracking_number}
                    onChange={(e) =>
                      setFormData({ ...formData, tracking_number: e.target.value })
                    }
                  />
                  {errors.tracking_number && (
                    <p className="text-sm text-destructive">{errors.tracking_number}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-2 pt-2">
                  {isReady ? (
                    <Button
                      size="lg"
                      className="flex-1 shadow-md"
                      onClick={() => handleSubmit("SHIPPED")}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="size-5 mr-2 animate-spin" />}
                      <CheckCircle2 className="size-5 mr-2" />
                      出荷完了
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="flex-1 shadow-md"
                      onClick={() => handleSubmit(selectedShipping.status)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="size-5 mr-2 animate-spin" />}
                      <Package className="size-5 mr-2" />
                      更新
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
