# Next Shadcn Dashboard (admin-next-shadcn) 実装Issue管理

**作成日**: 2026-02-01  
**対象プロジェクト**: Shipping Service Admin UI  
**UIベース**: Next.js + shadcn/ui + Next Shadcn Dashboard Starter  
**実装ディレクトリ**: `apps/admin-next-shadcn`  
**Issue採番範囲**: 1xx  
**ソースフォルダ構成**: Next Shadcn Dashboard独自の構成に従う  
**共通仕様**: [UI リファクタリング共通仕様](./ui-refactoring-common.md)  
**根拠 ADR**: [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)

---

## 📋 Next Shadcn Dashboard 実装概要

### Next Shadcn Dashboard の特徴
- **シンプル構成**: 最小限の設定で高速スタート
- **軽量**: 必要最小限の依存関係
- **カスタマイズ性**: shadcn/ui ベースで柔軟に拡張可能
- **公式URL**: https://github.com/Kiranism/next-shadcn-dashboard-starter

### Next Shadcn Dashboard 実装方針
- **🎨 Next Shadcn Dashboard スタイル維持**:
  - レイアウト・テーマシステムは変更しない
  - Next Shadcn Dashboard のソースコードをベースに開発
  - 全体的な画面スタイル・レイアウトシステムは維持
  - テーマ色の一貫性保証: Next Shadcn Dashboard 定義のカラーパレットのみ使用

- **♻️ Next Shadcn Dashboard 既存コンポーネント優先利用**:
  1. **Next Shadcn Dashboard の既存コンポーネント・パーツを最大限利用**（最優先）
     - `components/` 配下の既存コンポーネント
     - `components/ui/` 配下のUIコンポーネント
  2. **shadcn/ui標準コンポーネントを追加**（必要な場合）
     - Next Shadcn Dashboard のテーマに準拠してインストール
  3. **新規作成は最小限**（上記のいずれも適用できない場合のみ）
     - Next Shadcn Dashboard のスタイルガイドに厳密に準拠

**機能要件は全UIベースで共通**です。詳細は [UI リファクタリング共通仕様](./ui-refactoring-common.md) を参照してください。

---

## 🎯 Issue 一覧

**機能要件は [共通仕様](./ui-refactoring-common.md) を参照**してください。  
以下は Next Shadcn Dashboard 固有の実装詳細のみを記載します。

