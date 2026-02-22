/**
 * ユーザー管理 API
 * SCR-030 ユーザー管理画面
 */

import { apiClient } from "./client";

/** ユーザーロール */
export interface UserRole {
  code: string;
  name: string;
}

/** ユーザー情報 */
export interface UserData {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  is_active: boolean;
  roles: UserRole[];
  last_login_at: string | null;
  created_at: string;
  version: number;
}

/** ユーザー一覧レスポンス */
export interface UsersListResponse {
  success: boolean;
  data: UserData[];
  total: number;
  page: number;
  size: number;
}

/** ユーザー作成リクエスト */
export interface CreateUserRequest {
  username: string;
  display_name: string;
  email?: string;
  role: string;
  password: string;
}

/** ユーザー更新リクエスト */
export interface UpdateUserRequest {
  display_name: string;
  email?: string;
  role: string;
  version: number;
}

/** ステータス更新リクエスト */
export interface UpdateUserStatusRequest {
  is_active: boolean;
  version: number;
}

/** パスワードリセットリクエスト */
export interface ResetPasswordRequest {
  new_password: string;
}

/** フィルタパラメータ */
export interface UsersFilterParams {
  keyword?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  size?: number;
}

/**
 * API レスポンスからデータを抽出
 */
function unwrapData<T>(response: { data?: T } | T): T {
  if (response && typeof response === "object" && "data" in response && response.data !== undefined) {
    return response.data as T;
  }
  return response as T;
}

/**
 * ユーザー一覧を取得
 */
export async function fetchUsers(params: UsersFilterParams = {}): Promise<UsersListResponse> {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.set("keyword", params.keyword);
  if (params.role) searchParams.set("role", params.role);
  if (params.is_active !== undefined) searchParams.set("is_active", String(params.is_active));
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("size", String(params.size ?? 20));

  const query = searchParams.toString();
  const response = await apiClient.get(`/users${query ? `?${query}` : ""}`);

  // Handle wrapped response: { data: { data: [...], total, ... } } or direct: { data: [...], total, ... }
  const rawData = response.data?.data ?? response.data;

  // If rawData is an array, it's the users array directly (older API format)
  if (Array.isArray(rawData)) {
    return {
      success: true,
      data: rawData,
      total: rawData.length,
      page: params.page ?? 1,
      size: params.size ?? 20,
    };
  }

  // Otherwise it should be UsersListResponse format
  return {
    success: rawData.success ?? true,
    data: rawData.data ?? [],
    total: rawData.total ?? 0,
    page: rawData.page ?? params.page ?? 1,
    size: rawData.size ?? params.size ?? 20,
  };
}

/**
 * ユーザーを作成
 */
export async function createUser(data: CreateUserRequest): Promise<UserData> {
  const response = await apiClient.post("/users", data);
  return unwrapData(unwrapData(response.data));
}

/**
 * ユーザーを更新
 */
export async function updateUser(id: number, data: UpdateUserRequest): Promise<UserData> {
  const response = await apiClient.put(`/users/${id}`, data);
  return unwrapData(unwrapData(response.data));
}

/**
 * ユーザーステータスを更新
 */
export async function updateUserStatus(id: number, data: UpdateUserStatusRequest): Promise<UserData> {
  const response = await apiClient.put(`/users/${id}/status`, data);
  return unwrapData(unwrapData(response.data));
}

/**
 * パスワードをリセット
 */
export async function resetUserPassword(id: number, data: ResetPasswordRequest): Promise<void> {
  await apiClient.put(`/users/${id}/password`, data);
}

/**
 * ロール表示名を取得
 */
export function getRoleDisplayName(code: string): string {
  const roleNames: Record<string, string> = {
    admin: "システム管理者",
    operator: "オペレーター",
    viewer: "閲覧者",
  };
  return roleNames[code] ?? code;
}

/**
 * ロールコードの一覧
 */
export const ROLE_OPTIONS = [
  { value: "admin", label: "システム管理者" },
  { value: "operator", label: "オペレーター" },
  { value: "viewer", label: "閲覧者" },
] as const;
