// Shipping domain types

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

export interface UpdateShippingRequest {
  status: ShippingStatus;
  carrier?: string;
  tracking_number?: string;
  version: number;
}

export interface ValidationError {
  field: string;
  reason: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: ValidationError[];
}

export interface PriorityShipping extends Shipping {
  priority_reason: 'RETURNED' | 'CREATED_STALE' | 'READY_OLD';
}

export interface BulkUpdateRequest {
  items: Array<{
    order_id: string;
    status: ShippingStatus;
    version: number;
  }>;
}

export interface BulkUpdateResultItem {
  order_id: string;
  success: boolean;
  error?: string;
  new_version?: number;
}

export interface BulkUpdateResponse {
  results: BulkUpdateResultItem[];
  success_count: number;
  failure_count: number;
}

export interface TimelineEvent {
  status: ShippingStatus;
  timestamp: string;
  actor?: string;
}
