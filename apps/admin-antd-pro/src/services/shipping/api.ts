import { request } from '@umijs/max';

/** 発送サマリ取得 GET /api/v1/shippings/summary */
export async function getSummary() {
  return request<ShippingAPI.Summary>('/api/v1/shippings/summary', {
    method: 'GET',
  });
}

/** 優先対応発送一覧取得 GET /api/v1/shippings/priority */
export async function getPriorityShippings(limit: number = 5) {
  return request<ShippingAPI.Shipping[]>('/api/v1/shippings/priority', {
    method: 'GET',
    params: { limit },
  });
}

/** 発送一覧取得 GET /api/v1/shippings */
export async function getShippings(params: ShippingAPI.ListParams) {
  return request<ShippingAPI.ListResponse>('/api/v1/shippings', {
    method: 'GET',
    params,
  });
}

/** 発送詳細取得 GET /api/v1/shippings/:orderId */
export async function getShipping(orderId: string) {
  return request<ShippingAPI.Shipping>(`/api/v1/shippings/${orderId}`, {
    method: 'GET',
  });
}

/** 発送更新 PUT /api/v1/shippings/:orderId */
export async function updateShipping(
  orderId: string,
  data: {
    status: string;
    carrier?: string;
    tracking_number?: string;
    version: number;
  },
) {
  return request<ShippingAPI.Shipping>(`/api/v1/shippings/${orderId}`, {
    method: 'PUT',
    data,
  });
}
