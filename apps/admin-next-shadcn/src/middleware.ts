import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Next.js Middleware for Route Protection
 *
 * Note: JWT 検証はクライアントサイドで実施（メモリ内トークン管理のため）
 * このミドルウェアは基本的なルーティング制御のみを行う
 */

/** 認証不要のパブリックパス */
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/unauthorized"];

/** 静的アセットのパス */
const STATIC_PATHS = ["/_next", "/favicon.ico", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的アセットはスキップ
  if (STATIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // パブリックパスはスキップ
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Note: JWT はメモリ内に保持されるため、ミドルウェアでは検証できない
  // クライアントサイドの AuthProvider で認証状態をチェックし、
  // 必要に応じてログイン画面へリダイレクトする
  //
  // Refresh Token は HttpOnly Cookie で管理されるが、
  // ミドルウェアでの検証は Phase 2 以降（BFF/Gateway 導入時）に検討

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
