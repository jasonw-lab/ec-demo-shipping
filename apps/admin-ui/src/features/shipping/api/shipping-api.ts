import type {
  Shipping,
  ShippingListParams,
  ShippingListResponse,
  UpdateShippingRequest,
  ApiError,
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

  return response.json();
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
      message: errorData.message || "Failed to update shipping",
      errors: errorData.errors,
    };
    throw error;
  }

  return response.json();
}
