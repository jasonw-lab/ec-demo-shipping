/**
 * 認証ストア
 * Zustand を使用した認証状態管理
 */

import type { AxiosError } from "axios";
import { createStore } from "zustand/vanilla";

import { apiClient, clearAccessToken, setAccessToken } from "@/lib/api/client";
import type { ApiErrorResponse, AuthState, AuthStore, LoginResponse } from "@/lib/auth/types";
import { AUTH_ERROR_MESSAGES, AuthError } from "@/lib/auth/types";

/** Silent Refresh のスケジューラ ID */
let refreshTimerId: ReturnType<typeof setTimeout> | null = null;

/**
 * Silent Refresh をスケジュール
 * Access Token の残り有効期限が2分以下になった時点で自動更新
 */
function scheduleTokenRefresh(expiresAtMs: number, refreshFn: () => Promise<void>) {
  // 既存のタイマーをクリア
  if (refreshTimerId) {
    clearTimeout(refreshTimerId);
    refreshTimerId = null;
  }

  // 2分前に更新（最小1秒後）
  const REFRESH_THRESHOLD_MS = 2 * 60 * 1000;
  const timeUntilExpiry = expiresAtMs - Date.now();
  const refreshAt = Math.max(timeUntilExpiry - REFRESH_THRESHOLD_MS, 1000);

  refreshTimerId = setTimeout(async () => {
    try {
      await refreshFn();
    } catch (error) {
      console.error("Silent refresh failed:", error);
    }
  }, refreshAt);
}

/**
 * API エラーを AuthError に変換
 */
function handleAuthError(error: AxiosError<ApiErrorResponse>): AuthError {
  if (!error.response) {
    return new AuthError("network_error", AUTH_ERROR_MESSAGES.network_error);
  }

  const status = error.response.status;

  switch (status) {
    case 401:
      // ユーザー名/パスワード不一致またはアカウント無効
      return new AuthError("invalid_credentials", AUTH_ERROR_MESSAGES.invalid_credentials, 401);
    case 429:
      return new AuthError("rate_limit", AUTH_ERROR_MESSAGES.rate_limit, 429);
    default:
      return new AuthError("server_error", AUTH_ERROR_MESSAGES.server_error, status);
  }
}

/**
 * 認証ストアの初期状態
 */
const initialState: AuthState = {
  user: null,
  accessToken: null,
  expiresAt: null,
  isAuthenticated: false,
  isLoading: false,
};

/**
 * 認証ストアを作成
 */
export function createAuthStore(init?: Partial<AuthState>) {
  return createStore<AuthStore>()((set, get) => ({
    ...initialState,
    ...init,

    /**
     * ログイン処理
     */
    login: async (username: string, password: string) => {
      set({ isLoading: true });

      try {
        const response = await apiClient.post<LoginResponse>("/auth/login", {
          username,
          password,
        });

        const { access_token, expires_at, user } = response.data;

        // expires_at から有効期限を計算
        const expiresAtMs = new Date(expires_at).getTime();
        const expiresInSeconds = Math.floor((expiresAtMs - Date.now()) / 1000);

        // メモリ内にトークン保存
        setAccessToken(access_token, expiresInSeconds);

        // ストア更新
        set({
          user,
          accessToken: access_token,
          expiresAt: expiresAtMs,
          isAuthenticated: true,
          isLoading: false,
        });

        // Silent Refresh をスケジュール
        scheduleTokenRefresh(expiresAtMs, get().refreshToken);
      } catch (error) {
        set({ isLoading: false });
        throw handleAuthError(error as AxiosError<ApiErrorResponse>);
      }
    },

    /**
     * ログアウト処理
     */
    logout: async () => {
      set({ isLoading: true });

      try {
        // サーバー側でトークン無効化（ブラックリスト追加）
        await apiClient.post("/auth/logout");
      } catch (error) {
        // ログアウト API 失敗してもクライアント側はクリア
        console.error("Logout API error:", error);
      } finally {
        // タイマーをクリア
        if (refreshTimerId) {
          clearTimeout(refreshTimerId);
          refreshTimerId = null;
        }

        // トークン・状態をクリア
        clearAccessToken();
        set({
          ...initialState,
          isLoading: false,
        });
      }
    },

    /**
     * トークン更新
     */
    refreshToken: async () => {
      try {
        const response = await apiClient.post<LoginResponse>("/auth/refresh");
        const { access_token, expires_at, user } = response.data;

        // expires_at から有効期限を計算
        const expiresAtMs = new Date(expires_at).getTime();
        const expiresInSeconds = Math.floor((expiresAtMs - Date.now()) / 1000);

        // メモリ内にトークン保存
        setAccessToken(access_token, expiresInSeconds);

        // ストア更新
        set({
          user,
          accessToken: access_token,
          expiresAt: expiresAtMs,
          isAuthenticated: true,
        });

        // 次の Silent Refresh をスケジュール
        scheduleTokenRefresh(expiresAtMs, get().refreshToken);
      } catch (_error) {
        // リフレッシュ失敗時はログアウト
        get().clearAuth();
        throw new AuthError("token_expired", AUTH_ERROR_MESSAGES.token_expired, 401);
      }
    },

    /**
     * ローディング状態の設定
     */
    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    /**
     * 認証状態のクリア
     */
    clearAuth: () => {
      if (refreshTimerId) {
        clearTimeout(refreshTimerId);
        refreshTimerId = null;
      }
      clearAccessToken();
      set(initialState);
    },
  }));
}

export type AuthStoreApi = ReturnType<typeof createAuthStore>;
