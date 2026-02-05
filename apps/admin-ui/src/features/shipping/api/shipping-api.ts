import type {
  Shipping,
  ShippingListParams,
  ShippingListResponse,
  ShippingSummary,
  UpdateShippingRequest,
  ApiError,
  PriorityShipping,
  BulkUpdateRequest,
  BulkUpdateResponse,
  TimelineEvent,
} from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function fetchShippings(
  params: ShippingListParams
): Promise<ShippingListResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set("status", params.status);
  if (params.carrier) searchParams.set("carrier", params.carrier);
  if (params.keyword) searchParams.set("keyword", params.keyword);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.size) searchParams.set("size", params.size.toString());

  const url = `${API_BASE_URL}/shippings?${searchParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch shippings: ${response.status}`);
  }

  return response.json();
}

export async function fetchShippingDetail(orderId: string): Promise<Shipping> {
  const url = `${API_BASE_URL}/shippings/${orderId}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: "Failed to fetch shipping detail",
    };
    if (response.status === 404) {
      error.message = "データが見つかりません";
    }
    throw error;
  }

  const json = await response.json();
  // Handle both direct response and {success, data} response formats
  return json.data ?? json;
}

export async function updateShipping(
  orderId: string,
  data: UpdateShippingRequest
): Promise<Shipping> {
  const url = `${API_BASE_URL}/shippings/${orderId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = {
      status: response.status,
      message: errorData.message || errorData.errorMessage || "Failed to update shipping",
      errors: errorData.errors,
    };
    throw error;
  }

  const json = await response.json();
  // Handle both direct response and {success, data} response formats
  return json.data ?? json;
}

export async function fetchSummary(): Promise<ShippingSummary> {
  const url = `${API_BASE_URL}/shippings/summary`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch summary: ${response.status}`);
  }

  const json = await response.json();
  // Handle both direct response and {success, data} response formats
  return json.data ?? json;
}

export async function fetchPriorityShippings(
  limit: number = 5
): Promise<PriorityShipping[]> {
  const url = `${API_BASE_URL}/shippings/priority?limit=${limit}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // If API doesn't exist yet, return empty array for graceful degradation
      return [];
    }

    const data = await response.json();
    // Handle both array and {data: []} response formats
    return Array.isArray(data) ? data : (data?.data || []);
  } catch {
    // Network error or other issues - return empty array
    return [];
  }
}

export async function bulkUpdateShippings(
  data: BulkUpdateRequest
): Promise<BulkUpdateResponse> {
  const url = `${API_BASE_URL}/shippings/bulk`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = {
      status: response.status,
      message: errorData.message || "Failed to bulk update shippings",
      errors: errorData.errors,
    };
    throw error;
  }

  return response.json();
}

export async function fetchTimeline(orderId: string): Promise<TimelineEvent[]> {
  const url = `${API_BASE_URL}/shippings/${orderId}/timeline`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // If API doesn't exist yet, return empty array for graceful degradation
      return [];
    }

    const data = await response.json();
    // Handle both array and {data: []} response formats
    return Array.isArray(data) ? data : (data?.data || []);
  } catch {
    // Network error or other issues - return empty array
    return [];
  }
}
