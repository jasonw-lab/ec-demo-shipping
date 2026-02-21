"use client";

import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useStore } from "zustand";

import { apiClient, setAccessToken } from "@/lib/api/client";
import type { AuthStore } from "@/lib/auth/types";

import { type AuthStoreApi, createAuthStore } from "./auth-store";

const AuthStoreContext = createContext<AuthStoreApi | null>(null);

/** 認証不要のパス */
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password"];

/** パスが公開パスかどうかをチェック */
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const storeRef = useRef<AuthStoreApi | null>(null);
  const sessionCheckedRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  if (!storeRef.current) {
    storeRef.current = createAuthStore();
  }

  // 初回マウント時にセッション確認（一度だけ実行）
  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    // 既にセッションチェック済み、または認証済みの場合はスキップ
    if (sessionCheckedRef.current) {
      return;
    }

    const checkSession = async () => {
      // 公開パスの場合はスキップ
      if (isPublicPath(pathname)) {
        return;
      }

      const state = store.getState();
      if (state.isAuthenticated) {
        sessionCheckedRef.current = true;
        return;
      }

      sessionCheckedRef.current = true;
      store.setState({ isLoading: true });

      try {
        // HttpOnly Cookie で Refresh Token があれば、セッション復元を試みる
        const response = await apiClient.post("/auth/refresh");
        // Handle both wrapped { data: {...} } and direct response formats
        const data = response.data.data ?? response.data;
        const { access_token, expires_at, user } = data;

        // expires_at から有効期限を計算
        const expiresAtMs = new Date(expires_at).getTime();
        const expiresInSeconds = Math.floor((expiresAtMs - Date.now()) / 1000);

        setAccessToken(access_token, expiresInSeconds);

        store.setState({
          user,
          accessToken: access_token,
          expiresAt: expiresAtMs,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        // セッション復元失敗: ログイン画面へリダイレクト
        store.setState({ isLoading: false });
        router.replace("/login");
      }
    };

    checkSession();
  }, [pathname, router]);

  return <AuthStoreContext.Provider value={storeRef.current}>{children}</AuthStoreContext.Provider>;
}

/**
 * 認証ストアを使用するカスタムフック
 */
export function useAuthStore<T>(selector: (state: AuthStore) => T): T {
  const store = useContext(AuthStoreContext);
  if (!store) {
    throw new Error("useAuthStore must be used within an AuthProvider");
  }
  return useStore(store, selector);
}

/**
 * 認証状態を取得するカスタムフック
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}

/**
 * 権限チェック用フック
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;

    // ワイルドカード対応: "shipping:*" は "shipping:read" などにマッチ
    return user.permissions.some((p) => {
      if (p === permission) return true;
      if (p.endsWith(":*")) {
        const prefix = p.slice(0, -1); // "shipping:*" -> "shipping:"
        return permission.startsWith(prefix);
      }
      return false;
    });
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  return {
    roles: user?.roles ?? [],
    permissions: user?.permissions ?? [],
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,
  };
}
