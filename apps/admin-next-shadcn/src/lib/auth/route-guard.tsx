"use client";

import { type ReactNode, useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";

import { useAuth, usePermissions } from "@/stores/auth/auth-provider";

interface RouteGuardProps {
  children: ReactNode;
  /** 必要なロール（いずれか1つを満たせばOK） */
  requiredRoles?: string[];
  /** 必要な権限（いずれか1つを満たせばOK） */
  requiredPermissions?: string[];
  /** 権限不足時のリダイレクト先 */
  fallbackUrl?: string;
}

/**
 * 認証・認可を検証するガードコンポーネント
 *
 * - 未認証: /login へリダイレクト
 * - 権限不足: /unauthorized または指定の fallbackUrl へリダイレクト
 */
export function RouteGuard({
  children,
  requiredRoles,
  requiredPermissions,
  fallbackUrl = "/unauthorized",
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAnyRole, hasAnyPermission } = usePermissions();

  useEffect(() => {
    // ローディング中は何もしない
    if (isLoading) return;

    // 未認証の場合はログイン画面へ
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // ロール検証
    if (requiredRoles && requiredRoles.length > 0) {
      if (!hasAnyRole(requiredRoles)) {
        router.replace(fallbackUrl);
        return;
      }
    }

    // 権限検証
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasAnyPermission(requiredPermissions)) {
        router.replace(fallbackUrl);
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    pathname,
    requiredRoles,
    requiredPermissions,
    fallbackUrl,
    router,
    hasAnyRole,
    hasAnyPermission,
  ]);

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 未認証または権限不足の場合は何も表示しない（リダイレクト中）
  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return null;
  }

  if (requiredPermissions && requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * 特定のロールを持つユーザーのみに表示するコンポーネント
 */
export function RequireRole({
  roles,
  children,
  fallback,
}: {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasAnyRole } = usePermissions();

  if (!hasAnyRole(roles)) {
    return fallback ?? null;
  }

  return <>{children}</>;
}

/**
 * 特定の権限を持つユーザーのみに表示するコンポーネント
 */
export function RequirePermission({
  permissions,
  children,
  fallback,
}: {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasAnyPermission } = usePermissions();

  if (!hasAnyPermission(permissions)) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
