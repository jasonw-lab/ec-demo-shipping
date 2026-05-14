// Types
export interface Summary {
  created: number;
  ready: number;
  shipped_today: number;
  returned: number;
}

export interface Shipping {
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errorCode?: number;
  errorMessage?: string;
}

export interface ListResponse {
  success: boolean;
  data: Shipping[];
  total: number;
  page: number;
  size: number;
}

export interface ListParams {
  status?: string;
  carrier?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface UpdateParams {
  status: string;
  carrier?: string;
  tracking_number?: string;
  version: number;
}

// Mock mode flag - set to true for development without API
const USE_MOCK = false;

// API Base URL
const API_BASE_URL = '/api/v1';

// ==============================|| MOCK DATA ||============================== //

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

let mockShippings: Shipping[] = [
  {
    id: 1,
    order_id: 'ORD-2024-001',
    status: 'CREATED',
    carrier: null,
    tracking_number: null,
    shipping_address: '東京都渋谷区神南1-2-3 テストビル101',
    ready_at: null,
    shipped_at: null,
    delivered_at: null,
    version: 1,
    created_at: twoDaysAgo.toISOString(),
    updated_at: twoDaysAgo.toISOString()
  },
  {
    id: 2,
    order_id: 'ORD-2024-002',
    status: 'READY',
    carrier: null,
    tracking_number: null,
    shipping_address: '大阪府大阪市北区梅田1-1-1 グランフロント202',
    ready_at: yesterday.toISOString(),
    shipped_at: null,
    delivered_at: null,
    version: 2,
    created_at: threeDaysAgo.toISOString(),
    updated_at: yesterday.toISOString()
  },
  {
    id: 3,
    order_id: 'ORD-2024-003',
    status: 'READY',
    carrier: null,
    tracking_number: null,
    shipping_address: '愛知県名古屋市中区栄3-4-5 栄ビル303',
    ready_at: now.toISOString(),
    shipped_at: null,
    delivered_at: null,
    version: 1,
    created_at: yesterday.toISOString(),
    updated_at: now.toISOString()
  },
  {
    id: 4,
    order_id: 'ORD-2024-004',
    status: 'SHIPPED',
    carrier: 'YAMATO',
    tracking_number: '1234-5678-9012',
    shipping_address: '福岡県福岡市博多区博多駅前2-3-4',
    ready_at: twoDaysAgo.toISOString(),
    shipped_at: yesterday.toISOString(),
    delivered_at: null,
    version: 3,
    created_at: threeDaysAgo.toISOString(),
    updated_at: yesterday.toISOString()
  },
  {
    id: 5,
    order_id: 'ORD-2024-005',
    status: 'SHIPPED',
    carrier: 'SAGAWA',
    tracking_number: '9876-5432-1098',
    shipping_address: '北海道札幌市中央区大通西5-6-7',
    ready_at: twoDaysAgo.toISOString(),
    shipped_at: now.toISOString(),
    delivered_at: null,
    version: 3,
    created_at: threeDaysAgo.toISOString(),
    updated_at: now.toISOString()
  },
  {
    id: 6,
    order_id: 'ORD-2024-006',
    status: 'DELIVERED',
    carrier: 'JAPANPOST',
    tracking_number: '5555-6666-7777',
    shipping_address: '京都府京都市下京区四条通河原町東入',
    ready_at: threeDaysAgo.toISOString(),
    shipped_at: twoDaysAgo.toISOString(),
    delivered_at: yesterday.toISOString(),
    version: 4,
    created_at: threeDaysAgo.toISOString(),
    updated_at: yesterday.toISOString()
  },
  {
    id: 7,
    order_id: 'ORD-2024-007',
    status: 'RETURNED',
    carrier: 'YAMATO',
    tracking_number: '1111-2222-3333',
    shipping_address: '神奈川県横浜市西区みなとみらい1-2-3',
    ready_at: threeDaysAgo.toISOString(),
    shipped_at: twoDaysAgo.toISOString(),
    delivered_at: null,
    version: 4,
    created_at: threeDaysAgo.toISOString(),
    updated_at: yesterday.toISOString()
  },
  {
    id: 8,
    order_id: 'ORD-2024-008',
    status: 'CREATED',
    carrier: null,
    tracking_number: null,
    shipping_address: '兵庫県神戸市中央区三宮町1-2-3',
    ready_at: null,
    shipped_at: null,
    delivered_at: null,
    version: 1,
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  },
  {
    id: 9,
    order_id: 'ORD-2024-009',
    status: 'READY',
    carrier: null,
    tracking_number: null,
    shipping_address: '広島県広島市中区紙屋町1-2-3',
    ready_at: now.toISOString(),
    shipped_at: null,
    delivered_at: null,
    version: 2,
    created_at: yesterday.toISOString(),
    updated_at: now.toISOString()
  },
  {
    id: 10,
    order_id: 'ORD-2024-010',
    status: 'SHIPPED',
    carrier: 'YAMATO',
    tracking_number: '4444-5555-6666',
    shipping_address: '宮城県仙台市青葉区一番町3-4-5',
    ready_at: yesterday.toISOString(),
    shipped_at: now.toISOString(),
    delivered_at: null,
    version: 3,
    created_at: twoDaysAgo.toISOString(),
    updated_at: now.toISOString()
  }
];

function getMockSummary(): Summary {
  return {
    created: mockShippings.filter(s => s.status === 'CREATED').length,
    ready: mockShippings.filter(s => s.status === 'READY').length,
    shipped_today: mockShippings.filter(s => {
      if (s.status !== 'SHIPPED' || !s.shipped_at) return false;
      const shippedDate = new Date(s.shipped_at);
      const today = new Date();
      return shippedDate.toDateString() === today.toDateString();
    }).length,
    returned: mockShippings.filter(s => s.status === 'RETURNED').length
  };
}

function getMockPriorityShippings(limit: number): Shipping[] {
  const priority = mockShippings
    .filter(s => ['CREATED', 'READY', 'RETURNED'].includes(s.status))
    .sort((a, b) => {
      // RETURNED first, then CREATED (older first), then READY
      if (a.status === 'RETURNED' && b.status !== 'RETURNED') return -1;
      if (a.status !== 'RETURNED' && b.status === 'RETURNED') return 1;
      if (a.status === 'CREATED' && b.status !== 'CREATED') return -1;
      if (a.status !== 'CREATED' && b.status === 'CREATED') return 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  return priority.slice(0, limit);
}

function getMockShippings(params: ListParams): { data: Shipping[]; total: number } {
  let filtered = [...mockShippings];

  if (params.status) {
    filtered = filtered.filter(s => s.status === params.status);
  }
  if (params.carrier) {
    filtered = filtered.filter(s => s.carrier === params.carrier);
  }
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filtered = filtered.filter(s =>
      s.order_id.toLowerCase().includes(keyword) ||
      (s.tracking_number && s.tracking_number.toLowerCase().includes(keyword))
    );
  }

  const total = filtered.length;
  const page = params.page || 1;
  const size = params.size || 20;
  const start = (page - 1) * size;
  const end = start + size;

  return {
    data: filtered.slice(start, end),
    total
  };
}

function getMockShipping(orderId: string): Shipping | null {
  return mockShippings.find(s => s.order_id === orderId) || null;
}

function updateMockShipping(orderId: string, data: UpdateParams): Shipping | null {
  const index = mockShippings.findIndex(s => s.order_id === orderId);
  if (index === -1) return null;

  const shipping = mockShippings[index];

  // Simulate optimistic locking
  if (shipping.version !== data.version) {
    throw new Error('CONFLICT');
  }

  const now = new Date().toISOString();
  const updated: Shipping = {
    ...shipping,
    status: data.status,
    carrier: data.carrier || shipping.carrier,
    tracking_number: data.tracking_number || shipping.tracking_number,
    version: shipping.version + 1,
    updated_at: now
  };

  // Update timestamp fields based on status
  if (data.status === 'READY' && !updated.ready_at) {
    updated.ready_at = now;
  }
  if (data.status === 'SHIPPED' && !updated.shipped_at) {
    updated.shipped_at = now;
  }
  if (data.status === 'DELIVERED' && !updated.delivered_at) {
    updated.delivered_at = now;
  }

  mockShippings[index] = updated;
  return updated;
}

// ==============================|| API FUNCTIONS ||============================== //

/**
 * Fetch with error handling and auth
 */
async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>)
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        data: data.data,
        errorCode: response.status,
        errorMessage: data.message || data.error || 'Request failed'
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      data: null as unknown as T,
      errorCode: 500,
      errorMessage: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * 発送サマリ取得
 * GET /api/v1/shipments/summary
 */
export async function getSummary(): Promise<ApiResponse<Summary>> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, data: getMockSummary() };
  }
  return fetchApi<Summary>('/shipments/summary');
}

