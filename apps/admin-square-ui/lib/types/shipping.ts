// Shipping types and constants

export type ShippingStatus =
  | "CREATED"
  | "READY"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export type Carrier = "YAMATO" | "SAGAWA" | "JAPAN_POST";

export interface Shipping {
  id: number;
  order_id: string;
  status: ShippingStatus;
  carrier: Carrier | null;
  tracking_number: string | null;
  shipping_address: string;
  ready_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingSummary {
  created: number;
  ready: number;
  shipped_today: number;
  returned: number;
}

export interface ShippingListResponse {
  data: Shipping[];
  total: number;
  page: number;
  size: number;
}

export interface UpdateShippingRequest {
  status: ShippingStatus;
  carrier?: Carrier | null;
  tracking_number?: string | null;
  version: number;
}

export interface ValidationError {
  field: string;
  reason: string;
}

export interface ApiValidationError {
  message: string;
  errors: ValidationError[];
}

export interface ApiConflictError {
  error: string;
  message: string;
}

export interface ApiNotFoundError {
  error: string;
}

// Status constants
export const STATUS_LABELS: Record<ShippingStatus, string> = {
  CREATED: "未着手",
  READY: "出荷作業待ち",
  SHIPPED: "出荷済み",
  DELIVERED: "配送完了",
  RETURNED: "返送",
  CANCELLED: "キャンセル",
};

export const STATUS_CODES: Record<ShippingStatus, number> = {
  CREATED: 10,
  READY: 20,
  SHIPPED: 30,
  DELIVERED: 40,
  RETURNED: 90,
  CANCELLED: 99,
};

// Carrier constants
export const CARRIER_LABELS: Record<Carrier, string> = {
  YAMATO: "ヤマト運輸",
  SAGAWA: "佐川急便",
  JAPAN_POST: "日本郵便",
};

// Tracking number validation patterns
export const TRACKING_PATTERNS: Record<Carrier, RegExp> = {
  YAMATO: /^\d{12}$/,
  SAGAWA: /^\d{12}$/,
  JAPAN_POST: /^[A-Za-z0-9]{11,13}$/,
};

export const TRACKING_ERROR_MESSAGES: Record<Carrier, string> = {
  YAMATO: "ヤマト運輸の追跡番号は12桁の数字です",
  SAGAWA: "佐川急便の追跡番号は12桁の数字です",
  JAPAN_POST: "日本郵便の追跡番号は11-13桁の英数字です",
};

// Status transition rules
export const ALLOWED_TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
  CREATED: ["READY", "CANCELLED"],
  READY: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
};

// Tracking URL builders
export function getTrackingUrl(carrier: Carrier, trackingNumber: string): string {
  const urls: Record<Carrier, string> = {
    YAMATO: `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number=${trackingNumber}`,
    SAGAWA: `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${trackingNumber}`,
    JAPAN_POST: `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${trackingNumber}`,
  };
  return urls[carrier];
}

// Validation helper
export function validateTrackingNumber(carrier: Carrier, trackingNumber: string): boolean {
  return TRACKING_PATTERNS[carrier].test(trackingNumber);
}
