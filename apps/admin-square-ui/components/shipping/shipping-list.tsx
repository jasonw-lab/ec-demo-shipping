"use client";

import { useEffect } from "react";
import { Search, X } from "lucide-react";
import { useShippingStore } from "@/store/shipping-store";
import { shippingApi, ShippingApiError } from "@/lib/api/shipping-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { ShippingStatus, Carrier } from "@/lib/types/shipping";
import { STATUS_LABELS, CARRIER_LABELS } from "@/lib/types/shipping";

function getStatusBadgeVariant(status: ShippingStatus) {
  switch (status) {
    case "CREATED":
      return "outline";
    case "READY":
      return "default";
    case "SHIPPED":
      return "secondary";
    case "RETURNED":
      return "destructive";
    default:
      return "outline";
  }
}

export function ShippingList() {
  const {
    shippings,
    total,
    page,
    size,
    filter,
    isLoading,
    setShippings,
    setFilter,
    setPage,
    setLoading,
    setSelectedShipping,
    clearFilter,
  } = useShippingStore();

  useEffect(() => {
    loadShippings();
  }, [filter, page]);

  async function loadShippings() {
    setLoading(true);
    try {
      const data = await shippingApi.getList({
        ...filter,
        page,
        size,
      });
      setShippings(data.data, data.total, data.page, data.size);
    } catch (error) {
      if (error instanceof ShippingApiError) {
        toast.error("発送一覧の取得に失敗しました", {
          description: error.message,
        });
      } else {
        toast.error("発送一覧の取得に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(key: string, value: string) {
    setFilter({ ...filter, [key]: value || undefined });
  }

  function handleClearFilter() {
    clearFilter();
  }

  function handleRowClick(shipping: any) {
    setSelectedShipping(shipping);
  }

  const totalPages = Math.ceil(total / size);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">発送一覧</h2>
          <p className="text-sm text-muted-foreground mt-1">
            全 {total} 件の発送情報
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="注文ID・追跡番号で検索"
                className="pl-8 h-9"
                value={filter.keyword || ""}
                onChange={(e) => handleFilterChange("keyword", e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filter.status || "all"}
              onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                <SelectItem value="CREATED">未着手</SelectItem>
                <SelectItem value="READY">出荷作業待ち</SelectItem>
                <SelectItem value="SHIPPED">出荷済み</SelectItem>
                <SelectItem value="DELIVERED">配送完了</SelectItem>
                <SelectItem value="RETURNED">返送</SelectItem>
                <SelectItem value="CANCELLED">キャンセル</SelectItem>
              </SelectContent>
            </Select>

            {/* Carrier Filter */}
            <Select
              value={filter.carrier || "all"}
              onValueChange={(value) => handleFilterChange("carrier", value === "all" ? "" : value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="配送業者" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                <SelectItem value="YAMATO">ヤマト運輸</SelectItem>
                <SelectItem value="SAGAWA">佐川急便</SelectItem>
                <SelectItem value="JAPAN_POST">日本郵便</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filter */}
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={handleClearFilter}
            >
              <X className="size-4 mr-2" />
              フィルタをクリア
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              読み込み中...
            </div>
          ) : shippings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              発送情報が見つかりませんでした
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>注文ID</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>配送業者</TableHead>
                  <TableHead>追跡番号</TableHead>
                  <TableHead>更新日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippings.map((shipping) => (
                  <TableRow
                    key={shipping.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(shipping)}
                  >
                    <TableCell className="font-mono text-sm">
                      {shipping.order_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(shipping.status)}>
                        {STATUS_LABELS[shipping.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {shipping.carrier
                        ? CARRIER_LABELS[shipping.carrier as Carrier]
                        : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {shipping.tracking_number || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(shipping.updated_at), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border p-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              ページ {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                前へ
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                次へ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
