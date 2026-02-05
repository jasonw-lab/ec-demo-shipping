// Shipping API Client

import type {
  Shipping,
  ShippingSummary,
  ShippingListResponse,
  UpdateShippingRequest,
  ApiValidationError,
  ApiConflictError,
  ApiNotFoundError,
} from "@/lib/types/shipping";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ShippingApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ShippingApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json();
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  switch (response.status) {
    case 400: {
      if (isJson) {
        const error: ApiValidationError = await response.json();
        throw new ShippingApiError("Validation error", 400, error);
      }
      throw new ShippingApiError("Bad request", 400);
    }
    case 404: {
      if (isJson) {
        const error: ApiNotFoundError = await response.json();
        throw new ShippingApiError(error.error || "Not found", 404, error);
      }
      throw new ShippingApiError("Not found", 404);
    }
    case 409: {
      if (isJson) {
        const error: ApiConflictError = await response.json();
        throw new ShippingApiError(error.message || "Conflict", 409, error);
      }
      throw new ShippingApiError("Conflict", 409);
    }
    case 500: {
      if (isJson) {
        const error = await response.json();
        throw new ShippingApiError("Server error", 500, error);
      }
      throw new ShippingApiError("Server error", 500);
    }
    default:
      throw new ShippingApiError(`Unexpected status: ${response.status}`, response.status);
  }
}

export interface ShippingListParams {
  status?: string;
  carrier?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export const shippingApi = {
  /**
   * Get dashboard summary with status counts
   */
  async getSummary(): Promise<ShippingSummary> {
    const response = await fetch(`${API_BASE_URL}/shippings/summary`);
    return handleResponse<ShippingSummary>(response);
  },

  /**
   * Get shipping list with filters and pagination
   */
  async getList(params: ShippingListParams = {}): Promise<ShippingListResponse> {
    const query = new URLSearchParams();

    if (params.status) query.append("status", params.status);
    if (params.carrier) query.append("carrier", params.carrier);
    if (params.keyword) query.append("keyword", params.keyword);
    if (params.page) query.append("page", params.page.toString());
    if (params.size) query.append("size", params.size.toString());

    const url = `${API_BASE_URL}/shippings${query.toString() ? `?${query}` : ""}`;
    const response = await fetch(url);
    return handleResponse<ShippingListResponse>(response);
  },

  /**
   * Get shipping detail by order ID
   */
  async getDetail(orderId: string): Promise<Shipping> {
    const response = await fetch(`${API_BASE_URL}/shippings/${orderId}`);
    return handleResponse<Shipping>(response);
  },

  /**
   * Update shipping with optimistic locking
   */
  async update(orderId: string, data: UpdateShippingRequest): Promise<Shipping> {
    const response = await fetch(`${API_BASE_URL}/shippings/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Shipping>(response);
  },

  /**
   * Get priority shippings for dashboard alerts
   */
  async getPriority(limit = 5): Promise<Shipping[]> {
    const response = await fetch(`${API_BASE_URL}/shippings/priority?limit=${limit}`);
    return handleResponse<Shipping[]>(response);
  },
};
