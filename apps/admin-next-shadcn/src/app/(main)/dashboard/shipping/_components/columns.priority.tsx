"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";

import type { PriorityShipment } from "./types";
import { STATUS_LABELS, STATUS_VARIANTS } from "./types";

export const priorityColumns: ColumnDef<PriorityShipment>[] = [
  {
    accessorKey: "order_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="注文ID" />,
    cell: ({ row }) => <span className="font-medium">#{row.original.order_id}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ステータス" />,
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "carrier",
    header: ({ column }) => <DataTableColumnHeader column={column} title="配送業者" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.carrier || "-"}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "priority_reason",
    header: ({ column }) => <DataTableColumnHeader column={column} title="理由" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.priority_reason || "-"}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="更新日時" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDistanceToNow(new Date(row.original.updated_at), {
          addSuffix: true,
          locale: ja,
        })}
      </span>
    ),
    enableSorting: false,
  },
];
