/**
 * 認証 API サービス
 * Issue 506: 認証基盤
 * Issue 507: ログイン画面
 */
import { request } from '@umijs/max';
import type {
  ApiResponse,
  AuthError,
  AuthErrorType,
  LoginRequest,
  LoginResponse,
  User,
} from '@/lib/auth/types';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth/token';

/**
 * ログイン API
 * POST /api/v1/auth/login
 */
export async function login(params: LoginRequest): Promise<LoginResponse> {
  const response = await request<ApiResponse<LoginResponse> | LoginResponse>(
    '/api/v1/auth/login',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: params,
      withCredentials: true, // RefreshToken Cookie を受け取る
      skipErrorHandler: true, // 独自エラーハンドリング
    },
  );

  // レスポンスフォーマットの正規化（{ data: ... } or 直接）
  const data = 'data' in response && response.data ? response.data : response;
  const loginData = data as LoginResponse;

  // AccessToken をメモリに保存
  setAccessToken(loginData.access_token, loginData.expires_at);

  return loginData;
}

/**
 * トークンリフレッシュ API
 * POST /api/v1/auth/refresh
 */
export async function refreshToken(): Promise<LoginResponse | null> {
  try {
    console.log('[Auth] Attempting token refresh...');
    const response = await request<ApiResponse<LoginResponse> | LoginResponse>(
      '/api/v1/auth/refresh',
      {
        method: 'POST',
        withCredentials: true, // RefreshToken Cookie を送信
        skipErrorHandler: true,
      },
    );

    console.log('[Auth] Refresh response:', response);
    const data = 'data' in response && response.data ? response.data : response;
    const loginData = data as LoginResponse;
    console.log('[Auth] Refresh successful, user:', loginData.user);

    // AccessToken を更新
    setAccessToken(loginData.access_token, loginData.expires_at);

    return loginData;
  } catch (error) {
    console.error('[Auth] Refresh failed:', error);
    clearAccessToken();
    return null;
  }
}

/**
 * ログアウト API
 * POST /api/v1/auth/logout
 */
export async function logout(): Promise<void> {
  const token = getAccessToken();

  try {
    await request('/api/v1/auth/logout', {
      method: 'POST',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
      withCredentials: true,
      skipErrorHandler: true,
    });
  } catch {
    // ログアウトエラーは無視
  } finally {
    clearAccessToken();
  }
}

/**
 * 現在のユーザー情報を取得
 * リフレッシュトークンを使用してセッションを復元
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await refreshToken();
    return data?.user || null;
  } catch {
    return null;
  }
}

/**
 * HTTP ステータスコードからエラータイプを判定
 */
export function getErrorType(status: number): AuthErrorType {
  switch (status) {
    case 401:
      return 'invalid_credentials';
    case 403:
      return 'account_disabled';
    case 429:
      return 'rate_limit';
    default:
      if (status >= 500) {
        return 'server_error';
      }
      return 'unknown';
  }
}

/**
 * エラーメッセージを取得
 */
export function getErrorMessage(type: AuthErrorType): string {
  switch (type) {
    case 'invalid_credentials':
      return 'ユーザー名またはパスワードが正しくありません';
    case 'account_disabled':
      return 'このアカウントは無効化されています';
    case 'rate_limit':
      return 'ログイン試行回数が上限を超えました。しばらく経ってから再試行してください';
    case 'network_error':
      return 'ネットワークエラーが発生しました。接続を確認してください';
    case 'server_error':
      return 'システムエラーが発生しました。しばらく経ってから再試行してください';
    case 'token_expired':
      return 'セッションの有効期限が切れました。再度ログインしてください';
    default:
      return '予期しないエラーが発生しました';
  }
}

/**
 * API エラーを AuthError に変換
 */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof Error) {
    // Axios エラーの場合
    const axiosError = error as {
      response?: { status: number };
      request?: unknown;
    };

    if (axiosError.response) {
      const type = getErrorType(axiosError.response.status);
      return {
        type,
        message: getErrorMessage(type),
      };
    }

    if (axiosError.request) {
      return {
        type: 'network_error',
        message: getErrorMessage('network_error'),
      };
    }
  }

  return {
    type: 'unknown',
    message: getErrorMessage('unknown'),
  };
}
