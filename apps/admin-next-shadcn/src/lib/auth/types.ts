/**
 * 認証関連の型定義
 * ADR-008 Phase 1: Shipping API 内蔵の JWT 認証
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

/** ログインレスポンス */
export interface LoginResponse {
  success: boolean;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: User;
  };
}

/** API エラーレスポンス */
export interface ApiErrorResponse {
  code: string;
  message: string;
}

/** 認証状態 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** 認証アクション */
export interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

/** 認証ストア（状態 + アクション） */
export type AuthStore = AuthState & AuthActions;

/** 認証エラーの種類 */
export type AuthErrorType =
  | "invalid_credentials"
  | "account_disabled"
  | "rate_limit"
  | "network_error"
  | "server_error"
  | "token_expired";

/** 認証エラー */
export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** エラーメッセージのマッピング */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  invalid_credentials: "ユーザー名またはパスワードが正しくありません",
  account_disabled: "アカウントが無効化されています。管理者に連絡してください",
  rate_limit: "ログイン試行回数が上限を超えました。しばらく待ってから再試行してください",
  network_error: "サーバーに接続できません",
  server_error: "システムエラーが発生しました。しばらく待ってから再試行してください",
  token_expired: "セッションが期限切れです。再度ログインしてください",
};
