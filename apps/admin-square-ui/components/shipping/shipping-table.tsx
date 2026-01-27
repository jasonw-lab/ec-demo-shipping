"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Search,
  Filter,
  Package,
  Truck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useShippingStore } from "@/store/shipping-store";
import { cn } from "@/lib/utils";
import type { Shipment, ShippingStatus, Carrier } from "@/mock-data/shipping";
import { STATUS_LABELS, CARRIER_LABELS } from "@/mock-data/shipping";

const statusIcons: Record<ShippingStatus, React.ElementType> = {
  CREATED: Clock,
  READY: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle2,
  RETURNED: AlertTriangle,
  CANCELLED: XCircle,
};

const statusColors: Record<ShippingStatus, string> = {
  CREATED: "text-muted-foreground",
  READY: "text-blue-600",
  SHIPPED: "text-emerald-600",
  DELIVERED: "text-green-600",
  RETURNED: "text-red-600",
  CANCELLED: "text-muted-foreground",
};

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const columns: ColumnDef<Shipment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "orderId",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          注文ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="font-medium text-foreground">#{row.getValue("orderId")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: () => (
      <div className="flex items-center gap-2">
        <Package className="size-4 text-muted-foreground" />
        <span>ステータス</span>
      </div>
    ),
    filterFn: (row, id, value) => {
      const status = row.getValue(id) as ShippingStatus;
      return value.includes(status);
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as ShippingStatus;
      const StatusIcon = statusIcons[status];
      return (
        <div className="flex items-center gap-1.5">
          <StatusIcon className={cn("size-3.5", statusColors[status])} />
          <span
            className={cn(
              "inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium",
              statusColors[status]
            )}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "carrier",
    header: () => (
      <div className="flex items-center gap-2">
        <Truck className="size-4 text-muted-foreground" />
        <span>配送業者</span>
      </div>
    ),
    filterFn: (row, id, value) => {
      const carrier = row.getValue(id) as string;
      return value.includes(carrier);
    },
    cell: ({ row }) => (
      <div className="text-sm text-foreground">
        {CARRIER_LABELS[row.getValue("carrier") as string] || "-"}
      </div>
    ),
  },
  {
    accessorKey: "trackingNumber",
    header: "追跡番号",
    cell: ({ row }) => (
      <div className="font-mono text-sm text-muted-foreground">
        {row.getValue("trackingNumber") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          更新日時
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatDateTime(row.getValue("updatedAt"))}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const shipment = row.original;

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>アクション</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(shipment.id)}
              >
                IDをコピー
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>詳細を表示</DropdownMenuItem>
              {shipment.status === "CREATED" && (
                <DropdownMenuItem>出荷指示</DropdownMenuItem>
              )}
              {shipment.status === "READY" && (
                <DropdownMenuItem>発送完了</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

export function ShippingTable() {
  const shipments = useShippingStore((state) => state.shipments);
  const statusFilter = useShippingStore((state) => state.statusFilter);
  const carrierFilter = useShippingStore((state) => state.carrierFilter);
  const setSelectedShipment = useShippingStore((state) => state.setSelectedShipment);
  const setStatusFilter = useShippingStore((state) => state.setStatusFilter);
  const setCarrierFilter = useShippingStore((state) => state.setCarrierFilter);

  // Memoize filtered data to prevent infinite re-renders
  const filteredShipments = React.useMemo(() => {
    return shipments.filter((shipment) => {
      const statusMatch = statusFilter === "all" || shipment.status === statusFilter;
      const carrierMatch = carrierFilter === "all" || shipment.carrier === carrierFilter;
      return statusMatch && carrierMatch;
    });
  }, [shipments, statusFilter, carrierFilter]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: filteredShipments,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const statusOptions: ShippingStatus[] = ["CREATED", "READY", "SHIPPED", "DELIVERED", "RETURNED", "CANCELLED"];
  const carrierOptions: Carrier[] = ["YAMATO", "SAGAWA", "JAPANPOST"];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 border-b border-border p-4">
        <div className="flex flex-1 items-center gap-2 sm:gap-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="注文IDで検索..."
              value={(table.getColumn("orderId")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("orderId")?.setFilterValue(event.target.value)
              }
              className="h-7 pl-8 w-full"
            />
          </div>

          {/* ステータスフィルタ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-2 shrink-0">
                <Filter className="size-3.5" />
                <span className="hidden sm:inline">ステータス</span>
                {statusFilter !== "all" && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                    1
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>ステータスで絞り込み</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === "all"}
                onCheckedChange={() => setStatusFilter("all")}
              >
                すべて
              </DropdownMenuCheckboxItem>
              {statusOptions.map((status) => {
                const StatusIcon = statusIcons[status];
                return (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilter === status}
                    onCheckedChange={() => setStatusFilter(status)}
                  >
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn("size-3.5", statusColors[status])} />
                      {STATUS_LABELS[status]}
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 配送業者フィルタ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-2 shrink-0">
                <Truck className="size-3.5" />
                <span className="hidden sm:inline">配送業者</span>
                {carrierFilter !== "all" && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                    1
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>配送業者で絞り込み</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={carrierFilter === "all"}
                onCheckedChange={() => setCarrierFilter("all")}
              >
                すべて
              </DropdownMenuCheckboxItem>
              {carrierOptions.map((carrier) => (
                <DropdownMenuCheckboxItem
                  key={carrier}
                  checked={carrierFilter === carrier}
                  onCheckedChange={() => setCarrierFilter(carrier)}
                >
                  {CARRIER_LABELS[carrier]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 hidden md:flex shrink-0">
                列 <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <Button variant="outline" size="sm" className="h-7 gap-2 shrink-0">
            一括操作 ({table.getFilteredSelectedRowModel().rows.length}件)
          </Button>
        )}
      </div>

      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={() => setSelectedShipment(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 border-t border-border p-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} 件選択中
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}
