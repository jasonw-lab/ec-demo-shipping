// 発送ステータス
export type ShippingStatus = "CREATED" | "READY" | "SHIPPED" | "DELIVERED" | "RETURNED" | "CANCELLED";

// 配送業者
export type Carrier = "YAMATO" | "SAGAWA" | "JAPANPOST" | "";

// 発送データ
export interface Shipment {
  id: string;
  orderId: number;
  status: ShippingStatus;
  carrier: Carrier;
  trackingNumber: string;
  shippingAddress: string;
  readyAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// KPIサマリー
export interface ShippingSummary {
  created: number;
  ready: number;
  shippedToday: number;
  returned: number;
}

// タイムラインイベント
export interface TimelineEvent {
  id: string;
  status: ShippingStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

// 監査ログ
export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  changes?: Record<string, { old: string; new: string }>;
}

// ステータス表示情報
export const STATUS_LABELS: Record<ShippingStatus, string> = {
  CREATED: "作成済み",
  READY: "出荷準備完了",
  SHIPPED: "発送済み",
  DELIVERED: "配送完了",
  RETURNED: "返送",
  CANCELLED: "キャンセル",
};

// 配送業者表示情報
export const CARRIER_LABELS: Record<string, string> = {
  YAMATO: "ヤマト運輸",
  SAGAWA: "佐川急便",
  JAPANPOST: "日本郵便",
  "": "-",
};

// 配送業者追跡URL
export const CARRIER_TRACKING_URLS: Record<string, string> = {
  YAMATO: "https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number=",
  SAGAWA: "https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=",
  JAPANPOST: "https://trackings.post.japanpost.jp/services/srv/search?requestNo1=",
};

// モックデータ
export const mockShippingSummary: ShippingSummary = {
  created: 12,
  ready: 8,
  shippedToday: 25,
  returned: 2,
};

export const mockShipments: Shipment[] = [
  {
    id: "1",
    orderId: 10001,
    status: "RETURNED",
    carrier: "YAMATO",
    trackingNumber: "1234-5678-9012",
    shippingAddress: "〒150-0001 東京都渋谷区神宮前1-2-3 ABCマンション101号室",
    readyAt: "2026-01-25T12:00:00Z",
    shippedAt: "2026-01-25T14:00:00Z",
    deliveredAt: null,
    version: 3,
    createdAt: "2026-01-25T10:00:00Z",
    updatedAt: "2026-01-26T09:00:00Z",
  },
  {
    id: "2",
    orderId: 10002,
    status: "RETURNED",
    carrier: "SAGAWA",
    trackingNumber: "2345-6789-0123",
    shippingAddress: "〒530-0001 大阪府大阪市北区梅田1-2-3",
    readyAt: "2026-01-24T16:00:00Z",
    shippedAt: "2026-01-24T18:00:00Z",
    deliveredAt: null,
    version: 3,
    createdAt: "2026-01-24T14:00:00Z",
    updatedAt: "2026-01-26T08:30:00Z",
  },
  {
    id: "3",
    orderId: 10003,
    status: "CREATED",
    carrier: "",
    trackingNumber: "",
    shippingAddress: "〒810-0001 福岡県福岡市中央区天神1-2-3",
    readyAt: null,
    shippedAt: null,
    deliveredAt: null,
    version: 1,
    createdAt: "2026-01-24T08:00:00Z",
    updatedAt: "2026-01-24T08:00:00Z",
  },
  {
    id: "4",
    orderId: 10004,
    status: "READY",
    carrier: "JAPANPOST",
    trackingNumber: "",
    shippingAddress: "〒060-0001 北海道札幌市中央区北1条西1-2-3",
    readyAt: "2026-01-25T18:00:00Z",
    shippedAt: null,
    deliveredAt: null,
    version: 2,
    createdAt: "2026-01-25T16:00:00Z",
    updatedAt: "2026-01-25T18:00:00Z",
  },
  {
    id: "5",
    orderId: 10005,
    status: "READY",
    carrier: "YAMATO",
    trackingNumber: "",
    shippingAddress: "〒460-0001 愛知県名古屋市中区栄1-2-3",
    readyAt: "2026-01-25T14:00:00Z",
    shippedAt: null,
    deliveredAt: null,
    version: 2,
    createdAt: "2026-01-25T12:00:00Z",
    updatedAt: "2026-01-25T14:00:00Z",
  },
  {
    id: "6",
    orderId: 10006,
    status: "SHIPPED",
    carrier: "YAMATO",
    trackingNumber: "3456-7890-1234",
    shippingAddress: "〒220-0001 神奈川県横浜市西区みなとみらい1-2-3",
    readyAt: "2026-01-26T10:00:00Z",
    shippedAt: "2026-01-27T09:00:00Z",
    deliveredAt: null,
    version: 3,
    createdAt: "2026-01-26T08:00:00Z",
    updatedAt: "2026-01-27T09:00:00Z",
  },
  {
    id: "7",
    orderId: 10007,
    status: "SHIPPED",
    carrier: "SAGAWA",
    trackingNumber: "4567-8901-2345",
    shippingAddress: "〒600-0001 京都府京都市下京区四条通1-2-3",
    readyAt: "2026-01-26T11:00:00Z",
    shippedAt: "2026-01-27T08:30:00Z",
    deliveredAt: null,
    version: 3,
    createdAt: "2026-01-26T09:00:00Z",
    updatedAt: "2026-01-27T08:30:00Z",
  },
  {
    id: "8",
    orderId: 10008,
    status: "DELIVERED",
    carrier: "JAPANPOST",
    trackingNumber: "5678-9012-3456",
    shippingAddress: "〒330-0001 埼玉県さいたま市大宮区桜木町1-2-3",
    readyAt: "2026-01-24T10:00:00Z",
    shippedAt: "2026-01-24T14:00:00Z",
    deliveredAt: "2026-01-25T10:00:00Z",
    version: 4,
    createdAt: "2026-01-24T08:00:00Z",
    updatedAt: "2026-01-25T10:00:00Z",
  },
  {
    id: "9",
    orderId: 10009,
    status: "CREATED",
    carrier: "",
    trackingNumber: "",
    shippingAddress: "〒260-0001 千葉県千葉市中央区中央1-2-3",
    readyAt: null,
    shippedAt: null,
    deliveredAt: null,
    version: 1,
    createdAt: "2026-01-27T06:00:00Z",
    updatedAt: "2026-01-27T06:00:00Z",
  },
  {
    id: "10",
    orderId: 10010,
    status: "CREATED",
    carrier: "",
    trackingNumber: "",
    shippingAddress: "〒980-0001 宮城県仙台市青葉区中央1-2-3",
    readyAt: null,
    shippedAt: null,
    deliveredAt: null,
    version: 1,
    createdAt: "2026-01-27T07:00:00Z",
    updatedAt: "2026-01-27T07:00:00Z",
  },
];

// タイムラインモックデータ
export const mockTimelines: Record<string, TimelineEvent[]> = {
  "1": [
    { id: "1", status: "CREATED", timestamp: "2026-01-25T10:00:00Z", actor: "システム", note: "注文確定により自動作成" },
    { id: "2", status: "READY", timestamp: "2026-01-25T12:00:00Z", actor: "山田太郎", note: "出荷指示完了" },
    { id: "3", status: "SHIPPED", timestamp: "2026-01-25T14:00:00Z", actor: "山田太郎", note: "ヤマト運輸に引き渡し" },
    { id: "4", status: "RETURNED", timestamp: "2026-01-26T09:00:00Z", actor: "システム", note: "宛所不明により返送" },
  ],
  "6": [
    { id: "1", status: "CREATED", timestamp: "2026-01-26T08:00:00Z", actor: "システム" },
    { id: "2", status: "READY", timestamp: "2026-01-26T10:00:00Z", actor: "鈴木花子" },
    { id: "3", status: "SHIPPED", timestamp: "2026-01-27T09:00:00Z", actor: "鈴木花子" },
  ],
};

// 監査ログモックデータ
export const mockAuditLogs: Record<string, AuditLog[]> = {
  "1": [
    { id: "4", action: "STATUS_CHANGED", actor: "システム", timestamp: "2026-01-26T09:00:00Z", changes: { status: { old: "SHIPPED", new: "RETURNED" } } },
    { id: "3", action: "STATUS_CHANGED", actor: "山田太郎", timestamp: "2026-01-25T14:00:00Z", changes: { status: { old: "READY", new: "SHIPPED" } } },
    { id: "2", action: "STATUS_CHANGED", actor: "山田太郎", timestamp: "2026-01-25T12:00:00Z", changes: { status: { old: "CREATED", new: "READY" } } },
    { id: "1", action: "CREATED", actor: "システム", timestamp: "2026-01-25T10:00:00Z" },
  ],
};

// 要対応発送（優先度順）
export interface PriorityShipment extends Shipment {
  priorityReason: string;
}

export const mockPriorityShipments: PriorityShipment[] = [
  { ...mockShipments[0], priorityReason: "返送対応が必要" },
  { ...mockShipments[1], priorityReason: "返送対応が必要" },
  { ...mockShipments[2], priorityReason: "24時間超過" },
  { ...mockShipments[3], priorityReason: "出荷待ち" },
  { ...mockShipments[4], priorityReason: "出荷待ち" },
];
