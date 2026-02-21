"use client";

import * as React from "react";

import { flexRender } from "@tanstack/react-table";

import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { shipmentsColumns } from "./columns.shipments";
import { ShipmentDetailSheet } from "./shipment-detail-sheet";
import type { Shipment, ShippingStatus } from "./types";
import { STATUS_LABELS } from "./types";

interface ShipmentsDataTableProps {
  data: Shipment[];
}

const STATUS_OPTIONS: ShippingStatus[] = ["CREATED", "READY", "SHIPPED", "DELIVERED", "RETURNED", "CANCELLED"];
const CARRIER_OPTIONS = [
  { value: "YAMATO", label: "ヤマト運輸" },
  { value: "SAGAWA", label: "佐川急便" },
  { value: "JAPANPOST", label: "日本郵便" },
];

export function ShipmentsDataTable({ data: initialData }: ShipmentsDataTableProps) {
  const [selectedShipment, setSelectedShipment] = React.useState<Shipment | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [carrierFilter, setCarrierFilter] = React.useState<string>("all");

  // フィルタ適用したデータ
  const filteredData = React.useMemo(() => {
    return initialData.filter((item) => {
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      const carrierMatch = carrierFilter === "all" || item.carrier === carrierFilter;
      return statusMatch && carrierMatch;
    });
  }, [initialData, statusFilter, carrierFilter]);

  const table = useDataTableInstance({
    data: filteredData,
    columns: shipmentsColumns,
    enableRowSelection: true,
    getRowId: (row) => row.id.toString(),
  });

  const handleRowClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setSheetOpen(true);
  };

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex flex-col gap-4">
      {/* フィルタバー */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-sm">
            ステータス
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" id="status-filter">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="carrier-filter" className="text-sm">
            配送業者
          </Label>
          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger className="w-40" id="carrier-filter">
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {CARRIER_OPTIONS.map((carrier) => (
                <SelectItem key={carrier.value} value={carrier.value}>
                  {carrier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {selectedCount > 0 && (
            <Button variant="outline" size="sm">
              一括操作 ({selectedCount}件)
            </Button>
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest('[data-slot="checkbox"]')) {
                      return;
                    }
                    handleRowClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={shipmentsColumns.length} className="h-24 text-center">
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      <DataTablePagination table={table} />

      {/* 詳細シート */}
      <ShipmentDetailSheet shipment={selectedShipment} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
