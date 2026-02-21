/**
 * API クライアント
 * ADR-008 Phase 1: Shipping API 内蔵の JWT 認証
 *
 * - Access Token はメモリ内に保持（XSS 対策）
 * - Refresh Token は HttpOnly Cookie（ブラウザが自動管理）
 * - Silent Refresh: Access Token 残り有効期限 2分以下で自動更新
 */

import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { AuthError } from "@/lib/auth/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// トークン更新中のフラグ（二重リクエスト防止）
let isRefreshing = false;
// トークン更新待ちのリクエストキュー
let refreshSubscribers: Array<(token: string) => void> = [];

/**
 * トークン更新完了時に待機中リクエストを再実行
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * トークン更新待ちのリクエストをキューに追加
 */
function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Access Token をメモリで管理
 */
let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

export function setAccessToken(token: string | null, expiresIn?: number) {
  accessToken = token;
  if (token && expiresIn) {
    tokenExpiresAt = Date.now() + expiresIn * 1000;
  } else {
    tokenExpiresAt = null;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  tokenExpiresAt = null;
}

/**
 * トークン更新が必要かチェック（残り2分以下）
 */
export function shouldRefreshToken(): boolean {
  if (!accessToken || !tokenExpiresAt) return false;
  const REFRESH_THRESHOLD_MS = 2 * 60 * 1000; // 2分
  return tokenExpiresAt - Date.now() <= REFRESH_THRESHOLD_MS;
}

/**
 * Axios インスタンスを作成
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true, // Cookie 送信用
  });

  // リクエストインターセプター: Authorization ヘッダー追加
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // レスポンスインターセプター: 401 エラー時にトークン更新
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // 401 エラーかつリトライ未実施の場合
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        originalRequest.url !== "/auth/login" &&
        originalRequest.url !== "/auth/refresh"
      ) {
        if (isRefreshing) {
          // 他のリクエストがリフレッシュ中の場合は待機
          return new Promise((resolve) => {
            addRefreshSubscriber((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await client.post("/auth/refresh");
          const { access_token, expires_at } = response.data;

          // expires_at から有効期限を計算
          const expiresAtMs = new Date(expires_at).getTime();
          const expiresInSeconds = Math.floor((expiresAtMs - Date.now()) / 1000);

          setAccessToken(access_token, expiresInSeconds);
          onTokenRefreshed(access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return client(originalRequest);
        } catch (refreshError) {
          // リフレッシュ失敗: ログアウト処理
          clearAccessToken();
          refreshSubscribers = [];

          // ログイン画面へリダイレクト
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }

          return Promise.reject(new AuthError("token_expired", "セッションが期限切れです", 401));
        } finally {
          isRefreshing = false;
        }
      }

      // その他のエラーはそのままスロー
      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
