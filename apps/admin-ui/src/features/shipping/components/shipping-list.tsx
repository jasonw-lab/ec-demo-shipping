"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useShippingList } from "../api";
import type { Carrier, Shipping, ShippingStatus, BulkUpdateResponse } from "../types";
import { FilterBar } from "./filter-bar";
import { FilterChips } from "./filter-chips";
import { ShippingTable } from "./shipping-table";
import { Pagination } from "./pagination";
import { ShippingDetailSheet } from "./shipping-detail-sheet";
import { BulkActions } from "./bulk-actions";

const DEFAULT_PAGE_SIZE = 20;

const validStatuses: ShippingStatus[] = [
  "CREATED",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
];

export function ShippingList() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status");

  // Initialize with URL param or READY as default status
  const [status, setStatus] = useState<ShippingStatus | "">("");
  const [carrier, setCarrier] = useState<Carrier | "">("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sheet state for detail view
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Selection state for bulk operations
  const [selectedItems, setSelectedItems] = useState<Shipping[]>([]);
  const [failedOrderIds, setFailedOrderIds] = useState<string[]>([]);

  // Set initial filter from URL param or default to READY
  useEffect(() => {
    if (!isInitialized) {
      if (urlStatus && validStatuses.includes(urlStatus as ShippingStatus)) {
        setStatus(urlStatus as ShippingStatus);
      } else if (urlStatus === "") {
        // Empty status means show all
        setStatus("");
      } else {
        setStatus("READY");
      }
      setIsInitialized(true);
    }
  }, [isInitialized, urlStatus]);

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
    setSelectedItems([]);
    setFailedOrderIds([]);
  };

  const handleStatusChange = (newStatus: ShippingStatus | "") => {
    setStatus(newStatus);
    setPage(1);
    setSelectedItems([]);
    setFailedOrderIds([]);
  };

  const handleCarrierChange = (newCarrier: Carrier | "") => {
    setCarrier(newCarrier);
    setPage(1);
    setSelectedItems([]);
    setFailedOrderIds([]);
  };

  const handleKeywordChange = (newKeyword: string) => {
    setKeyword(newKeyword);
    setPage(1);
    setSelectedItems([]);
    setFailedOrderIds([]);
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

  const handleSelectionChange = (items: Shipping[]) => {
    setSelectedItems(items);
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
    setFailedOrderIds([]);
  };

  const handleBulkUpdateComplete = (response: BulkUpdateResponse) => {
    const failedIds = response.results
      .filter((r) => !r.success)
      .map((r) => r.order_id);
    setFailedOrderIds(failedIds);

    if (failedIds.length === 0) {
      setSelectedItems([]);
    }
  };

  // Filter chips handlers
  const handleRemoveStatus = () => {
    setStatus("");
    setPage(1);
  };

  const handleRemoveCarrier = () => {
    setCarrier("");
    setPage(1);
  };

  const handleRemoveKeyword = () => {
    setKeyword("");
    setPage(1);
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

      <FilterChips
        status={status}
        carrier={carrier}
        keyword={keyword}
        onRemoveStatus={handleRemoveStatus}
        onRemoveCarrier={handleRemoveCarrier}
        onRemoveKeyword={handleRemoveKeyword}
      />

      <BulkActions
        selectedItems={selectedItems}
        onClearSelection={handleClearSelection}
        onUpdateComplete={handleBulkUpdateComplete}
      />

      <ShippingTable
        data={data?.data || []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        enableSelection={true}
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        failedOrderIds={failedOrderIds}
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
