// 発送ステータス
export type ShippingStatus = "CREATED" | "READY" | "SHIPPED" | "DELIVERED" | "RETURNED" | "CANCELLED";

// KPIサマリー（GET /api/v1/shipments/summary）
export interface ShippingSummary {
  created: number;
  ready: number;
  shipped_today: number;
  returned: number;
}

// 要対応発送（GET /api/v1/shipments/priority）
export interface PriorityShipment {
  id: number;
  order_id: number;
  status: ShippingStatus;
  carrier: string;
  tracking_number: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
  priority_reason: string;
}

// 発送データ
export interface Shipment {
  id: number;
  order_id: number;
  status: ShippingStatus;
  carrier: string;
  tracking_number: string;
  shipping_address: string;
  ready_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
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

// ステータスバッジのバリアント
export const STATUS_VARIANTS: Record<ShippingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  CREATED: "secondary",
  READY: "default",
  SHIPPED: "outline",
  DELIVERED: "secondary",
  RETURNED: "destructive",
  CANCELLED: "outline",
};

// 配送業者
export type Carrier = "YAMATO" | "SAGAWA" | "JAPANPOST" | "";

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

// タイムラインイベント
export interface TimelineEvent {
  id: number;
  status: ShippingStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

// 監査ログ
export interface AuditLog {
  id: number;
  action: string;
  actor: string;
  timestamp: string;
  changes?: Record<string, { old: string; new: string }>;
}

// 発送一覧レスポンス
export interface ShipmentsResponse {
  data: Shipment[];
  total: number;
  page: number;
  limit: number;
}
