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

// 発送一覧モックデータ
export const mockShipments: Shipment[] = [
  {
    id: 1,
    order_id: 10001,
    status: "RETURNED",
    carrier: "YAMATO",
    tracking_number: "1234-5678-9012",
    shipping_address: "〒150-0001 東京都渋谷区神宮前1-2-3 ABCマンション101号室",
    ready_at: "2026-01-25T12:00:00Z",
    shipped_at: "2026-01-25T14:00:00Z",
    delivered_at: null,
    version: 3,
    created_at: "2026-01-25T10:00:00Z",
    updated_at: "2026-01-26T09:00:00Z",
  },
  {
    id: 2,
    order_id: 10002,
    status: "RETURNED",
    carrier: "SAGAWA",
    tracking_number: "2345-6789-0123",
    shipping_address: "〒530-0001 大阪府大阪市北区梅田1-2-3",
    ready_at: "2026-01-24T16:00:00Z",
    shipped_at: "2026-01-24T18:00:00Z",
    delivered_at: null,
    version: 3,
    created_at: "2026-01-24T14:00:00Z",
    updated_at: "2026-01-26T08:30:00Z",
  },
  {
    id: 3,
    order_id: 10003,
    status: "CREATED",
    carrier: "",
    tracking_number: "",
    shipping_address: "〒810-0001 福岡県福岡市中央区天神1-2-3",
    ready_at: null,
    shipped_at: null,
    delivered_at: null,
    version: 1,
    created_at: "2026-01-24T08:00:00Z",
    updated_at: "2026-01-24T08:00:00Z",
  },
  {
    id: 4,
    order_id: 10004,
    status: "READY",
    carrier: "JAPANPOST",
    tracking_number: "",
    shipping_address: "〒060-0001 北海道札幌市中央区北1条西1-2-3",
    ready_at: "2026-01-25T18:00:00Z",
    shipped_at: null,
    delivered_at: null,
    version: 2,
    created_at: "2026-01-25T16:00:00Z",
    updated_at: "2026-01-25T18:00:00Z",
  },
  {
    id: 5,
    order_id: 10005,
    status: "READY",
    carrier: "YAMATO",
    tracking_number: "",
    shipping_address: "〒460-0001 愛知県名古屋市中区栄1-2-3",
    ready_at: "2026-01-25T14:00:00Z",
    shipped_at: null,
    delivered_at: null,
    version: 2,
    created_at: "2026-01-25T12:00:00Z",
    updated_at: "2026-01-25T14:00:00Z",
  },
  {
    id: 6,
    order_id: 10006,
    status: "SHIPPED",
    carrier: "YAMATO",
    tracking_number: "3456-7890-1234",
    shipping_address: "〒220-0001 神奈川県横浜市西区みなとみらい1-2-3",
    ready_at: "2026-01-26T10:00:00Z",
    shipped_at: "2026-01-27T09:00:00Z",
    delivered_at: null,
    version: 3,
    created_at: "2026-01-26T08:00:00Z",
    updated_at: "2026-01-27T09:00:00Z",
  },
  {
    id: 7,
    order_id: 10007,
    status: "SHIPPED",
    carrier: "SAGAWA",
    tracking_number: "4567-8901-2345",
    shipping_address: "〒600-0001 京都府京都市下京区四条通1-2-3",
    ready_at: "2026-01-26T11:00:00Z",
    shipped_at: "2026-01-27T08:30:00Z",
    delivered_at: null,
    version: 3,
    created_at: "2026-01-26T09:00:00Z",
    updated_at: "2026-01-27T08:30:00Z",
  },
  {
    id: 8,
    order_id: 10008,
    status: "DELIVERED",
    carrier: "JAPANPOST",
    tracking_number: "5678-9012-3456",
    shipping_address: "〒330-0001 埼玉県さいたま市大宮区桜木町1-2-3",
    ready_at: "2026-01-24T10:00:00Z",
    shipped_at: "2026-01-24T14:00:00Z",
    delivered_at: "2026-01-25T10:00:00Z",
    version: 4,
    created_at: "2026-01-24T08:00:00Z",
    updated_at: "2026-01-25T10:00:00Z",
  },
  {
    id: 9,
    order_id: 10009,
    status: "CREATED",
    carrier: "",
    tracking_number: "",
    shipping_address: "〒260-0001 千葉県千葉市中央区中央1-2-3",
    ready_at: null,
    shipped_at: null,
    delivered_at: null,
    version: 1,
    created_at: "2026-01-27T06:00:00Z",
    updated_at: "2026-01-27T06:00:00Z",
  },
  {
    id: 10,
    order_id: 10010,
    status: "CREATED",
    carrier: "",
    tracking_number: "",
    shipping_address: "〒980-0001 宮城県仙台市青葉区中央1-2-3",
    ready_at: null,
    shipped_at: null,
    delivered_at: null,
    version: 1,
    created_at: "2026-01-27T07:00:00Z",
    updated_at: "2026-01-27T07:00:00Z",
  },
];

// タイムラインモックデータ
export const mockTimeline: Record<number, TimelineEvent[]> = {
  1: [
    { id: 1, status: "CREATED", timestamp: "2026-01-25T10:00:00Z", actor: "システム", note: "注文確定により自動作成" },
    { id: 2, status: "READY", timestamp: "2026-01-25T12:00:00Z", actor: "山田太郎", note: "出荷指示完了" },
    { id: 3, status: "SHIPPED", timestamp: "2026-01-25T14:00:00Z", actor: "山田太郎", note: "ヤマト運輸に引き渡し" },
    { id: 4, status: "RETURNED", timestamp: "2026-01-26T09:00:00Z", actor: "システム", note: "宛所不明により返送" },
  ],
  6: [
    { id: 1, status: "CREATED", timestamp: "2026-01-26T08:00:00Z", actor: "システム" },
    { id: 2, status: "READY", timestamp: "2026-01-26T10:00:00Z", actor: "鈴木花子" },
    { id: 3, status: "SHIPPED", timestamp: "2026-01-27T09:00:00Z", actor: "鈴木花子" },
  ],
};

// 監査ログモックデータ
export const mockAuditLogs: Record<number, AuditLog[]> = {
  1: [
    { id: 4, action: "STATUS_CHANGED", actor: "システム", timestamp: "2026-01-26T09:00:00Z", changes: { status: { old: "SHIPPED", new: "RETURNED" } } },
    { id: 3, action: "STATUS_CHANGED", actor: "山田太郎", timestamp: "2026-01-25T14:00:00Z", changes: { status: { old: "READY", new: "SHIPPED" } } },
    { id: 2, action: "STATUS_CHANGED", actor: "山田太郎", timestamp: "2026-01-25T12:00:00Z", changes: { status: { old: "CREATED", new: "READY" } } },
    { id: 1, action: "CREATED", actor: "システム", timestamp: "2026-01-25T10:00:00Z" },
  ],
};

// 発送一覧取得（モック）
export function getMockShipments(page = 1, limit = 20): ShipmentsResponse {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: mockShipments.slice(start, end),
    total: mockShipments.length,
    page,
    limit,
  };
}

// 発送詳細取得（モック）
export function getMockShipment(id: number): Shipment | undefined {
  return mockShipments.find((s) => s.id === id);
}

// タイムライン取得（モック）
export function getMockTimeline(id: number): TimelineEvent[] {
  return mockTimeline[id] || [];
}

// 監査ログ取得（モック）
export function getMockAuditLogs(id: number): AuditLog[] {
  return mockAuditLogs[id] || [];
}
