// User Service - API functions for user management

export interface Role {
  id?: number;
  code: string;
  name: string;
  description?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  roles: Role[];
  last_login_at: string | null;
  created_at: string;
  version: number;
}

export interface User {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  is_active: boolean;
  roles: Role[];
  last_login_at: string | null;
  created_at: string;
  version: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errorCode?: number;
  errorMessage?: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  size: number;
}

export interface UserListParams {
  keyword?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  size?: number;
}

export interface CreateUserRequest {
  username: string;
  display_name: string;
  email?: string;
  role: string;
  password: string;
}

export interface UpdateUserRequest {
  display_name: string;
  email?: string;
  role: string;
  version: number;
}

export interface UpdateProfileRequest {
  display_name: string;
  email?: string;
  version: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  new_password: string;
}

export interface UpdateStatusRequest {
  is_active: boolean;
  version: number;
}

const API_BASE_URL = '/api/v1';

/**
 * Fetch with auth handling
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
        errorMessage: data.errorMessage || data.message || data.error || 'Request failed'
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

// ==============================|| PROFILE API ||============================== //

/**
 * Get my profile
 * GET /api/v1/users/me
 */
export async function getProfile(): Promise<ApiResponse<UserProfile>> {
  return fetchApi<UserProfile>('/users/me');
}

/**
 * Update my profile
 * PUT /api/v1/users/me
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
  return fetchApi<UserProfile>('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * Change my password
 * PUT /api/v1/users/me/password
 */
export async function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ==============================|| USER MANAGEMENT API (Admin) ||============================== //

/**
 * Get user list
 * GET /api/v1/users
 */
export async function getUsers(params: UserListParams = {}): Promise<ListResponse<User>> {
  const searchParams = new URLSearchParams();

  if (params.keyword) searchParams.append('keyword', params.keyword);
  if (params.role) searchParams.append('role', params.role);
  if (params.is_active !== undefined) searchParams.append('is_active', String(params.is_active));
  if (params.page) searchParams.append('page', String(params.page));
  if (params.size) searchParams.append('size', String(params.size));

  const queryString = searchParams.toString();
  const response = await fetch(`${API_BASE_URL}/users${queryString ? `?${queryString}` : ''}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    },
    credentials: 'include'
  });

  return response.json();
}

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
export async function getUser(id: number): Promise<ApiResponse<User>> {
  return fetchApi<User>(`/users/${id}`);
}

/**
 * Create user
 * POST /api/v1/users
 */
export async function createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
  return fetchApi<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Update user
 * PUT /api/v1/users/:id
 */
export async function updateUser(id: number, data: UpdateUserRequest): Promise<ApiResponse<User>> {
  return fetchApi<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * Update user status
 * PUT /api/v1/users/:id/status
 */
export async function updateUserStatus(id: number, data: UpdateStatusRequest): Promise<ApiResponse<User>> {
  return fetchApi<User>(`/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * Reset user password
 * PUT /api/v1/users/:id/password
 */
export async function resetUserPassword(id: number, data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
  return fetchApi<{ message: string }>(`/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ==============================|| ROLES API ||============================== //

/**
 * Get roles list
 * GET /api/v1/roles
 */
export async function getRoles(): Promise<ApiResponse<Role[]>> {
  return fetchApi<Role[]>('/roles');
}

// ==============================|| CONSTANTS ||============================== //

export const ROLE_COLORS: Record<string, 'secondary' | 'primary' | 'default'> = {
  admin: 'secondary',
  operator: 'primary',
  viewer: 'default'
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'システム管理者',
  operator: 'オペレーター',
  viewer: '閲覧者'
};
