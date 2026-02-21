"use client";

import Link from "next/link";

import { ChevronRight } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { priorityColumns } from "./columns.priority";
import type { PriorityShipment } from "./types";

interface PriorityListProps {
  shipments: PriorityShipment[];
}

export function PriorityList({ shipments }: PriorityListProps) {
  const table = useDataTableInstance({
    data: shipments,
    columns: priorityColumns,
    enableRowSelection: false,
    getRowId: (row) => row.id.toString(),
  });

  if (shipments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>要対応発送</CardTitle>
          <CardDescription>対応が必要な発送はありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>要対応発送</CardTitle>
          <CardDescription>優先度の高い順に表示（最大5件）</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/shipping/list?priority=true">
            すべて表示
            <ChevronRight className="ml-1 size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <DataTable table={table} columns={priorityColumns} />
        </div>
      </CardContent>
    </Card>
  );
}
