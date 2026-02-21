/**
 * AccessToken のメモリ管理
 * XSS 対策: localStorage/sessionStorage ではなくメモリに保持
 * Issue 506: 認証基盤
 */

let accessToken: string | null = null;
let expiresAt: number | null = null;

/** AccessToken を取得 */
export function getAccessToken(): string | null {
  return accessToken;
}

/** AccessToken を設定 */
export function setAccessToken(token: string, expiresAtIso: string): void {
  accessToken = token;
  expiresAt = new Date(expiresAtIso).getTime();
}

/** AccessToken をクリア */
export function clearAccessToken(): void {
  accessToken = null;
  expiresAt = null;
}

/** トークンが有効かどうか */
export function isTokenValid(): boolean {
  if (!accessToken || !expiresAt) {
    return false;
  }
  // 2分の余裕を持ってチェック
  return Date.now() < expiresAt - 2 * 60 * 1000;
}

/** トークンの有効期限（ミリ秒） */
export function getExpiresAt(): number | null {
  return expiresAt;
}

/** トークンの残り時間（ミリ秒） */
export function getRemainingTime(): number {
  if (!expiresAt) {
    return 0;
  }
  return Math.max(0, expiresAt - Date.now());
}

/** トークンがリフレッシュ必要か（残り2分以下） */
export function needsRefresh(): boolean {
  if (!accessToken || !expiresAt) {
    return false;
  }
  return getRemainingTime() <= 2 * 60 * 1000;
}
