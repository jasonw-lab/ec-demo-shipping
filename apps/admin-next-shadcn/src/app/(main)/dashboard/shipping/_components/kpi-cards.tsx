"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Package, Truck } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { ShippingSummary } from "./types";

interface KpiCardsProps {
  summary: ShippingSummary;
}

interface KpiCardItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  variant?: "default" | "destructive";
  colorClass?: string;
}

export function KpiCards({ summary }: KpiCardsProps) {
  const cards: KpiCardItem[] = [
    {
      label: "作成済み",
      value: summary.created,
      icon: <Clock className="size-5 text-muted-foreground" />,
      href: "/dashboard/shipping/list?status=CREATED",
      colorClass: "bg-linear-to-t from-blue-500/10 to-card",
    },
    {
      label: "出荷準備完了",
      value: summary.ready,
      icon: <Package className="size-5 text-muted-foreground" />,
      href: "/dashboard/shipping/list?status=READY",
      colorClass: "bg-linear-to-t from-green-500/10 to-card",
    },
    {
      label: "本日発送",
      value: summary.shipped_today,
      icon: <Truck className="size-5 text-muted-foreground" />,
      href: "/dashboard/shipping/list?status=SHIPPED&date=today",
      colorClass: "bg-linear-to-t from-purple-500/10 to-card",
    },
    {
      label: "返送",
      value: summary.returned,
      icon: <AlertTriangle className="size-5 text-destructive" />,
      href: "/dashboard/shipping/list?status=RETURNED",
      variant: "destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} href={card.href}>
          <Card
            className={`@container/card cursor-pointer transition-shadow hover:shadow-md ${
              card.variant === "destructive" && card.value > 0
                ? "border-destructive/50 bg-destructive/5"
                : card.colorClass || "bg-linear-to-t from-primary/5 to-card"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-sm font-medium">{card.label}</CardDescription>
              {card.icon}
            </CardHeader>
            <CardTitle
              className={`px-6 text-3xl font-bold tabular-nums ${
                card.variant === "destructive" && card.value > 0 ? "text-destructive" : ""
              }`}
            >
              {card.value.toLocaleString()}
            </CardTitle>
          </Card>
        </Link>
      ))}
    </div>
  );
}
