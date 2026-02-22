# 画面リロード（Refresh）後に再ログインが求められる件

## 現象
- Admin UI でログイン後、ブラウザのリロード（F5 / ⌘R）を行うと `/login` にリダイレクトされ、再ログインが必要になる。

## 期待動作
- リロード後もセッションが復元され、ログイン状態のまま画面が表示される。

## 仕様/実装の前提（重要）
本リポジトリの認証（ADR-008 Phase 1）は以下の方針です。

- **Access Token はメモリ保持**（XSS 対策のため `localStorage/sessionStorage` に保存しない）
  - 例: `apps/admin-next-shadcn/src/lib/api/client.ts`
- **Refresh Token は HttpOnly Cookie**（ブラウザが保持・送信）
  - 例: `apps/api/internal/handler/auth_handler.go` の `Set-Cookie: refresh_token=...`
- リロード後は、メモリ上の Access Token が消えるため、UI は **`POST /api/v1/auth/refresh`** によりセッション復元を試みる
  - 例: `apps/admin-next-shadcn/src/stores/auth/auth-provider.tsx`

したがって **リロード後に再ログインが必要になるのは、`/auth/refresh` が失敗している**ことが直接原因です。

## 原因（よくあるパターン）
### A. Refresh Token Cookie が「保存されていない」（Secure 属性で破棄される）
- API が **`GIN_MODE=release`** 相当で動いているのに、ブラウザからのアクセスが **HTTP** の場合、
  `Secure` Cookie はブラウザに保存されません（結果として refresh_token が存在しない）。
- API 側実装は `GIN_MODE` により `Secure` を切り替えています。
  - `apps/api/internal/handler/auth_handler.go`:
    - `GIN_MODE != release` → 開発: `Secure=false`, `SameSite=Lax`
    - `GIN_MODE == release` → 本番: `Secure=true`, `SameSite=Strict`

### B. Refresh Token Cookie が「送信されていない」（ホスト不一致 / SameSite 判定）
- 例: UI を `http://127.0.0.1:3000` で開き、API を `http://localhost:8080` に向ける、など
  - `localhost` と `127.0.0.1` は別サイト扱いになり得るため、Cookie が期待通り送信されません。
- 結果として `/api/v1/auth/refresh` で `Refresh token not found` → UI は `/login` へ遷移します。

### C. CORS 設定により Cookie を含むリクエスト/レスポンスが成立していない
- `withCredentials: true`（UI 側）は設定されていても、API 側が以下を正しく返さないと Cookie が扱えません。
  - `Access-Control-Allow-Origin`（ワイルドカード不可）
  - `Access-Control-Allow-Credentials: true`
- API は `apps/api/internal/handler/router.go` の CORS ミドルウェアで制御し、`CORS_ALLOWED_ORIGINS` で追加許可します。

## 切り分け手順（最短）
1) **ログイン API のレスポンスに `Set-Cookie: refresh_token=...` が付いているか**（DevTools → Network → `/api/v1/auth/login`）
2) **ブラウザに refresh_token Cookie が保存されているか**（DevTools → Application → Cookies）
   - `Secure` が付いているのに HTTP でアクセスしていないか
   - `Path=/api/v1/auth` になっているか
3) リロード直後に **`POST /api/v1/auth/refresh` が 401 になっていないか**
   - 401 の場合、ほぼ Cookie 起因（未保存 or 未送信 or 期限切れ）

## 対策（ソース修正なし）
### 1) ローカル開発で HTTP のまま使う場合
- **API を `GIN_MODE=release` で起動しない**
  - 例（方針）: `GIN_MODE=debug` または `GIN_MODE` を未設定にする
- **UI と API のホスト名を揃える**
  - UI: `http://localhost:3000` で開く（`127.0.0.1` を避ける）
  - API: `http://localhost:8080` を使う
  - `NEXT_PUBLIC_API_URL` も同じホストに揃える（例: Next.js は `http://localhost:8080/api/v1`）
- 既に不整合が起きている場合は、一度 **Cookie を削除して再ログイン**（古い属性の Cookie が残っている可能性）

### 2) 本番相当（Secure Cookie 前提）で動かす場合
- **HTTPS でアクセスする**（ブラウザ→TLS 終端まで）
  - `Secure` Cookie が保存/送信され、リロード後に `/auth/refresh` が成功する前提が成立します。
- UI と API を **同一サイト配下**（同一 eTLD+1 / 同一 scheme）に配置する
  - 例: `https://admin.example.com` と `https://api.example.com`（同一 site）

### 3) CORS を使う構成の場合
- API 側で `CORS_ALLOWED_ORIGINS` に **実際の UI Origin（scheme+host+port）**を設定する
  - 例: `CORS_ALLOWED_ORIGINS=http://localhost:3000`

## 補足（設計上の注意）
- 「Access Token を永続化しない」設計のため、**リロード後の体験は `/auth/refresh` 成功が必須**です。
- `/auth/refresh` を跨げない構成（UI と API が別サイト、HTTPS なしで Secure Cookie が必須、など）では、
  仕様上リロード後の自動復元ができません（環境を揃えるか、Phase 2 以降の BFF/Proxy 方針が必要）。

