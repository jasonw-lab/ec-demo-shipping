import type { ReactNode } from "react";

/**
 * 認証ページ用レイアウト
 * サイドバーなどは表示しないシンプルなレイアウト
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
