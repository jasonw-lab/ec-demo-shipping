"use client";

import { useEffect, useState } from "react";

import { fetchShipments } from "../_components/api";
import { ShipmentsDataTable } from "../_components/shipments-data-table";
import type { Shipment } from "../_components/types";

export default function ShippingListPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShipments() {
      try {
        const response = await fetchShipments({ page: 1, size: 100 });
        setShipments(response.data);
      } catch (error) {
        console.error("Failed to fetch shipments:", error);
        setShipments([]);
      } finally {
        setLoading(false);
      }
    }

    loadShipments();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">発送一覧</h1>
          <p className="text-muted-foreground">すべての発送データを管理できます</p>
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">発送一覧</h1>
        <p className="text-muted-foreground">すべての発送データを管理できます</p>
      </div>

      <ShipmentsDataTable data={shipments} />
    </div>
  );
}
