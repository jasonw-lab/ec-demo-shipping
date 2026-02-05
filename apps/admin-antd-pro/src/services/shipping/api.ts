import { request } from '@umijs/max';

type MaybeResponse<T> = ShippingAPI.Response<T> | T;

const normalizeResponse = <T,>(response: MaybeResponse<T>): ShippingAPI.Response<T> => {
  if (
    response &&
    typeof response === 'object' &&
    'success' in response
  ) {
    return response as ShippingAPI.Response<T>;
  }
  if (
    response &&
    typeof response === 'object' &&
    'data' in response
  ) {
    const data = (response as { data: unknown }).data;
    if (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'data' in data
    ) {
      return data as ShippingAPI.Response<T>;
    }
    return {
      success: true,
      data: data as T,
    };
  }
  return {
    success: true,
    data: response as T,
  };
};

/** 発送サマリ取得 GET /api/v1/shipments/summary */
export async function getSummary() {
  return request<ShippingAPI.Response<ShippingAPI.Summary>>(
    '/api/v1/shipments/summary',
    {
      method: 'GET',
    },
  );
}

/** 優先対応発送一覧取得 GET /api/v1/shipments/priority */
export async function getPriorityShippings(limit: number = 5) {
  return request<ShippingAPI.Response<ShippingAPI.Shipping[]>>(
    '/api/v1/shipments/priority',
    {
      method: 'GET',
      params: { limit },
    },
  );
}

/** 発送一覧取得 GET /api/v1/shipments */
export async function getShippings(params: ShippingAPI.ListParams) {
  return request<ShippingAPI.ListResponse>('/api/v1/shipments', {
    method: 'GET',
    params,
  });
}

/** 発送詳細取得 GET /api/v1/shipments/:orderId */
export async function getShipping(orderId: string) {
  const response = await request<MaybeResponse<ShippingAPI.Shipping>>(
    `/api/v1/shipments/${orderId}`,
    {
      method: 'GET',
      getResponse: true,
    },
  );
  const payload =
    response &&
    typeof response === 'object' &&
    'data' in response
      ? (response as { data: unknown }).data
      : response;
  return normalizeResponse(payload as MaybeResponse<ShippingAPI.Shipping>);
}

/** 発送更新 PUT /api/v1/shipments/:orderId */
export async function updateShipping(
  orderId: string,
  data: {
    status: string;
    carrier?: string;
    tracking_number?: string;
    version: number;
  },
) {
  const response = await request<MaybeResponse<ShippingAPI.Shipping>>(
    `/api/v1/shipments/${orderId}`,
    {
      method: 'PUT',
      data,
      getResponse: true,
    },
  );
  const payload =
    response &&
    typeof response === 'object' &&
    'data' in response
      ? (response as { data: unknown }).data
      : response;
  return normalizeResponse(payload as MaybeResponse<ShippingAPI.Shipping>);
}
