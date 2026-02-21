# Ant Design (admin-antd) 実装Issue管理

**作成日**: 2026-02-01  
**対象プロジェクト**: Shipping Service Admin UI  
**UIベース**: React + Ant Design + Vite  
**実装ディレクトリ**: `apps/admin-antd`  
**Issue採番範囲**: 5xx  
**ソースフォルダ構成**: Ant Design独自の構成に従う  
**共通仕様**: [UI リファクタリング共通仕様](./ui-refactoring-common.md)  
**根拠 ADR**: [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md)

---

## 📋 Ant Design 実装概要

### Ant Design の特徴
- **エンタープライズ向け**: 豊富なコンポーネント、充実したドキュメント
- **デザインシステム**: 統一されたデザイン言語
- **Pro Components**: 高度なテーブル・フォーム機能
- **公式URL**: https://ant.design/

### Ant Design 実装方針
- **🎨 Ant Design デザインシステム準拠**:
  - Ant Design Design Values に準拠
  - カスタムテーマは最小限
  - Pro Components 活用

- **♻️ Ant Design コンポーネント活用**:
  1. **Ant Design 標準コンポーネント**（最優先）
     - Button, Card, Table, Form, Select, Input など
  2. **Pro Components**（高度な機能が必要な場合）
     - ProTable, ProForm, ProLayout
  3. **カスタムコンポーネント**（最小限）
     - Ant Design デザインガイドに準拠

**機能要件は全UIベースで共通**です。詳細は [UI リファクタリング共通仕様](./ui-refactoring-common.md) を参照してください。

---

## 🎯 Issue 一覧

**機能要件は [共通仕様](./ui-refactoring-common.md) を参照**してください。  
以下は Ant Design 固有の実装詳細のみを記載します。

