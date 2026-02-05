"use client";

import { CheckCircle, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShippingStatus, TimelineEvent, Shipping } from "../types";

const STATUS_ORDER: ShippingStatus[] = [
  "CREATED",
  "READY",
  "SHIPPED",
  "DELIVERED",
];

const statusLabels: Record<ShippingStatus, string> = {
  CREATED: "受注",
  READY: "出荷準備完了",
  SHIPPED: "出荷済",
  DELIVERED: "配達完了",
  RETURNED: "返送",
  CANCELLED: "キャンセル",
};

interface StatusTimelineProps {
  shipping: Shipping;
  timelineEvents?: TimelineEvent[];
}

export function StatusTimeline({ shipping, timelineEvents }: StatusTimelineProps) {
  const currentStatus = shipping.status;

  // Build timeline from shipping data if no events provided
  const buildTimelineFromShipping = (): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    if (shipping.created_at) {
      events.push({ status: "CREATED", timestamp: shipping.created_at });
    }
    if (shipping.ready_at) {
      events.push({ status: "READY", timestamp: shipping.ready_at });
    }
    if (shipping.shipped_at) {
      events.push({ status: "SHIPPED", timestamp: shipping.shipped_at });
    }
    if (shipping.delivered_at) {
      events.push({ status: "DELIVERED", timestamp: shipping.delivered_at });
    }

    return events;
  };

  const events = timelineEvents && timelineEvents.length > 0
    ? timelineEvents
    : buildTimelineFromShipping();

  // For RETURNED or CANCELLED, show special timeline
  if (currentStatus === "RETURNED" || currentStatus === "CANCELLED") {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
          ステータス履歴
        </h4>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <Circle className="h-4 w-4 text-red-500 fill-red-500" />
          <span className="text-sm font-medium text-red-700">
            {statusLabels[currentStatus]}
          </span>
          {events.find(e => e.status === currentStatus) && (
            <span className="text-xs text-red-600 ml-auto">
              {new Date(
                events.find(e => e.status === currentStatus)!.timestamp
              ).toLocaleString("ja-JP")}
            </span>
          )}
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
        ステータス履歴
      </h4>
      <div className="relative">
        {STATUS_ORDER.map((status, index) => {
          const event = events.find((e) => e.status === status);
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={status} className="flex items-start gap-3 pb-4 last:pb-0">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                ) : isCurrent ? (
                  <Circle className="h-5 w-5 text-blue-500 fill-blue-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                )}
                {index < STATUS_ORDER.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-6 mt-1",
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>

              {/* Status content */}
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "text-sm font-medium",
                    isCompleted && "text-green-700",
                    isCurrent && "text-blue-700",
                    isFuture && "text-gray-400"
                  )}
                >
                  {statusLabels[status]}
                </div>
                {event && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(event.timestamp).toLocaleString("ja-JP")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
