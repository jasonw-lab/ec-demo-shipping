import type { ShippingListParams, ShippingListResponse } from "../types";

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
