"use client";

import Link from "next/link";
import { Clock, Package, Truck, AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  created: Clock,
  ready: Package,
  shipped: Truck,
  returned: AlertTriangle,
};

interface ShippingStatCardProps {
  title: string;
  value: number;
  icon: keyof typeof iconMap;
  href: string;
  variant?: "default" | "destructive";
}

export function ShippingStatCard({ title, value, icon, href, variant = "default" }: ShippingStatCardProps) {
  const Icon = iconMap[icon];
  const isDestructive = variant === "destructive" && value > 0;

  return (
    <Link href={href}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md cursor-pointer",
          isDestructive && "border-red-500/50 bg-red-50 dark:bg-red-950/20"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p
              className={cn(
                "text-2xl font-medium text-foreground",
                isDestructive && "text-red-600 dark:text-red-400"
              )}
            >
              {value.toLocaleString()}
            </p>
          </div>
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-lg bg-muted border border-border",
              isDestructive && "bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800"
            )}
          >
            <Icon
              className={cn(
                "size-8 text-muted-foreground",
                isDestructive && "text-red-600 dark:text-red-400"
              )}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