| Issue ID | 画面/機能 | 優先度 | 工数見積 | ステータス |
|---|---|---|---|---|
| [Issue 501](#issue-501-ant-design-プロジェクトセットアップ) | プロジェクトセットアップ | P0 | 0.5日 | 🟢 完了 |
| [Issue 502](#issue-502-ant-design-レイアウトシステム整備) | レイアウトシステム整備 | P0 | 1日 | 🟢 完了 |
| [Issue 503](#issue-503-ant-design-ダッシュボード画面) | ダッシュボード画面 | P1 | 0.5〜1日 | 🟢 完了 |
| [Issue 504](#issue-504-ant-design-発送一覧画面) | 発送一覧画面 | P1 | 1日 | 🟢 完了 |
| [Issue 505](#issue-505-ant-design-発送詳細画面) | 発送詳細画面 | P1 | 0.5〜1日 | 🟢 完了 |
| [Issue 506](#issue-506-認証基盤initialstate--api-client--route-guard) | 認証基盤（initialState / API Client / Route Guard） | P0 | 1.5日 | 🔴 未着手 |
| [Issue 507](#issue-507-ログイン画面scr-010) | ログイン画面（SCR-010） | P0 | 0.5〜1日 | 🔴 未着手 |
| [Issue 508](#issue-508-プロフィール画面scr-020) | プロフィール画面（SCR-020） | P1 | 0.5〜1日 | 🔴 未着手 |
| [Issue 509](#issue-509-ユーザー管理画面scr-030) | ユーザー管理画面（SCR-030） | P1 | 1〜1.5日 | 🔴 未着手 |
| [Issue 510](#issue-510-サイドバーヘッダー認証連携) | サイドバー・ヘッダー認証連携 | P1 | 0.5日 | 🔴 未着手 |

**合計工数見積**: 7.5〜10.5日（配送機能: 3.5〜4.5日 + 認証・ユーザー管理: 4〜6日）

---

## Issue 501: Ant Design プロジェクトセットアップ

### 概要
Ant Design + Vite ベースの Frontend プロジェクトを構築する。

### 実装内容

#### 1. プロジェクト初期化
- Vite + React + TypeScript セットアップ
- ESLint + Prettier 設定
- Ant Design インストール

#### 2. Ant Design 設定
```bash
npm install antd @ant-design/icons
npm install @ant-design/pro-components
```

#### 3. ライブラリインストール
- TanStack Query (データフェッチング)
- axios (HTTP クライアント)
- dayjs (日時処理 - Ant Design 推奨)
- React Router (ルーティング)

#### 4. プロジェクト構造
```
apps/admin-antd/
├── src/
│   ├── components/        # 共通コンポーネント
│   ├── features/          # ドメイン別機能
│   │   └── shipping/
│   ├── layouts/           # レイアウト
│   ├── lib/               # ユーティリティ
│   │   ├── api-client.ts
│   │   └── utils.ts
│   ├── routes/            # ルーティング設定
│   ├── types/             # 型定義
│   ├── App.tsx
│   └── main.tsx
└── vite.config.ts
```

### 技術スタック
- **Framework**: Vite + React 18
- **UI**: Ant Design 5.x + Pro Components
- **State**: TanStack Query
- **HTTP**: axios
- **Form**: Ant Design Form
- **Date**: dayjs
- **Router**: React Router 6

### 受け入れ条件
- [ ] プロジェクトが正常にビルド・起動する
- [ ] Ant Design コンポーネントが正常に動作する
- [ ] TanStack Query が正常に設定される
- [ ] API クライアントが正常に設定される

---

## Issue 502: Ant Design レイアウトシステム整備

### 概要
Ant Design の ProLayout を使用してレイアウトシステムを整備する。

**機能要件**: [共通仕様 - Phase 1](./ui-refactoring-common.md#phase-1-レイアウトシステム統一) を参照

### Ant Design 固有の実装詳細

#### 1. ProLayout 整備
- ProLayout によるサイドバー・ヘッダー構成
- メニュー設定（ダッシュボード、発送一覧）
- Light/Dark Mode 切り替え

#### 2. テーマ設定
```typescript
// theme.config.ts
export const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
  algorithm: theme.defaultAlgorithm,
};
```

#### 3. ナビゲーション構造
```
Sidebar
 ├─ ダッシュボード (/)
 ├─ 発送一覧 (/shipments)
 ├─ ユーザー管理 (/users)          ← admin ロールのみ表示
 └─ プロフィール (/account/settings)
```

#### 4. レスポンシブ対応
- ProLayout の自動レスポンシブ機能活用
- Mobile 表示でサイドバー折りたたみ

### 使用コンポーネント
- @ant-design/pro-components: ProLayout
- antd: Menu, Button, Switch (Theme Toggle)
- @ant-design/icons: アイコン

### ファイル構造
```
apps/admin-antd/
└── src/
    ├── layouts/
    │   ├── dashboard-layout.tsx    # ProLayout ベース
    │   └── index.ts
    ├── config/
    │   └── theme.config.ts         # テーマ設定
    └── App.tsx                      # ConfigProvider 設定
```

### 受け入れ条件
- [ ] Light/Dark Mode が正常に切り替わる
- [ ] サイドバーが折りたたみ可能
- [ ] Mobile 表示で正常に動作
- [ ] すべてのページで共通レイアウトが適用される

---

## Issue 503: Ant Design ダッシュボード画面

### 概要
ダッシュボード画面を Ant Design ベースで実装する。

**機能要件**: [共通仕様 - 2-1. ダッシュボード画面](./ui-refactoring-common.md#2-1-ダッシュボード画面) を参照

### Ant Design 固有の実装詳細

#### 1. KPI カード UI
- ChartCard コンポーネント（既存のダッシュボードコンポーネント活用）
- クリッカブルデザイン（hover エフェクト）
- RETURNED カードの警告表示（赤色アイコン）

#### 2. 要対応発送リスト UI
- Ant Design Table コンポーネント
- コンパクト表示（size="small"）
- 「すべて表示」リンク

#### 3. レスポンシブ対応
- Col, Row による Grid レイアウト
- Mobile: 1列、Tablet: 2列、Desktop: 4列

### 使用コンポーネント
- antd: Card, Table, Tag (Status Badge), Row, Col, Skeleton, Tooltip
- @umijs/max: useRequest, useNavigate
- dayjs: 日時フォーマット

### ファイル構造
```
apps/admin-antd-pro/
└── src/
    ├── services/
    │   └── shipping/
    │       ├── api.ts           # API クライアント
    │       ├── typings.d.ts     # 型定義
    │       └── index.ts
    └── pages/
        └── shipping/
            └── summary/
                └── index.tsx    # ダッシュボード画面
```

### 受け入れ条件
- [x] KPI カードが Ant Design デザインで表示される
- [x] KPI カードクリックで適切な発送一覧に遷移する
- [x] RETURNED カードが警告表示（赤色アイコン）される
- [x] 要対応発送リストが正しく表示される（最大5件）
- [x] Light/Dark Mode で正常に表示される
- [x] レスポンシブ対応（Mobile / Tablet / Desktop）

---

## Issue 504: Ant Design 発送一覧画面

### 概要
発送一覧画面を Ant Design ベースで実装する。

**機能要件**: [共通仕様 - 2-2. 発送一覧画面](./ui-refactoring-common.md#2-2-発送一覧画面) を参照

### Ant Design 固有の実装詳細

#### 1. フィルタバー UI
- Space コンポーネントによる横並び配置
- Select（ステータス、配送業者）
- Input.Search（キーワード検索）
- Button（リセット）

#### 2. 発送一覧テーブル
- ProTable または Table コンポーネント
- カラム: Order ID, Status, Carrier, Tracking, Updated
- Tag による ステータス表示
- 行クリックで Drawer 表示（発送詳細）

#### 3. ソート対応
- Table の sorter プロパティ活用

#### 4. 一括操作
- Table の rowSelection プロパティ
- Dropdown による一括操作メニュー
- CSVエクスポート機能

#### 5. ページネーション
- Table 組み込みの Pagination

### 使用コンポーネント
- antd: Table (または ProTable), Select, Input, Button, Tag, Drawer, Checkbox, Dropdown, Space, Skeleton
- TanStack Query: useQuery, useMutation
- React Router: useSearchParams

### ファイル構造
```
apps/admin-antd/
└── src/
    └── features/
        └── shipping/
            ├── api/
            │   └── shipping-api.ts              # API クライアント
            ├── components/
            │   ├── shipping-list.tsx            # メインコンポーネント
            │   ├── filter-bar.tsx               # フィルタバー
            │   ├── shipping-table.tsx           # テーブル
            │   ├── shipping-detail-drawer.tsx   # Drawer（発送詳細）
            │   └── bulk-actions.tsx             # 一括操作
            └── types/
                └── shipping.ts                  # 型定義
```

### 受け入れ条件
- [x] 発送一覧が正しく表示される
- [x] 初期表示時に READY でフィルタされている
- [x] フィルタ・検索が正常に動作する
- [x] 行クリックで Drawer が開く
- [x] ソートが正常に動作する
- [x] 一括操作（ステータス変更、CSVエクスポート）が動作する
- [x] ページネーションが正常に動作する

---

## Issue 505: Ant Design 発送詳細画面

### 概要
発送詳細画面を Ant Design ベースで実装する（Drawer 形式）。

**機能要件**: [共通仕様 - 2-3. 発送詳細画面](./ui-refactoring-common.md#2-3-発送詳細画面) を参照

### Ant Design 固有の実装詳細

#### 1. 基本情報表示
- Descriptions コンポーネント
- Order ID, Status, 配送先住所

#### 2. ステータスタイムライン
- Steps コンポーネント（vertical）
- 完了: finish、現在: process、未到達: wait

#### 3. 配送情報セクション
- Descriptions コンポーネント
- 配送業者, 追跡番号（Copy 機能: Typography.Paragraph copyable）
- Button.Link（外部追跡リンク）
- 配送方法, 備考

#### 4. 操作エリア
- Form コンポーネント
- Select（ステータス選択）
- Button（更新、返送）
- ステータスに応じた操作可否制御

### 使用コンポーネント
- antd: Drawer, Descriptions, Steps, Tag, Button, Form, Select, Typography, Divider, Space, message (Toast)
- TanStack Query: useQuery, useMutation
- React Hook Form (オプション)

### ファイル構造
```
apps/admin-antd/
└── src/
    └── features/
        └── shipping/
            ├── api/
            │   └── shipping-api.ts              # API クライアント
            ├── components/
            │   ├── shipping-detail-drawer.tsx   # Drawer メイン
            │   ├── status-timeline.tsx          # タイムライン
            │   ├── shipping-info.tsx            # 配送情報
            │   └── shipping-actions.tsx         # 操作エリア
            └── types/
                └── shipping.ts                  # 型定義
```

### 受け入れ条件
- [x] Drawer で発送詳細が表示される
- [x] ステータスタイムラインが正しく表示される
- [x] 配送情報が正しく表示される
- [x] 追跡番号がコピーできる
- [x] 外部追跡リンクが正常に動作する
- [x] ステータス更新が正常に動作する
- [x] 楽観ロック競合時にエラーが表示される

---

## Issue 506: 認証基盤（initialState / API Client / Route Guard）

### 概要
認証・認可の基盤レイヤーを実装する。UmiJS の `initialState` モデルと `access` プラグインを活用する。他の認証系 Issue の前提条件。

**設計書**: [ADR-008: 認証・認可技術](../adr/ADR-008-authentication-authorization.md)
**画面設計**: [SCR-010: ログイン画面](../design/SCR-010-login.md) Section 9.3, 9.4

### Ant Design Pro 固有の実装詳細

#### 1. initialState モデル拡張
```typescript
// src/app.tsx - getInitialState()
export async function getInitialState() {
  const fetchUserInfo = async () => {
    const response = await apiClient.get('/api/v1/users/me');
    return response.data;
  };
  // ログインページ以外ではユーザー情報を取得
  if (!isLoginPage) {
    const currentUser = await fetchUserInfo();
    return { currentUser, fetchUserInfo };
  }
  return { fetchUserInfo };
}
```
- Access Token はメモリ内（変数）で保持（XSS 対策）
- Refresh Token は HttpOnly Cookie（ブラウザ自動管理）
- `getInitialState` でアプリ起動時に認証状態を復元

#### 2. Axios API Client
```typescript
// src/services/api-client.ts
- Base URL 設定（環境変数: API_URL）
- Authorization: Bearer ヘッダー自動付与（Request Interceptor）
- 401 レスポンス時の自動リフレッシュ + リトライ（Response Interceptor）
- withCredentials: true（Refresh Token Cookie 送信）
```

#### 3. Silent Refresh（ADR-008 Section 5.1）
- Access Token の残り有効期限が **2分以下** になった時点で自動更新
- `POST /api/v1/auth/refresh`（Cookie 自動送信）
- 失敗時: ログイン画面へリダイレクト

#### 4. UmiJS Access Plugin（Route Guard）
```typescript
// src/access.ts
export default function access(initialState: { currentUser?: API.CurrentUser }) {
  const { currentUser } = initialState ?? {};
  return {
    canAdmin: currentUser?.roles?.includes('admin'),
    canAccess: !!currentUser,
  };
}
```
- UmiJS ルート設定の `access` プロパティで認可制御
- 未認証: `/user/login` へリダイレクト
- 認証済み + ログインページアクセス: Dashboard (/) へリダイレクト

#### 5. RBAC ユーティリティ
```typescript
// src/utils/rbac.ts
function hasPermission(user: CurrentUser, required: string): boolean
function hasRole(user: CurrentUser, role: string): boolean
```

### 受け入れ条件
- [ ] `getInitialState` でユーザー情報を取得・提供する
- [ ] API Client が Authorization ヘッダーを自動付与する
- [ ] 401 レスポンス時に自動リフレッシュ + リトライが動作する
- [ ] Silent Refresh が Access Token 期限切れ前に自動実行される
- [ ] 未認証アクセスがログインページにリダイレクトされる
- [ ] `access` プラグインで admin 専用ページが保護される

---

## Issue 507: ログイン画面（SCR-010）

### 概要
Shipping Service Admin UI のログイン画面を実装する。既存の Ant Design Pro `LoginForm` テンプレートをベースにカスタマイズする。

**画面設計**: [SCR-010: ログイン画面](../design/SCR-010-login.md)
**依存**: Issue 506（認証基盤）

### Ant Design Pro 固有の実装詳細

#### 1. 既存テンプレートのカスタマイズ方針
**ベース**: `src/pages/user/login/index.tsx`

| 既存要素 | 対応 |
|---|---|
| Tabs（アカウント/モバイル） | モバイルタブ削除 |
| Alipay/Taobao/Weibo アイコン | 削除 |
| ProFormCheckbox（自動ログイン） | 削除 |
| 忘れたパスワード リンク | 削除 |
| logo + title | 「📦 Shipping Service Admin」に変更 |
| i18n（中国語デフォルト） | 日本語デフォルトに切替 |
| `login()` mock service | Shipping API に差し替え |

#### 2. ログインフォーム
- `@ant-design/pro-components` の `LoginForm` コンポーネントを継続使用
- `ProFormText` (username) + `ProFormText.Password` (password)
- `UserOutlined` / `LockOutlined` アイコン維持
- エラー表示: `Alert` コンポーネント（既存の `LoginMessage` を活用）

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
| 429 | "ログイン試行回数が上限を超えました" |
| 500 | "システムエラーが発生しました" |

#### 5. バリデーション（Ant Design Form rules）
- ユーザー名: required, min: 3, max: 50
- パスワード: required, min: 8

### ルーティング
```
/user/login → ログイン画面（既存 UmiJS ルートを維持）
```

### 受け入れ条件
- [ ] ログインフォームが Ant Design Pro レイアウトで表示される
- [ ] ユーザー名 + パスワードでログインできる
- [ ] ログイン成功時に Dashboard (/) へ遷移する
- [ ] 認証エラー（401）が Alert で適切に表示される
- [ ] Rate Limit（429）が適切に表示される
- [ ] ログインボタンがローディング状態になる
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応

---

## Issue 508: プロフィール画面（SCR-020）

### 概要
ログイン中のユーザーが自身のプロフィール情報を確認・編集し、パスワードを変更する画面を実装する。既存の `account/settings` テンプレートをベースにカスタマイズする。

**画面設計**: [SCR-020: プロフィール画面](../design/SCR-020-profile.md)
**依存**: Issue 506（認証基盤）、Issue 510（サイドバー連携）

### Ant Design Pro 固有の実装詳細

#### 1. 既存テンプレートのカスタマイズ方針
**ベース**: `src/pages/account/settings/index.tsx`

| 既存タブ | 対応 |
|---|---|
| 基本設定 (base) | → プロフィール情報（表示名、メール） |
| 安全设置 (security) | → パスワード変更 |
| 账号绑定 (binding) | 削除 |
| 新消息通知 (notification) | 削除 |

#### 2. プロフィール情報タブ
- Ant Design `Form` + `Descriptions` コンポーネント
- 読み取り専用: ユーザー名、ロール（Tag）
- 編集可能: 表示名（Input）、メールアドレス（Input）
- アクション: キャンセル、保存

#### 3. パスワード変更タブ
- Ant Design `Form` コンポーネント
- 現在のパスワード / 新しいパスワード / 確認パスワード
- パスワード変更ボタン

#### 4. API連携
```typescript
GET /api/v1/users/me                 // プロフィール取得
PUT /api/v1/users/me                 // プロフィール更新（楽観ロック: version）
PUT /api/v1/users/me/password        // パスワード変更
```

#### 5. バリデーション（Ant Design Form rules）
- 表示名: required, max: 100
- メールアドレス: type: 'email', max: 255
- 現在のパスワード: required
- 新しいパスワード: required, min: 8
- 確認パスワード: required, validator で新パスワードと一致確認

### ルーティング
```
/account/settings → プロフィール画面（既存 UmiJS ルートを維持、認証必須）
```

### 受け入れ条件
- [ ] プロフィール情報が正常に表示される
- [ ] ユーザー名・ロールが読み取り専用で表示される
- [ ] 表示名・メールアドレスが編集・保存できる
- [ ] 楽観ロック競合時（409）にエラーが表示される
- [ ] パスワード変更が正常に動作する
- [ ] 現在のパスワード不一致時にエラーが表示される
- [ ] ヘッダーのユーザー名表示が更新後に反映される
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応

---

## Issue 509: ユーザー管理画面（SCR-030）

### 概要
システム管理者（admin ロール）がユーザーアカウントを管理する画面を実装する。

**画面設計**: [SCR-030: ユーザー管理画面](../design/SCR-030-user-management.md)
**依存**: Issue 506（認証基盤）、Issue 510（サイドバー連携）

### Ant Design Pro 固有の実装詳細

#### 1. ヘッダーアクション
- ページタイトル: "👥 ユーザー管理"
- 「+ 新規ユーザー作成」ボタン（primary Button）

#### 2. 検索・フィルタバー
- ProTable の search 機能を活用
- キーワード検索: Input（表示名 / メールで部分一致）
- ロールフィルタ: Select（すべて / admin / operator / viewer）
- ステータスフィルタ: Select（すべて / 有効 / 無効）

#### 3. ユーザー一覧テーブル
- **ProTable** コンポーネント使用
- カラム: ユーザー名, 表示名, メールアドレス, ロール（Tag）, ステータス（Tag）, 最終ログイン, 操作
- ソート: ProTable 組み込みの sorter
- ページネーション: ProTable 組み込み

#### ロール・ステータス Tag 配色
| ロール | 色 | 表示名 |
|---|---|---|
| admin | purple | システム管理者 |
| operator | blue | オペレーター |
| viewer | default | 閲覧者 |

| ステータス | 色 |
|---|---|
| Active | green |
| Inactive | red |

#### 4. ユーザー作成/編集 Modal
- antd `Modal` + `Form` コンポーネント
- 作成時: ユーザー名 + 表示名 + メール + ロール + 初期パスワード
- 編集時: ユーザー名（読み取り専用）+ 表示名 + メール + ロール

#### 5. 有効/無効切替
- `Modal.confirm` で確認後に実行
- 自分自身は無効化不可

#### 6. パスワードリセット
- Modal で新しいパスワードを入力
- 「⚠️ リセット後、全セッションが無効化されます」警告表示

#### 7. API連携
```typescript
GET /api/v1/users?page=1&size=20&keyword=...&role=...&is_active=...
POST /api/v1/users
PUT /api/v1/users/:id           { ..., "version": 1 }
PUT /api/v1/users/:id/status    { "is_active": false, "version": 1 }
PUT /api/v1/users/:id/password  { "new_password": "..." }
```

#### 8. 権限ガード
- UmiJS `access` プラグインで admin ロール限定
- service ロールのユーザーは一覧に表示しない
- 自分自身のロール変更・無効化は不可

### ルーティング
```
/users → ユーザー管理画面（認証必須、admin ロール限定）
```

### 受け入れ条件
- [ ] ユーザー一覧が ProTable で正しく表示される
- [ ] admin ロール以外はアクセス拒否される
- [ ] キーワード検索が動作する
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
- [ ] レスポンシブ対応

---

## Issue 510: サイドバー・ヘッダー認証連携

### 概要
既存の ProLayout サイドバー・ヘッダーに認証関連のメニュー・ユーザー情報表示・ログアウト機能を追加する。

**依存**: Issue 506（認証基盤）

### Ant Design Pro 固有の実装詳細

#### 1. ProLayout メニュー追加
```
Sidebar
 ├─ 📊 ダッシュボード (/)
 ├─ 📦 発送一覧 (/shipments)
 ├─ ──────────────── （区切り線）
 ├─ 👤 プロフィール (/account/settings)  ← 全ロール
 └─ 👥 ユーザー管理 (/users)              ← admin ロールのみ表示
```
- UmiJS ルート設定の `access` プロパティで表示制御
- @ant-design/icons: UserOutlined, TeamOutlined

#### 2. ヘッダー右側のユーザー情報
- 既存の `AvatarDropdown` コンポーネントをカスタマイズ
- ユーザーアバター（Avatar）+ 表示名
- Dropdown メニュー:
  - プロフィール → `/account/settings` へ遷移
  - ログアウト → ログアウト処理実行

#### 3. ログアウト処理
```typescript
POST /api/v1/auth/logout
→ Access Token ブラックリスト登録
→ Refresh Token 削除（Set-Cookie で Cookie クリア）
→ initialState クリア
→ /user/login へリダイレクト
```

#### 4. ロールベースメニュー制御
- UmiJS `access` プラグインで `canAdmin` チェック
- メニューの `access` プロパティで表示制御

### 受け入れ条件
- [ ] サイドバーにプロフィール・ユーザー管理メニューが表示される
- [ ] admin ロール以外で「ユーザー管理」メニューが非表示
- [ ] ヘッダーにユーザー名が表示される
- [ ] Dropdown からプロフィール画面に遷移できる
- [ ] ログアウトが正常に動作する（ログイン画面へリダイレクト）
- [ ] プロフィール更新後にヘッダーの表示名が即時反映される

---

## 📝 実装ルール

### コンポーネント設計
- **Feature-based 構造**: ドメイン別にコンポーネント管理
- **Ant Design コンポーネント活用**: カスタムコンポーネントは最小限
- **Pro Components 活用**: ProTable, ProForm, LoginForm など高度な機能で活用

### スタイリング
- **Ant Design デザインシステム**: 標準デザインを尊重
- **カスタムテーマ**: 必要最小限のテーマカスタマイズ
- **レスポンシブ**: Grid システム（Row, Col）活用

### 状態管理
- **UmiJS initialState**: グローバル状態（認証ユーザー情報）
- **useRequest / TanStack Query**: サーバー状態管理
- **Ant Design Form**: フォーム状態管理
- **URL State**: フィルタ・検索条件は URL パラメータで管理

---

## 🔗 関連ドキュメント

- [UI リファクタリング共通仕様](./ui-refactoring-common.md)
- [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md)
- [ADR-008: 認証・認可技術](../adr/ADR-008-authentication-authorization.md)
- [SCR-010: ログイン画面設計書](../design/SCR-010-login.md)
- [SCR-020: プロフィール画面設計書](../design/SCR-020-profile.md)
- [SCR-030: ユーザー管理画面設計書](../design/SCR-030-user-management.md)
- [Ant Design 公式ドキュメント](https://ant.design/)
- [Pro Components](https://procomponents.ant.design/)
