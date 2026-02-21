/**
 * 認証関連の型定義
 * Issue 506: 認証基盤
 */

/** ユーザー情報 */
export interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/** ログインリクエスト */
export interface LoginRequest {
  username: string;
  password: string;
}

/** ログインレスポンス（バックエンド API） */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_at: string; // ISO 8601
  user: User;
}

/** API レスポンスラッパー */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/** 認証エラーの種類 */
export type AuthErrorType =
  | 'invalid_credentials'
  | 'account_disabled'
  | 'rate_limit'
  | 'network_error'
  | 'server_error'
  | 'token_expired'
  | 'unknown';

/** 認証エラー */
export interface AuthError {
  type: AuthErrorType;
  message: string;
}

/** CurrentUser（UMI Max initialState 用） */
export interface CurrentUser {
  name: string;
  avatar?: string;
  userid: string;
  email?: string;
  access: string;
  roles?: string[];
  permissions?: string[];
}

/** User から CurrentUser への変換 */
export function toCurrentUser(user: User): CurrentUser {
  return {
    name: user.display_name,
    userid: String(user.id),
    email: user.email,
    access: user.roles.includes('admin') ? 'admin' : 'user',
    roles: user.roles,
    permissions: user.permissions,
  };
}
