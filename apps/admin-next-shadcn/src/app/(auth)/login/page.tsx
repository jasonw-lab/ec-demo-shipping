"use client";

import { Suspense, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Loader2, Package } from "lucide-react";

import { useAuth } from "@/stores/auth/auth-provider";

import { LoginForm } from "./_components/login-form";

/**
 * ログインページのコンテンツ
 */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  // 既に認証済みの場合はダッシュボードへリダイレクト
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const returnUrl = searchParams.get("returnUrl");
      router.replace(returnUrl || "/dashboard/default");
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // 認証済みの場合は何も表示しない（リダイレクト中）
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-lg border bg-card p-8 shadow-sm">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Shipping Service Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">ログインしてください</p>
        </div>

        {/* ログインフォーム */}
        <LoginForm />
      </div>
    </div>
  );
}

/**
 * ローディングフォールバック
 */
function LoginFallback() {
  return (
    <div className="flex h-32 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * SCR-010 ログイン画面
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Suspense fallback={<LoginFallback />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
