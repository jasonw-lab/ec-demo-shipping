// Shipping domain types
// These will be implemented in issue-003 (API) and issue-006 (UI)

export interface Shipping {
  id: number;
  order_id: string;
  status: ShippingStatus;
  carrier: string | null;
  tracking_number: string | null;
  shipping_address: string;
  ready_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export type ShippingStatus =
  | "CREATED"
  | "READY"
  | "SHIPPED"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

export type Carrier = "YAMATO" | "SAGAWA" | "JAPAN_POST";

export interface ShippingListParams {
  status?: ShippingStatus;
  carrier?: Carrier;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface ShippingListResponse {
  data: Shipping[];
  total: number;
  page: number;
  size: number;
}

export interface ShippingSummary {
  created: number;
  ready: number;
  shipped_today: number;
  returned: number;
}
