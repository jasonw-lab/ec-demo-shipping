'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ShippingStatus } from '../types';
import {
  Package,
  PackageCheck,
  Truck,
  AlertTriangle
} from 'lucide-react';

type SummaryCardType = 'created' | 'ready' | 'shipped_today' | 'returned';

interface SummaryCardConfig {
  label: string;
  sublabel: string;
  filterStatus: ShippingStatus;
  icon: React.ElementType;
  colorClasses: {
    card: string;
    iconBg: string;
    icon: string;
    title: string;
    value: string;
    sublabel: string;
  };
}

const cardConfigs: Record<SummaryCardType, SummaryCardConfig> = {
  created: {
    label: '未着手',
    sublabel: 'CREATED',
    filterStatus: 'CREATED',
    icon: Package,
    colorClasses: {
      card: 'hover:shadow-lg',
      iconBg: 'bg-muted',
      icon: 'text-muted-foreground',
      title: 'text-muted-foreground',
      value: 'text-foreground',
      sublabel: 'text-muted-foreground'
    }
  },
  ready: {
    label: '出荷作業待ち',
    sublabel: 'READY',
    filterStatus: 'READY',
    icon: PackageCheck,
    colorClasses: {
      card: 'border-primary/30 bg-primary/10 hover:bg-primary/20',
      iconBg: 'bg-primary/20',
      icon: 'text-primary',
      title: 'text-primary',
      value: 'text-foreground',
      sublabel: 'text-muted-foreground'
    }
  },
  shipped_today: {
    label: '本日出荷',
    sublabel: 'SHIPPED TODAY',
    filterStatus: 'SHIPPED',
    icon: Truck,
    colorClasses: {
      card: 'border-accent bg-accent/50 hover:bg-accent',
      iconBg: 'bg-accent',
      icon: 'text-accent-foreground',
      title: 'text-accent-foreground',
      value: 'text-foreground',
      sublabel: 'text-muted-foreground'
    }
  },
  returned: {
    label: '返送/トラブル',
    sublabel: 'RETURNED',
    filterStatus: 'RETURNED',
    icon: AlertTriangle,
    colorClasses: {
      card: 'border-destructive/30 bg-destructive/10 hover:bg-destructive/20',
      iconBg: 'bg-destructive/20',
      icon: 'text-destructive',
      title: 'text-destructive',
      value: 'text-destructive',
      sublabel: 'text-muted-foreground'
    }
  }
};

interface SummaryCardProps {
  type: SummaryCardType;
  count: number;
  isLoading?: boolean;
}

export function SummaryCard({ type, count, isLoading }: SummaryCardProps) {
  const router = useRouter();
  const config = cardConfigs[type];
  const Icon = config.icon;

  const handleClick = () => {
    if (type === 'shipped_today') {
      router.push(`/dashboard/shipments?status=${config.filterStatus}&date=today`);
    } else {
      router.push(`/dashboard/shipments?status=${config.filterStatus}`);
    }
  };

  const showPositiveMessage = type === 'ready' && count === 0 && !isLoading;

  return (
    <Card
      className={cn(
        'min-w-[200px] flex-1 cursor-pointer transition-all duration-200 hover:shadow-md',
        config.colorClasses.card
      )}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-5">
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full',
            config.colorClasses.iconBg
          )}
        >
          <Icon className={cn('h-5 w-5', config.colorClasses.icon)} />
        </div>
        <div className="flex flex-col gap-1">
          <CardTitle
            className={cn('text-sm font-semibold leading-none', config.colorClasses.title)}
          >
            {config.label}
          </CardTitle>
          {isLoading ? (
            <>
              <Skeleton className="mt-2 h-8 w-16" />
              <Skeleton className="h-3 w-12" />
            </>
          ) : showPositiveMessage ? (
            <div
              className={cn(
                'mt-2 text-sm font-medium leading-snug',
                config.colorClasses.value
              )}
            >
              全ての発送作業が完了しました
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'mt-2 text-3xl font-semibold leading-none tracking-tight',
                  config.colorClasses.value
                )}
              >
                {count.toLocaleString()}
              </div>
              <p
                className={cn(
                  'text-[11px] font-semibold uppercase tracking-wider',
                  config.colorClasses.sublabel
                )}
              >
                {config.sublabel}
              </p>
            </>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
