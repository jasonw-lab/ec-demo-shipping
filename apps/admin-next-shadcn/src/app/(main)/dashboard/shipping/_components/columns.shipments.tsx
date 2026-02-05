"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

import type { Shipment } from "./types";
import { CARRIER_LABELS, STATUS_LABELS, STATUS_VARIANTS } from "./types";

export const shipmentsColumns: ColumnDef<Shipment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div
        className="flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
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
    accessorKey: "order_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="注文ID" />,
    cell: ({ row }) => (
      <span className="font-medium">#{row.original.order_id}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status]}>
        {STATUS_LABELS[row.original.status]}
      </Badge>
    ),
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "carrier",
    header: ({ column }) => <DataTableColumnHeader column={column} title="配送業者" />,
    cell: ({ row }) => {
      const carrier = row.original.carrier;
      return (
        <span className="text-muted-foreground">
          {carrier ? CARRIER_LABELS[carrier] || carrier : "-"}
        </span>
      );
    },
    enableSorting: true,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "tracking_number",
    header: ({ column }) => <DataTableColumnHeader column={column} title="追跡番号" />,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground">
        {row.original.tracking_number || "-"}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="更新日時" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {format(new Date(row.original.updated_at), "yyyy/MM/dd HH:mm", { locale: ja })}
      </span>
    ),
    enableSorting: true,
  },
];
