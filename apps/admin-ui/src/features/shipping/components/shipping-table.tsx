"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Copy, Pencil, Truck, Check, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import type { Shipping, Carrier } from "../types";
import { StatusBadge } from "./status-badge";

const carrierLabels: Record<Carrier, string> = {
  YAMATO: "ヤマト運輸",
  SAGAWA: "佐川急便",
  JAPAN_POST: "日本郵便",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}日前`;
  if (diffHour > 0) return `${diffHour}時間前`;
  if (diffMin > 0) return `${diffMin}分前`;
  return "たった今";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

function SortHeader({ column, children }: { column: any; children: React.ReactNode }) {
  const isSorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      {isSorted === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : isSorted === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}

interface ShippingTableProps {
  data: Shipping[];
  isLoading?: boolean;
  onRowClick?: (orderId: string) => void;
  enableSelection?: boolean;
  selectedItems?: Shipping[];
  onSelectionChange?: (items: Shipping[]) => void;
  failedOrderIds?: string[];
}

export function ShippingTable({
  data,
  isLoading,
  onRowClick,
  enableSelection = false,
  selectedItems = [],
  onSelectionChange,
  failedOrderIds = [],
}: ShippingTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(() => {
    const selection: RowSelectionState = {};
    selectedItems.forEach((item) => {
      const index = data.findIndex((d) => d.order_id === item.order_id);
      if (index >= 0) {
        selection[index] = true;
      }
    });
    return selection;
  });

  const columns: ColumnDef<Shipping>[] = [
    ...(enableSelection
      ? [
          {
            id: "select",
            header: ({ table }: any) => (
              <Checkbox
                checked={
                  table.getIsAllPageRowsSelected() ||
                  (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                  table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
              />
            ),
            cell: ({ row }: any) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Select row"
              />
            ),
            enableSorting: false,
          } as ColumnDef<Shipping>,
        ]
      : []),
    {
      accessorKey: "order_id",
      header: ({ column }) => <SortHeader column={column}>注文ID</SortHeader>,
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.order_id}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <SortHeader column={column}>ステータス</SortHeader>,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "carrier",
      header: "配送業者",
      cell: ({ row }) => {
        const carrier = row.original.carrier as Carrier | null;
        if (!carrier) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span>{carrierLabels[carrier] || carrier}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "tracking_number",
      header: "追跡番号",
      cell: ({ row }) => {
        const tracking = row.original.tracking_number;
        if (!tracking) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm">{tracking}</span>
            <CopyButton text={tracking} />
          </div>
        );
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => <SortHeader column={column}>更新日時</SortHeader>,
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatRelativeTime(row.original.updated_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onRowClick?.(row.original.order_id);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSelection =
        typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(newSelection);

      if (onSelectionChange) {
        const selectedData = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => data[parseInt(key)])
          .filter(Boolean);
        onSelectionChange(selectedData);
      }
    },
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: enableSelection,
  });

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => {
              const isFailed = failedOrderIds.includes(row.original.order_id);
              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`${onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} ${
                    isFailed ? "bg-red-50 hover:bg-red-100" : ""
                  }`}
                  onClick={() => onRowClick?.(row.original.order_id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
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
  );
}
