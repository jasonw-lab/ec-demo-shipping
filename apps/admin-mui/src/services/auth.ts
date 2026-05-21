// Auth Service - API functions for authentication

export interface User {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  errorCode?: number;
  errorMessage?: string;
}

const API_BASE_URL = '/api/v1';

/**
 * Fetch with error handling
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
      credentials: 'include' // For cookies (refresh token)
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

/**
 * Login
 * POST /api/v1/auth/login
 */
export async function login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
  const response = await fetchApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });

  if (response.success && response.data) {
    // Store access token in localStorage
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response;
}

/**
 * Logout
 * POST /api/v1/auth/logout
 */
export async function logout(): Promise<ApiResponse<{ message: string }>> {
  const response = await fetchApi<{ message: string }>('/auth/logout', {
    method: 'POST'
  });

  // Clear tokens regardless of response
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');

  return response;
}

/**
 * Refresh token
 * POST /api/v1/auth/refresh
 */
export async function refreshToken(): Promise<ApiResponse<{ access_token: string; expires_in: number }>> {
  const response = await fetchApi<{ access_token: string; expires_in: number }>('/auth/refresh', {
    method: 'POST'
  });

  if (response.success && response.data) {
    localStorage.setItem('access_token', response.data.access_token);
  }

  return response;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Check if user has role
 */
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.roles.includes(role) ?? false;
}

/**
 * Check if user has permission
 */
export function hasPermission(permission: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  // Check exact match or wildcard
  return user.permissions.some(p =>
    p === permission ||
    p === '*' ||
    (p.endsWith(':*') && permission.startsWith(p.slice(0, -1)))
  );
}
