import Link from "next/link";

import { Lock } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <Lock className="mx-auto size-12 text-destructive" />
        <h1 className="mt-4 font-bold text-3xl tracking-tight sm:text-4xl">アクセス権限がありません</h1>
        <p className="mt-4 text-muted-foreground">
          このページを表示する権限がありません。 この問題が続く場合は、システム管理者にお問い合わせください。
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow-xs transition-colors hover:bg-primary/90 focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
            prefetch={false}
          >
            ダッシュボードへ戻る
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 font-medium text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
            prefetch={false}
          >
            ログイン画面へ
          </Link>
        </div>
      </div>
    </div>
  );
}
