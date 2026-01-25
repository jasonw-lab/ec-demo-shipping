"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { TrackingLink } from "./tracking-link";
import type { Shipping, Carrier } from "../types";

const carrierLabels: Record<Carrier, string> = {
  YAMATO: "ヤマト運輸",
  SAGAWA: "佐川急便",
  JAPAN_POST: "日本郵便",
};

interface ShippingInfoProps {
  shipping: Shipping;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

export function ShippingInfo({ shipping }: ShippingInfoProps) {
  const hasTracking =
    shipping.carrier &&
    shipping.tracking_number &&
    ["SHIPPED", "DELIVERED", "RETURNED"].includes(shipping.status);

  return (
    <div className="space-y-6">
      {/* Order ID & Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Order ID:</span>
            <span className="font-mono font-medium">{shipping.order_id}</span>
            <CopyButton text={shipping.order_id} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">ステータス:</span>
          <StatusBadge status={shipping.status} />
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
          配送先
        </h4>
        <p className="text-sm whitespace-pre-line">{shipping.shipping_address}</p>
      </div>

      {/* Carrier & Tracking */}
      {shipping.carrier && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
            配送情報
          </h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">配送業者:</span>
              <span className="text-sm">
                {carrierLabels[shipping.carrier as Carrier] || shipping.carrier}
              </span>
            </div>
            {shipping.tracking_number && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">追跡番号:</span>
                <span className="font-mono text-sm">{shipping.tracking_number}</span>
                <CopyButton text={shipping.tracking_number} />
              </div>
            )}
          </div>
          {hasTracking && (
            <div className="pt-2">
              <TrackingLink
                carrier={shipping.carrier as Carrier}
                trackingNumber={shipping.tracking_number!}
              />
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
          タイムスタンプ
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">作成日時:</span>
          <span>{new Date(shipping.created_at).toLocaleString("ja-JP")}</span>
          {shipping.ready_at && (
            <>
              <span className="text-muted-foreground">準備完了:</span>
              <span>{new Date(shipping.ready_at).toLocaleString("ja-JP")}</span>
            </>
          )}
          {shipping.shipped_at && (
            <>
              <span className="text-muted-foreground">出荷日時:</span>
              <span>{new Date(shipping.shipped_at).toLocaleString("ja-JP")}</span>
            </>
          )}
          {shipping.delivered_at && (
            <>
              <span className="text-muted-foreground">配達完了:</span>
              <span>{new Date(shipping.delivered_at).toLocaleString("ja-JP")}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
