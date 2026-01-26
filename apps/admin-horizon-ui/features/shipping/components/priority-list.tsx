'use client';

import Link from 'next/link';
import { usePriorityList } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, AlertCircle } from 'lucide-react';
import type { ShippingStatus } from '../types';

const statusConfig: Record<
  ShippingStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  CREATED: { label: '未着手', variant: 'secondary' },
  READY: { label: '準備完了', variant: 'default' },
  SHIPPED: { label: '出荷済', variant: 'outline' },
  DELIVERED: { label: '配達完了', variant: 'outline' },
  RETURNED: { label: '返送', variant: 'destructive' },
  CANCELLED: { label: 'キャンセル', variant: 'outline' }
};

const carrierLabels: Record<string, string> = {
  YAMATO: 'ヤマト運輸',
  SAGAWA: '佐川急便',
  JAPAN_POST: '日本郵便'
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function PriorityList() {
  const { data, isLoading, error } = usePriorityList(5);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            要対応発送
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            データの取得に失敗しました
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && (!data || data.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          要対応発送
        </CardTitle>
        <Link
          href="/dashboard/shipments?priority=true"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          すべて表示
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>注文ID</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>配送業者</TableHead>
                <TableHead>更新日時</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                data?.map((shipping) => {
                  const status = statusConfig[shipping.status];
                  return (
                    <TableRow
                      key={shipping.order_id}
                      className="cursor-pointer"
                      onClick={() => {
                        window.location.href = `/dashboard/shipments/${shipping.order_id}`;
                      }}
                    >
                      <TableCell className="font-medium">
                        {shipping.order_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {shipping.carrier
                          ? carrierLabels[shipping.carrier] || shipping.carrier
                          : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(shipping.updated_at)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
