"use client";

import { type ReactNode, useEffect } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { usePermissions } from "@/stores/auth/auth-provider";

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Admin ロール専用のガードコンポーネント
 * admin 以外のユーザーがアクセスした場合はダッシュボードへリダイレクト
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { hasRole } = usePermissions();
  const isAdmin = hasRole("admin");

  useEffect(() => {
    if (!isAdmin) {
      toast.error("このページにアクセスする権限がありません");
      router.replace("/dashboard");
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
