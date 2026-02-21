import type { ReactNode } from "react";

import { AuthProvider } from "@/stores/auth/auth-provider";

/**
 * メインコンテンツ用レイアウト
 * AuthProvider でラップし、認証状態を管理
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
