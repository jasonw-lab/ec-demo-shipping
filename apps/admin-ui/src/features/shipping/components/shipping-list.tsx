"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useShippingList } from "../api";
import type { Carrier, ShippingStatus } from "../types";
import { FilterBar } from "./filter-bar";
import { ShippingTable } from "./shipping-table";
import { Pagination } from "./pagination";
import { ShippingDetailSheet } from "./shipping-detail-sheet";

const DEFAULT_PAGE_SIZE = 20;

export function ShippingList() {
  // Initialize with READY as default status
  const [status, setStatus] = useState<ShippingStatus | "">("");
  const [carrier, setCarrier] = useState<Carrier | "">("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sheet state for detail view
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Set default filter to READY on initial load
  useEffect(() => {
    if (!isInitialized) {
      setStatus("READY");
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const { data, isLoading, error } = useShippingList({
    status: status || undefined,
    carrier: carrier || undefined,
    keyword: keyword || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
  });

  const handleReset = () => {
    setStatus("READY");
    setCarrier("");
    setKeyword("");
    setPage(1);
  };

  const handleStatusChange = (newStatus: ShippingStatus | "") => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleCarrierChange = (newCarrier: Carrier | "") => {
    setCarrier(newCarrier);
    setPage(1);
  };

  const handleKeywordChange = (newKeyword: string) => {
    setKeyword(newKeyword);
    setPage(1);
  };

  const handleRowClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedOrderId(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / DEFAULT_PAGE_SIZE) : 0;

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          データの取得に失敗しました。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar
        status={status}
        carrier={carrier}
        keyword={keyword}
        onStatusChange={handleStatusChange}
        onCarrierChange={handleCarrierChange}
        onKeywordChange={handleKeywordChange}
        onReset={handleReset}
      />

      <ShippingTable
        data={data?.data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {data && (
        <div className="text-sm text-muted-foreground text-center">
          {data.total} 件中 {(page - 1) * DEFAULT_PAGE_SIZE + 1} -{" "}
          {Math.min(page * DEFAULT_PAGE_SIZE, data.total)} 件を表示
        </div>
      )}

      <ShippingDetailSheet
        orderId={selectedOrderId}
        open={isSheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}
