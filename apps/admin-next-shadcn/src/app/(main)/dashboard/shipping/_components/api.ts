import type { AuditLog, PriorityShipment, Shipment, ShipmentsResponse, ShippingSummary, TimelineEvent } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

// KPIサマリー取得
export async function fetchShippingSummary(): Promise<ShippingSummary> {
  const res = await fetch(`${API_BASE_URL}/shipments/summary`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch shipping summary");
  }

  return res.json();
}

// 要対応発送リスト取得
export async function fetchPriorityShipments(limit = 5): Promise<PriorityShipment[]> {
  const res = await fetch(`${API_BASE_URL}/shipments/priority?limit=${limit}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch priority shipments");
  }

  return res.json();
}

// モックデータ（開発用）
export const mockSummary: ShippingSummary = {
  created: 12,
  ready: 8,
  shipped_today: 25,
  returned: 2,
};

export const mockPriorityShipments: PriorityShipment[] = [
  {
    id: 1,
    order_id: 10001,
    status: "RETURNED",
    carrier: "YAMATO",
    tracking_number: "1234-5678-9012",
    shipping_address: "東京都渋谷区...",
    created_at: "2026-01-25T10:00:00Z",
    updated_at: "2026-01-26T09:00:00Z",
    priority_reason: "返送対応が必要",
  },
  {
    id: 2,
    order_id: 10002,
    status: "RETURNED",
    carrier: "SAGAWA",
    tracking_number: "2345-6789-0123",
    shipping_address: "大阪府大阪市...",
    created_at: "2026-01-24T14:00:00Z",
    updated_at: "2026-01-26T08:30:00Z",
    priority_reason: "返送対応が必要",
  },
  {
    id: 3,
    order_id: 10003,
    status: "CREATED",
    carrier: "",
    tracking_number: "",
    shipping_address: "福岡県福岡市...",
    created_at: "2026-01-24T08:00:00Z",
    updated_at: "2026-01-24T08:00:00Z",
    priority_reason: "24時間超過",
  },
  {
    id: 4,
    order_id: 10004,
    status: "READY",
    carrier: "JAPANPOST",
    tracking_number: "",
    shipping_address: "北海道札幌市...",
    created_at: "2026-01-25T16:00:00Z",
    updated_at: "2026-01-25T18:00:00Z",
    priority_reason: "出荷待ち",
  },
  {
    id: 5,
    order_id: 10005,
    status: "READY",
    carrier: "YAMATO",
    tracking_number: "",
    shipping_address: "愛知県名古屋市...",
    created_at: "2026-01-25T12:00:00Z",
    updated_at: "2026-01-25T14:00:00Z",
    priority_reason: "出荷待ち",
  },
];
