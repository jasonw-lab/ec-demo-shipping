declare namespace ShippingAPI {
  /** 共通レスポンス形式 */
  interface Response<T> {
    success: boolean;
    data: T;
    errorCode?: number;
    errorMessage?: string;
  }

  /** 発送サマリ */
  interface Summary {
    created: number;
    ready: number;
    shipped_today: number;
    returned: number;
  }

  /** 発送データ */
  interface Shipping {
    id: number;
    order_id: string;
    status: string;
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

  /** 発送一覧レスポンス */
  interface ListResponse {
    success: boolean;
    data: Shipping[];
    total: number;
    page: number;
    size: number;
  }

  /** 発送一覧リクエストパラメータ */
  interface ListParams {
    status?: string;
    carrier?: string;
    keyword?: string;
    page?: number;
    size?: number;
  }
}