| Issue ID | 画面/機能 | 優先度 | 工数見積 | ステータス |
|---|---|---|---|---|
| [Issue 101](#issue-101-next-shadcn-dashboard-プロジェクトセットアップ) | プロジェクトセットアップ | P0 | 0.5日 | 🔴 未着手 |
| [Issue 102](#issue-102-next-shadcn-dashboard-レイアウトシステム整備) | レイアウトシステム整備 | P0 | 1日 | 🔴 未着手 |
| [Issue 103](#issue-103-next-shadcn-dashboard-ダッシュボード画面) | ダッシュボード画面 | P1 | 0.5〜1日 | 🔴 未着手 |
| [Issue 104](#issue-104-next-shadcn-dashboard-発送一覧画面) | 発送一覧画面 | P1 | 1日 | 🔴 未着手 |
| [Issue 105](#issue-105-next-shadcn-dashboard-発送詳細画面) | 発送詳細画面 | P1 | 0.5〜1日 | 🔴 未着手 |
| [Issue 106](#issue-106-認証基盤authcontext--api-client--route-guard) | 認証基盤（AuthContext / API Client / Route Guard） | P0 | 1.5日 | 🔴 未着手 |
| [Issue 107](#issue-107-ログイン画面scr-010) | ログイン画面（SCR-010） | P0 | 0.5〜1日 | 🔴 未着手 |
| [Issue 108](#issue-108-プロフィール画面scr-020) | プロフィール画面（SCR-020） | P1 | 0.5〜1日 | 🔴 未着手 |
| [Issue 109](#issue-109-ユーザー管理画面scr-030) | ユーザー管理画面（SCR-030） | P1 | 1〜1.5日 | 🔴 未着手 |
| [Issue 110](#issue-110-サイドバーヘッダー認証連携) | サイドバー・ヘッダー認証連携 | P1 | 0.5日 | 🔴 未着手 |

**合計工数見積**: 7.5〜10.5日（配送機能: 3.5〜4.5日 + 認証・ユーザー管理: 4〜6日）

---

## Issue 101: Next Shadcn Dashboard プロジェクトセットアップ

### 概要
Next Shadcn Dashboard Starter をベースに、Shipping Service 向けのプロジェクトを構築する。

### 実装内容

#### 1. プロジェクト初期化
```bash
# Next Shadcn Dashboard Starter のクローンまたはテンプレート利用
npx create-next-app@latest apps/admin-next-shadcn --example https://github.com/Kiranism/next-shadcn-dashboard-starter
```

#### 2. 依存関係の追加
- TanStack Query (データフェッチング)
- axios (HTTP クライアント)
- date-fns (日時処理)
- zod (バリデーション)

#### 3. プロジェクト構造確認
Next Shadcn Dashboard のディレクトリ構造をベースに、Shipping Service 向けにカスタマイズ。

### 技術スタック
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Next Shadcn Dashboard Starter
- **State**: TanStack Query
- **HTTP**: axios
- **Form**: React Hook Form + zod
- **Date**: date-fns

### 受け入れ条件
- [ ] プロジェクトが正常にビルド・起動する
- [ ] Next Shadcn Dashboard のコンポーネントが正常に動作する
- [ ] TanStack Query が正常に設定される
- [ ] API クライアントが正常に設定される

---

## Issue 102: Next Shadcn Dashboard レイアウトシステム整備

### 概要
Next Shadcn Dashboard の Layout System（Sidebar / Header / Theme）を基盤として整備する。

**機能要件**: [共通仕様 - Phase 1](./ui-refactoring-common.md#phase-1-レイアウトシステム統一) を参照

### Next Shadcn Dashboard 固有の実装詳細

#### 1. Layout System 整備
- Next Shadcn Dashboard のレイアウトをそのまま使用
- Sidebar / Header の実装は既存をベースに
- next-themes による Light/Dark Mode 切り替え

#### 2. テーマシステム検証・確定
- Next Shadcn Dashboard のテーマシステムをそのまま採用（変更なし）
- 既存の Tailwind CSS カスタムカラー設定を確認・検証
- Light/Dark Mode 切り替えが正常に動作することを検証

#### 3. ナビゲーション構造
```
Sidebar
 ├─ ダッシュボード (/)
 ├─ 発送一覧 (/shipments)
 ├─ ユーザー管理 (/users)          ← admin ロールのみ表示
 └─ プロフィール (/profile)
```

#### 4. レスポンシブ対応
- Sidebar の折りたたみ機能
- Mobile 表示対応（ハンバーガーメニュー）

### 使用コンポーネント
- Next Shadcn Dashboard: Layout System
- shadcn/ui: Button, Sheet (Mobile Menu)
- lucide-react: アイコン

### 受け入れ条件
- [ ] Light/Dark Mode が正常に切り替わる
- [ ] Sidebar が折りたたみ可能
- [ ] Mobile 表示で正常に動作
- [ ] すべてのページで共通レイアウトが適用される

---

## Issue 103: Next Shadcn Dashboard ダッシュボード画面

### 概要
ダッシュボード画面を Next Shadcn Dashboard ベースで実装する。

**機能要件**: [共通仕様 - 2-1. ダッシュボード画面](./ui-refactoring-common.md#2-1-ダッシュボード画面) を参照

### Next Shadcn Dashboard 固有の実装詳細

#### 1. KPI カード UI
- Next Shadcn Dashboard の Card コンポーネント
- クリッカブルデザイン（hover エフェクト）
- RETURNED カードの警告表示（赤色強調）

#### 2. 要対応発送リスト UI
- Next Shadcn Dashboard の Table コンポーネント
- コンパクト表示
- 「すべて表示」リンク

#### 3. レスポンシブ対応
- KPI カード: Grid レイアウト（Mobile: 1列、Tablet: 2列、Desktop: 4列）
- 要対応リスト: Horizontal Scroll 対応（Mobile）

### 使用コンポーネント
- Next Shadcn Dashboard: Card, Table, Badge
- shadcn/ui: Button
- TanStack Query: useQuery

### 受け入れ条件
- [ ] KPI カードが Next Shadcn Dashboard デザインで表示される
- [ ] KPI カードクリックで適切な発送一覧に遷移する
- [ ] RETURNED カードが警告表示される
- [ ] 要対応発送リストが正しく表示される（最大5件）
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

---

## Issue 104: Next Shadcn Dashboard 発送一覧画面

### 概要
発送一覧画面を Next Shadcn Dashboard ベースで実装する。

**機能要件**: [共通仕様 - 2-2. 発送一覧画面](./ui-refactoring-common.md#2-2-発送一覧画面) を参照

### Next Shadcn Dashboard 固有の実装詳細

#### 1. フィルタバー UI
- Next Shadcn Dashboard のコンポーネントによる横並び配置
- Select（ステータス、配送業者）
- Input（キーワード検索）
- Button（リセット）

#### 2. 発送一覧テーブル
- Next Shadcn Dashboard の Table コンポーネント
- カラム: Order ID, Status, Carrier, Tracking, Updated
- Badge による ステータス表示
- 行クリックで Sheet 表示（発送詳細）

#### 3. ソート対応
- Table のソート機能活用

#### 4. 一括操作
- Checkbox による複数選択
- DropdownMenu による一括操作メニュー
- CSVエクスポート機能

#### 5. ページネーション
- Next Shadcn Dashboard の Pagination コンポーネント

### 使用コンポーネント
- Next Shadcn Dashboard: Table, Card
- shadcn/ui: Select, Input, Button, Badge, Sheet, Checkbox, DropdownMenu, Pagination
- TanStack Query: useQuery, useMutation

### 受け入れ条件
- [ ] 発送一覧が正しく表示される
- [ ] 初期表示時に READY でフィルタされている
- [ ] フィルタ・検索が正常に動作する
- [ ] 行クリックで Sheet が開く
- [ ] ソートが正常に動作する
- [ ] 一括操作が動作する
- [ ] ページネーションが正常に動作する

---

## Issue 105: Next Shadcn Dashboard 発送詳細画面

### 概要
発送詳細画面を Next Shadcn Dashboard ベースで実装する（Sheet 形式）。

**機能要件**: [共通仕様 - 2-3. 発送詳細画面](./ui-refactoring-common.md#2-3-発送詳細画面) を参照

### Next Shadcn Dashboard 固有の実装詳細

#### 1. 基本情報表示
- Order ID, Status, 配送先住所
- Next Shadcn Dashboard の Card コンポーネント

#### 2. ステータスタイムライン
- カスタムタイムラインコンポーネント
- 完了: 緑、現在: 青、未到達: グレー

#### 3. 配送情報セクション
- 配送業者, 追跡番号（Copy 機能）
- Link（外部追跡リンク）
- 配送方法, 備考

#### 4. 操作エリア
- Select（ステータス選択）
- Button（更新、返送）
- ステータスに応じた操作可否制御

### 使用コンポーネント
- Next Shadcn Dashboard: Sheet, Card
- shadcn/ui: Badge, Button, Select, Separator
- TanStack Query: useQuery, useMutation
- React Hook Form + zod

### 受け入れ条件
- [ ] Sheet で発送詳細が表示される
- [ ] ステータスタイムラインが正しく表示される
- [ ] 配送情報が正しく表示される
- [ ] 追跡番号がコピーできる
- [ ] 外部追跡リンクが正常に動作する
- [ ] ステータス更新が正常に動作する
- [ ] 楽観ロック競合時にエラーが表示される

---

## Issue 106: 認証基盤（AuthContext / API Client / Route Guard）

### 概要
認証・認可の基盤レイヤーを実装する。ログイン画面・ユーザー管理画面など、他の認証系 Issue の前提条件となる。

**設計書**: [ADR-008: 認証・認可技術](../adr/ADR-008-authentication-authorization.md)  
**画面設計**: [SCR-010: ログイン画面](../design/SCR-010-login.md) Section 9.3, 9.4

### 実装内容

#### 1. AuthContext / AuthProvider
```typescript
// src/context/auth-context.tsx
interface AuthContext {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  roles: string[];
  permissions: string[];
}
```

- Access Token はメモリ内（Context state）で保持（localStorage/sessionStorage 不使用 — XSS 対策）
- Refresh Token は HttpOnly Cookie（ブラウザ自動管理）
- アプリ起動時に `/api/v1/auth/refresh` で認証状態を復元

#### 2. Axios API Client
```typescript
// src/lib/api-client.ts
- Base URL 設定（環境変数: NEXT_PUBLIC_API_URL）
- Authorization: Bearer ヘッダー自動付与（Request Interceptor）
- 401 レスポンス時の自動リフレッシュ + リトライ（Response Interceptor）
- withCredentials: true（Refresh Token Cookie 送信）
```

#### 3. Silent Refresh（ADR-008 Section 5.1）
```typescript
// Access Token の残り有効期限が 2分以下になった時点で自動更新
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000;

function scheduleTokenRefresh(expiresIn: number) {
  const refreshAt = (expiresIn * 1000) - REFRESH_THRESHOLD_MS;
  setTimeout(() => refreshToken(), refreshAt);
}
```

- `POST /api/v1/auth/refresh`（Cookie 自動送信）
- 失敗時: ログイン画面へリダイレクト

#### 4. Route Guard
```typescript
// src/components/auth/auth-guard.tsx
- 未認証: /auth/v2/login へリダイレクト
- 認証済み + ログインページアクセス: Dashboard (/) へリダイレクト

// src/components/auth/rbac-guard.tsx  
- パーミッションチェック: 不足時は Dashboard へリダイレクト + トースト
```

#### 5. RBAC ユーティリティ
```typescript
// src/lib/rbac.ts
function hasPermission(user: User, required: string): boolean
function hasRole(user: User, role: string): boolean
function hasAnyPermission(user: User, permissions: string[]): boolean
```

### 使用コンポーネント
- React Context API
- axios
- TanStack Query（QueryClient 認証状態連携）

### 受け入れ条件
- [ ] AuthProvider がアプリ全体をラップし、認証状態を提供する
- [ ] API Client が Authorization ヘッダーを自動付与する
- [ ] 401 レスポンス時に自動リフレッシュ + リトライが動作する
- [ ] Silent Refresh が Access Token 期限切れ前に自動実行される
- [ ] 未認証アクセスがログインページにリダイレクトされる
- [ ] 認証済みでのログインページアクセスが Dashboard にリダイレクトされる
- [ ] RBAC Guard が権限不足時にアクセスを制限する

---

## Issue 107: ログイン画面（SCR-010）

### 概要
Shipping Service Admin UI のログイン画面を実装する。既存の Next Shadcn Dashboard Sign In テンプレート（v2）をベースにカスタマイズする。

**画面設計**: [SCR-010: ログイン画面](../design/SCR-010-login.md)  
**依存**: Issue 106（認証基盤）

### Next Shadcn Dashboard 固有の実装詳細

#### 1. 既存テンプレートのカスタマイズ方針
**ベース**: `src/app/(main)/auth/v2/login/page.tsx` + `src/app/(main)/auth/v2/layout.tsx`

| 既存要素 | 対応 |
|---|---|
| Email 入力 → Username 入力 | フィールド変更（type="text", autocomplete="username"） |
| Google ボタン | 削除 |
| 「Or continue with」区切り | 削除 |
| Register リンク | 削除 |
| Remember me チェックボックス | 削除 |
| サイドパネルのテキスト | 「📦 Shipping Service Admin」に変更 |
| ENG / Globe | 削除（Phase 1 では日本語固定） |

#### 2. ログインフォーム
- ユーザー名: Input（placeholder: "ユーザー名を入力"）
- パスワード: Input（type: password） + 👁 表示切替ボタン
- ログインボタン: Button（primary、ローディング状態対応）
- エラー表示: Alert（カード内に赤色表示）

#### 3. 認証API連携
```typescript
POST /api/v1/auth/login
Request: { "username": "admin", "password": "admin123" }

Response (200): Access Token + User 情報
Refresh Token: Set-Cookie ヘッダで送信（HttpOnly; Secure; SameSite=Strict）
```

#### 4. エラーハンドリング

| HTTP Status | エラーメッセージ |
|---|---|
| 401 | "ユーザー名またはパスワードが正しくありません" |
| 429 | "ログイン試行回数が上限を超えました。しばらく待ってから再試行してください" |
| 500 | "システムエラーが発生しました。しばらく待ってから再試行してください" |

#### 5. バリデーション（zod）
- ユーザー名: 必須、3〜50文字
- パスワード: 必須、8文字以上

### ルーティング
```
/auth/login → ログイン画面（認証不要ルート）
```
- 既存の v1/v2 テンプレートは開発参照用として残置（不要になったら別途削除）

### 使用コンポーネント
- Next Shadcn Dashboard: auth/v2 Layout
- shadcn/ui: Card, Input, Button, Alert, Label
- React Hook Form + zod
- lucide-react: Eye, EyeOff, Loader2

### 受け入れ条件
- [ ] ログインフォームが Next Shadcn Dashboard v2 レイアウトで表示される
- [ ] ユーザー名 + パスワードでログインできる
- [ ] ログイン成功時に Dashboard (/) へ遷移する
- [ ] パスワード表示/非表示が切り替わる
- [ ] 認証エラー（401）が適切に表示される
- [ ] Rate Limit（429）が適切に表示される
- [ ] ログインボタンがローディング状態になる（二重送信防止）
- [ ] Enter キーでフォーム送信できる
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Desktop）

---

## Issue 108: プロフィール画面（SCR-020）

### 概要
ログイン中のユーザーが自身のプロフィール情報を確認・編集し、パスワードを変更する画面を実装する。

**画面設計**: [SCR-020: プロフィール画面](../design/SCR-020-profile.md)  
**依存**: Issue 106（認証基盤）、Issue 110（サイドバー連携）

### Next Shadcn Dashboard 固有の実装詳細

#### 1. プロフィール情報カード
- Next Shadcn Dashboard の Card コンポーネント使用
- 読み取り専用フィールド: ユーザー名（Text）、ロール（Badge）
- 編集可能フィールド: 表示名（Input）、メールアドレス（Input）
- アクション: キャンセル（outline Button）、保存（primary Button）

#### 2. パスワード変更カード
- 別カードで分離表示
- 現在のパスワード / 新しいパスワード / 確認パスワード
- パスワード変更ボタン

#### 3. API連携
```typescript
// プロフィール取得
GET /api/v1/users/me

// プロフィール更新（楽観ロック: version 送信）
PUT /api/v1/users/me
Request: { "display_name": "...", "email": "...", "version": 1 }

// パスワード変更
PUT /api/v1/users/me/password
Request: { "current_password": "...", "new_password": "..." }
```

#### 4. バリデーション（zod）
- 表示名: 必須、最大100文字
- メールアドレス: メール形式、最大255文字
- 現在のパスワード: 必須
- 新しいパスワード: 必須、8文字以上、現在と異なる
- 確認パスワード: 必須、新パスワードと一致

### ルーティング
```
/profile → プロフィール画面（認証必須、全ロール）
```

### 使用コンポーネント
- Next Shadcn Dashboard: Card
- shadcn/ui: Input, Button, Badge, Label, Toast, Separator
- React Hook Form + zod
- TanStack Query: useQuery, useMutation

### 受け入れ条件
- [ ] プロフィール情報が正常に表示される
- [ ] ユーザー名・ロールが読み取り専用で表示される
- [ ] 表示名・メールアドレスが編集・保存できる
- [ ] キャンセルで元の値に戻る
- [ ] 楽観ロック競合時（409）にエラーが表示される
- [ ] パスワード変更が正常に動作する
- [ ] 現在のパスワード不一致時にエラーが表示される
- [ ] ヘッダーのユーザー名表示が更新後に反映される
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile: 1カラム / Desktop: 最大幅600px中央配置）

---

## Issue 109: ユーザー管理画面（SCR-030）

### 概要
システム管理者（admin ロール）がユーザーアカウントを管理する画面を実装する。ユーザーの一覧表示、新規作成、編集、有効/無効切替、パスワードリセットを行う。

**画面設計**: [SCR-030: ユーザー管理画面](../design/SCR-030-user-management.md)  
**依存**: Issue 106（認証基盤）、Issue 110（サイドバー連携）

### Next Shadcn Dashboard 固有の実装詳細

#### 1. ヘッダーアクション
- ページタイトル: "👥 ユーザー管理"
- 「+ 新規ユーザー作成」ボタン（primary Button）

#### 2. 検索・フィルタバー
- Next Shadcn Dashboard のコンポーネントによる横並び配置
- キーワード検索: Input（表示名 / メールで部分一致）
- ロールフィルタ: Select（すべて / admin / operator / viewer）
- ステータスフィルタ: Select（すべて / 有効 / 無効）
- リセットボタン: Button（outline）

#### 3. ユーザー一覧テーブル
- Next Shadcn Dashboard の Table / DataTable コンポーネント
- カラム: ユーザー名, 表示名, メールアドレス, ロール（Badge）, ステータス（Badge）, 最終ログイン, 操作
- ソート: 各列クリックで昇順/降順
- ページネーション

#### ロール・ステータスバッジ配色
| ロール | 色 | 表示名 |
|---|---|---|
| admin | パープル系（destructive variant） | システム管理者 |
| operator | ブルー系（default variant） | オペレーター |
| viewer | グレー系（secondary variant） | 閲覧者 |

| ステータス | 色 |
|---|---|
| Active | グリーン系 |
| Inactive | レッド系 |

#### 4. ユーザー作成/編集ダイアログ
- Dialog コンポーネント使用
- 作成時: ユーザー名 + 表示名 + メール + ロール + 初期パスワード
- 編集時: ユーザー名（読み取り専用）+ 表示名 + メール + ロール
- React Hook Form + zod バリデーション

#### 5. 有効/無効切替
- AlertDialog で確認後に実行
- 無効化メッセージ: "無効化すると、このユーザーはログインできなくなります"
- 自分自身は無効化不可

#### 6. パスワードリセット
- Dialog で新しいパスワードを入力
- 「⚠️ リセット後、全セッションが無効化されます」警告表示
- 成功後: "新しいパスワードをユーザーに通知してください" トースト

#### 7. API連携
```typescript
// ユーザー一覧
GET /api/v1/users?page=1&size=20&keyword=...&role=...&is_active=...

// ユーザー作成
POST /api/v1/users
Request: { "username": "...", "display_name": "...", "email": "...", "role": "...", "password": "..." }

// ユーザー編集（楽観ロック: version 送信）
PUT /api/v1/users/:id
Request: { "display_name": "...", "email": "...", "role": "...", "version": 1 }

// ステータス切替（楽観ロック: version 送信）
PUT /api/v1/users/:id/status
Request: { "is_active": false, "version": 1 }

// パスワードリセット
PUT /api/v1/users/:id/password
Request: { "new_password": "..." }
```

#### 8. 権限ガード
- admin ロール以外がアクセス: Dashboard へリダイレクト + "権限がありません" トースト
- service ロールのユーザーは一覧に表示しない
- 自分自身のロール変更・無効化は不可

### ルーティング
```
/users → ユーザー管理画面（認証必須、admin ロール限定）
```

### 使用コンポーネント
- Next Shadcn Dashboard: Table / DataTable, Card
- shadcn/ui: Dialog, AlertDialog, Input, Select, Button, Badge, Toast, Label
- React Hook Form + zod
- TanStack Query: useQuery, useMutation

### 受け入れ条件
- [ ] ユーザー一覧が正しく表示される
- [ ] admin ロール以外はアクセス拒否される
- [ ] キーワード検索が動作する（表示名 / メール）
- [ ] ロール・ステータスフィルタが動作する
- [ ] ソートが動作する
- [ ] 新規ユーザーが作成できる
- [ ] ユーザー名重複時にエラーが表示される
- [ ] ユーザー情報が編集できる
- [ ] 楽観ロック競合時（409）にエラーが表示される
- [ ] ユーザーの有効/無効切替が動作する
- [ ] 自分自身は無効化できない
- [ ] パスワードリセットが動作する
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile: カード形式 / Desktop: テーブル）

---

## Issue 110: サイドバー・ヘッダー認証連携

### 概要
既存のサイドバー・ヘッダーレイアウトに認証関連のメニュー・ユーザー情報表示・ログアウト機能を追加する。

**依存**: Issue 106（認証基盤）

### Next Shadcn Dashboard 固有の実装詳細

#### 1. サイドバーメニュー追加
```
Sidebar
 ├─ 📊 ダッシュボード (/)
 ├─ 📦 発送一覧 (/shipments)
 ├─ ──────────────── （区切り線）
 ├─ 👤 プロフィール (/profile)          ← 全ロール
 └─ 👥 ユーザー管理 (/users)            ← admin ロールのみ表示
```

- admin ロール以外の場合、「ユーザー管理」メニューを非表示
- lucide-react アイコン: User（プロフィール）、Users（ユーザー管理）

#### 2. ヘッダーのユーザー情報表示
- 既存の Next Shadcn Dashboard ヘッダー右端にユーザー情報を表示
- ユーザーアバター（イニシャル）+ 表示名
- DropdownMenu:
  - プロフィール → `/profile` へ遷移
  - ログアウト → ログアウト処理実行

#### 3. ログアウト処理
```typescript
POST /api/v1/auth/logout
→ Access Token ブラックリスト登録
→ Refresh Token 削除（Set-Cookie で Cookie クリア）
→ AuthContext クリア
→ /auth/login へリダイレクト
```

#### 4. ロールベースメニュー制御
- AuthContext からユーザーロールを取得
- `hasRole(user, 'admin')` でメニュー表示を制御

### 使用コンポーネント
- Next Shadcn Dashboard: Sidebar, Header
- shadcn/ui: DropdownMenu, Avatar, Button, Separator
- lucide-react: User, Users, LogOut

### 受け入れ条件
- [ ] サイドバーにプロフィール・ユーザー管理メニューが表示される
- [ ] admin ロール以外で「ユーザー管理」メニューが非表示
- [ ] ヘッダーにユーザー名が表示される
- [ ] DropdownMenu からプロフィール画面に遷移できる
- [ ] ログアウトが正常に動作する（ログイン画面へリダイレクト）
- [ ] プロフィール更新後にヘッダーの表示名が即時反映される

---

## 📝 実装ルール

### コンポーネント設計
- **Server Components 優先**: データフェッチングは Server Components で
- **Client Components**: インタラクションが必要な場合のみ
- **Feature-based 構造**: ドメイン別にコンポーネント管理

### スタイリング
- **TailwindCSS**: ユーティリティクラス活用
- **Next Shadcn Dashboard スタイルガイド**: コンポーネントのカスタマイズは最小限
- **レスポンシブ**: Mobile First アプローチ

### 状態管理
- **TanStack Query**: サーバー状態管理
- **React Hook Form**: フォーム状態管理
- **URL State**: フィルタ・検索条件は URL パラメータで管理

---

## 🔗 関連ドキュメント

- [UI リファクタリング共通仕様](./ui-refactoring-common.md)
- [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)
- [ADR-008: 認証・認可技術](../adr/ADR-008-authentication-authorization.md)
- [SCR-010: ログイン画面設計書](../design/SCR-010-login.md)
- [SCR-020: プロフィール画面設計書](../design/SCR-020-profile.md)
- [SCR-030: ユーザー管理画面設計書](../design/SCR-030-user-management.md)
- [Next Shadcn Dashboard Starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
