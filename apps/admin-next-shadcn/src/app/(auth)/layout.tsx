import type { ReactNode } from "react";

import { AuthProvider } from "@/stores/auth/auth-provider";

/**
 * 認証ページ用レイアウト
 * AuthProvider を含むが、サイドバーなどは表示しない
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