/**
 * 優先対応発送一覧取得
 * GET /api/v1/shipments/priority
 */
export async function getPriorityShippings(limit = 5): Promise<ApiResponse<Shipping[]>> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, data: getMockPriorityShippings(limit) };
  }
  return fetchApi<Shipping[]>(`/shipments/priority?limit=${limit}`);
}

/**
 * 発送一覧取得
 * GET /api/v1/shipments
 */
export async function getShippings(params: ListParams = {}): Promise<ListResponse> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const result = getMockShippings(params);
    return {
      success: true,
      data: result.data,
      total: result.total,
      page: params.page || 1,
      size: params.size || 20
    };
  }

  const searchParams = new URLSearchParams();

  if (params.status) searchParams.append('status', params.status);
  if (params.carrier) searchParams.append('carrier', params.carrier);
  if (params.keyword) searchParams.append('keyword', params.keyword);
  if (params.page) searchParams.append('page', String(params.page));
  if (params.size) searchParams.append('size', String(params.size));

  const queryString = searchParams.toString();
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/shipments${queryString ? `?${queryString}` : ''}`, {
    headers,
    credentials: 'include'
  });
  return response.json();
}

/**
 * 発送詳細取得
 * GET /api/v1/shipments/:orderId
 */
export async function getShipping(orderId: string): Promise<ApiResponse<Shipping>> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const shipping = getMockShipping(orderId);
    if (shipping) {
      return { success: true, data: shipping };
    }
    return { success: false, data: null as unknown as Shipping, errorCode: 404, errorMessage: 'Not found' };
  }
  return fetchApi<Shipping>(`/shipments/${orderId}`);
}

/**
 * 発送更新
 * PUT /api/v1/shipments/:orderId
 */
export async function updateShipping(orderId: string, data: UpdateParams): Promise<ApiResponse<Shipping>> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const shipping = updateMockShipping(orderId, data);
      if (shipping) {
        return { success: true, data: shipping };
      }
      return { success: false, data: null as unknown as Shipping, errorCode: 404, errorMessage: 'Not found' };
    } catch (error) {
      if (error instanceof Error && error.message === 'CONFLICT') {
        return { success: false, data: null as unknown as Shipping, errorCode: 409, errorMessage: 'Conflict' };
      }
      throw error;
    }
  }
  return fetchApi<Shipping>(`/shipments/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// Constants
export const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  CREATED: 'default',
  READY: 'primary',
  SHIPPED: 'success',
  DELIVERED: 'info',
  RETURNED: 'error',
  CANCELLED: 'warning'
};

export const STATUS_LABELS: Record<string, string> = {
  CREATED: '未着手',
  READY: '出荷準備中',
  SHIPPED: '出荷済み',
  DELIVERED: '配達完了',
  RETURNED: '返送',
  CANCELLED: 'キャンセル'
};

export const CARRIER_NAMES: Record<string, string> = {
  YAMATO: 'ヤマト運輸',
  SAGAWA: '佐川急便',
  JAPANPOST: '日本郵便'
};

export const CARRIER_TRACKING_URLS: Record<string, string> = {
  YAMATO: 'https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id=',
  SAGAWA: 'https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=',
  JAPANPOST: 'https://trackings.post.japanpost.jp/services/srv/search/?requestNo1='
};
