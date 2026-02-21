/**
 * アクセス制御
 * Issue 506: 認証基盤
 * @see https://umijs.org/docs/max/access#access
 */
import type { CurrentUser } from '@/lib/auth/types';

export default function access(
  initialState: { currentUser?: CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  const roles = currentUser?.roles || [];
  const permissions = currentUser?.permissions || [];

  /**
   * ロールをチェック
   */
  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  /**
   * パーミッションをチェック（ワイルドカード対応）
   * 例: "shipping:*" は "shipping:read", "shipping:write" にマッチ
   */
  const hasPermission = (permission: string): boolean => {
    return permissions.some((p) => {
      if (p === permission) return true;
      // ワイルドカードチェック
      if (p.endsWith(':*')) {
        const prefix = p.slice(0, -1); // "shipping:" を取得
        return permission.startsWith(prefix);
      }
      return false;
    });
  };

  return {
    // 基本的なアクセス権
    canAdmin: currentUser?.access === 'admin' || hasRole('admin'),

    // ロールベースのアクセス
    hasRole,
    hasPermission,

    // 発送管理権限
    canViewShipping: hasPermission('shipping:read') || hasPermission('shipping:*'),
    canEditShipping: hasPermission('shipping:write') || hasPermission('shipping:*'),

    // ユーザー管理権限
    canViewUsers: hasPermission('user:read') || hasPermission('user:*'),
    canEditUsers: hasPermission('user:write') || hasPermission('user:*'),

    // システム管理権限
    canViewSystem: hasPermission('system:read') || hasPermission('system:*'),
    canEditSystem: hasPermission('system:write') || hasPermission('system:*'),
  };
}
