# Shipping Service UI ↔ API Interface Mapping

**Version:** 0.6.1
**Status:** Final (Refined Roles API)
**Scope:** Shipping Service Admin UI – Backend API Contract

---

## 1. 目的

本ドキュメントは、Shipping Service における
**Admin UI（React / Ant Design Pro / MUI）と Backend API（Go）間のインターフェース対応関係**を定義する。

本版（v0.6.0）では、以下を反映した。

- 認証 API（login / refresh / logout）の追加
- ユーザー管理 API（CRUD / profile / password）の追加
- ロール・パーミッション参照 API の追加
- API エンドポイントの統一 (`/api/v1/shipments`, `/api/v1/auth`, `/api/v1/users`, `/api/v1/roles`)
- 発送管理 API への権限列追加
- MUI 版 Admin UI の対応
- JSON 命名規則（snake_case）の明確化

---

## 2. 共通設計方針（Tech Lead Decision）

### 2.1 認証・認可
- Phase 1 (MVP): Shipping API 内蔵の JWT 認証
- Access Token: `Authorization: Bearer <token>` ヘッダで送信
- Refresh Token: HttpOnly Secure Cookie で管理
- 詳細は [ADR-008](../adr/ADR-008-authentication-authorization.md) を参照

### 2.2 命名規則（重要）
- **Backend（Go）**
  - JSON レスポンスは `snake_case`
  - 例: `order_id`, `tracking_number`
- **Frontend（React / Ant Design Pro / MUI）**
  - 内部では `camelCase` を使用
  - API Client 層で変換、または snake_case をそのまま扱ってもよい

> Go の `json` タグで snake_case を返すのを正とする。

### 2.3 共通レスポンス形式（Ant Design Pro 準拠）

すべての API レスポンスは以下の形式に準拠する。

#### 成功レスポンス
```json
{
  "success": true,
  "data": { ... }
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "errorCode": 400,
  "errorMessage": "validation error"
}
```

#### 一覧レスポンス
```json
{
  "success": true,
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "size": 20
}
```

> Ant Design Pro の `useRequest` と `errorConfig` に対応した形式。

---

## 3. API エンドポイント一覧

### 3.1 Base URL
- 開発環境: `http://localhost:8080/api/v1`
- 本番環境: `{API_GATEWAY}/api/v1`

### 3.2 エンドポイント

#### 3.2.1 認証 API

| HTTP | Endpoint | 説明 | 権限 |
|------|----------|------|------|
| POST | `/api/v1/auth/login` | ログイン（JWT 発行） | 全ユーザー |
| POST | `/api/v1/auth/refresh` | Access Token 更新 | 認証済み |
| POST | `/api/v1/auth/logout` | ログアウト（トークン無効化） | 認証済み |

#### 3.2.2 ユーザー管理 API

| HTTP | Endpoint | 説明 | 権限 |
|------|----------|------|------|
| GET | `/api/v1/users/me` | 自分のプロフィール取得 | 認証済み（全ロール） |
| PUT | `/api/v1/users/me` | 自分のプロフィール更新 | 認証済み（全ロール） |
| PUT | `/api/v1/users/me/password` | 自分のパスワード変更 | 認証済み（全ロール） |
| GET | `/api/v1/users` | ユーザー一覧取得 | user:read (admin) |
| POST | `/api/v1/users` | ユーザー新規作成 | user:create (admin) |
| GET | `/api/v1/users/:id` | ユーザー詳細取得 | user:read (admin) |
| PUT | `/api/v1/users/:id` | ユーザー情報更新 | user:update (admin) |
| PUT | `/api/v1/users/:id/status` | ユーザー有効/無効切替 | user:delete (admin) |
| PUT | `/api/v1/users/:id/password` | パスワードリセット | user:update (admin) |

#### 3.2.3 ロール・パーミッション参照 API

| HTTP | Endpoint | 説明 | 権限 |
|------|----------|------|------|
| GET | `/api/v1/roles` | ロール一覧取得 | user:read (admin) |
| GET | `/api/v1/roles/:id/permissions` | ロールのパーミッション一覧 | user:read (admin) |

#### 3.2.4 発送管理 API

| HTTP | Endpoint | 説明 | 権限 |
|------|----------|------|------|
| GET | `/api/v1/shipments` | 発送一覧取得（フィルタ・ページネーション対応） | shipping:read |
| GET | `/api/v1/shipments/summary` | ダッシュボード用サマリー取得 | shipping:read |
| GET | `/api/v1/shipments/priority` | 優先対応発送一覧取得 | shipping:read |
| GET | `/api/v1/shipments/:order_id` | 発送詳細取得 | shipping:read |
| PUT | `/api/v1/shipments/:order_id` | 発送情報更新 | shipping:update |

---

## 4. 認証 API

### 4.1 ログイン

| 項目 | 内容 |
|---|---|
| HTTP | POST |
| Endpoint | `/api/v1/auth/login` |
| 説明 | ユーザー名 + パスワードで認証、JWT 発行 |

#### Request
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": 1,
      "username": "admin",
      "display_name": "管理者 太郎",
      "email": "admin@example.com",
      "roles": ["admin"],
      "permissions": ["shipping:create", "shipping:read", "shipping:update", "shipping:delete", "user:create", "user:read", "user:update", "user:delete", "system:config", "system:audit"]
    }
  }
}
```

**Refresh Token:**
- `Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`

#### UI 利用箇所
- ログイン画面 (SCR-010)

### 4.2 トークン更新

| 項目 | 内容 |
|---|---|
| HTTP | POST |
| Endpoint | `/api/v1/auth/refresh` |
| 説明 | Refresh Token で新しい Access Token を発行 |

#### Request
- Refresh Token は Cookie で自動送信（リクエストボディ不要）

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

#### UI 利用箇所
- Silent Refresh（Access Token の残り有効期限が 2分以下になった時点で自動実行）

### 4.3 ログアウト

| 項目 | 内容 |
|---|---|
| HTTP | POST |
| Endpoint | `/api/v1/auth/logout` |
| 説明 | Access Token をブラックリストに追加、Refresh Token を削除 |

#### Request Header
- `Authorization: Bearer <access_token>`

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

#### UI 利用箇所
- ヘッダーの Logout ボタン
- ログアウト後はログイン画面 (SCR-010) へリダイレクト

---

## 5. ユーザー管理 API

### 5.1 プロフィール取得（自分）

| 項目 | 内容 |
|---|---|
| HTTP | GET |
| Endpoint | `/api/v1/users/me` |
| 説明 | ログイン中ユーザーのプロフィール情報を取得 |

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "display_name": "管理者 太郎",
    "email": "admin@example.com",
    "roles": [
      { "code": "admin", "name": "システム管理者" }
    ],
    "last_login_at": "2026-02-16T09:00:00Z",
    "created_at": "2026-02-01T00:00:00Z",
    "version": 1
  }
}
```

#### UI 利用箇所
- プロフィール画面 (SCR-020) 初期表示
- ヘッダーのユーザー名表示

### 5.2 プロフィール更新（自分）

| 項目 | 内容 |
|---|---|
| HTTP | PUT |
| Endpoint | `/api/v1/users/me` |
| 説明 | 自分の表示名・メールアドレスを更新 |

#### Request
```json
{
  "display_name": "管理者 太郎",
  "email": "admin@example.com",
  "version": 1
}
```

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "display_name": "管理者 太郎",
    "email": "admin@example.com",
    "roles": [
      { "code": "admin", "name": "システム管理者" }
    ],
    "version": 2
  }
}
```

#### UI 利用箇所
- プロフィール画面 (SCR-020) の「保存」ボタン

### 5.3 パスワード変更（自分）

| 項目 | 内容 |
|---|---|
| HTTP | PUT |
| Endpoint | `/api/v1/users/me/password` |
| 説明 | 自分のパスワードを変更（現在のパスワード確認必須） |

#### Request
```json
{
  "current_password": "oldPassword123",
  "new_password": "newPassword456"
}
```

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "message": "パスワードを変更しました"
  }
}
```

#### UI 利用箇所
- プロフィール画面 (SCR-020) の「パスワードを変更」ボタン

### 5.4 ユーザー一覧取得（admin）

| 項目 | 内容 |
|---|---|
| HTTP | GET |
| Endpoint | `/api/v1/users` |
| Query | keyword, role, is_active, page, size |
| 説明 | ユーザー一覧を取得（検索・フィルタ対応） |

#### Response（200 OK）
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "display_name": "管理者 太郎",
      "email": "admin@example.com",
      "is_active": true,
      "roles": [
        { "code": "admin", "name": "システム管理者" }
      ],
      "last_login_at": "2026-02-16T09:00:00Z",
      "created_at": "2026-02-01T00:00:00Z",
      "version": 1
    }
  ],
  "total": 4,
  "page": 1,
  "size": 20
}
```

#### UI 利用箇所
- ユーザー管理画面 (SCR-030) の一覧テーブル

### 5.5 ユーザー作成（admin）

| 項目 | 内容 |
|---|---|
| HTTP | POST |
| Endpoint | `/api/v1/users` |
| 説明 | 新規ユーザーを作成 |

#### Request
```json
{
  "username": "tanaka",
  "display_name": "田中 三郎",
  "email": "tanaka@example.com",
  "role": "viewer",
  "password": "initialPassword123"
}
```

#### Response（201 Created）
```json
{
  "success": true,
  "data": {
    "id": 5,
    "username": "tanaka",
    "display_name": "田中 三郎",
    "email": "tanaka@example.com",
    "is_active": true,
    "roles": [
      { "code": "viewer", "name": "閲覧者" }
    ],
    "created_at": "2026-02-16T11:00:00Z",
    "version": 1
  }
}
```

#### UI 利用箇所
- ユーザー管理画面 (SCR-030) の「新規ユーザー作成」ダイアログ

### 5.6 ユーザー更新（admin）

| 項目 | 内容 |
|---|---|
| HTTP | PUT |
| Endpoint | `/api/v1/users/:id` |
| 説明 | ユーザーの表示名・メール・ロールを更新 |

#### Request
```json
{
  "display_name": "田中 三郎（更新）",
  "email": "tanaka-new@example.com",
  "role": "operator",
  "version": 1
}
```

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 5,
    "username": "tanaka",
    "display_name": "田中 三郎（更新）",
    "email": "tanaka-new@example.com",
    "is_active": true,
    "roles": [
      { "code": "operator", "name": "オペレーター" }
    ],
    "version": 2
  }
}
```

#### UI 利用箇所
- ユーザー管理画面 (SCR-030) の編集ダイアログ

### 5.7 ユーザー有効/無効切替（admin）

| 項目 | 内容 |
|---|---|
| HTTP | PUT |
| Endpoint | `/api/v1/users/:id/status` |
| 説明 | ユーザーアカウントの有効/無効を切り替え |

#### Request
```json
{
  "is_active": false,
  "version": 1
}
```

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 5,
    "is_active": false,
    "version": 2
  }
}
```

**セキュリティ考慮:**
- 無効化時、対象ユーザーの全 Access Token をブラックリストに追加（即時ログアウト）

#### UI 利用箇所
- ユーザー管理画面 (SCR-030) のステータスバッジクリック

### 5.8 パスワードリセット（admin）

| 項目 | 内容 |
|---|---|
| HTTP | PUT |
| Endpoint | `/api/v1/users/:id/password` |
| 説明 | 管理者によるパスワード強制リセット |

#### Request
```json
{
  "new_password": "newPassword123"
}
```

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "message": "パスワードをリセットしました"
  }
}
```

**セキュリティ考慮:**
- リセット時、対象ユーザーの全トークンを無効化（強制再ログイン）
- 監査ログに記録

#### UI 利用箇所
- ユーザー管理画面 (SCR-030) の🔑 アイコンクリック

---

## 5A. ロール・パーミッション参照 API

### 5A.1 ロール一覧取得

| 項目 | 内容 |
|---|---|
| HTTP | GET |
| Endpoint | `/api/v1/roles` |
| 説明 | 定義済みロールの一覧を取得 |

#### Response（200 OK）
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "admin",
      "name": "システム管理者",
      "description": "全権限。ユーザー管理・システム設定を含む"
    },
    {
      "id": 2,
      "code": "operator",
      "name": "オペレーター",
      "description": "発送業務の参照・更新が可能"
    },
    {
      "id": 3,
      "code": "viewer",
      "name": "閲覧者",
      "description": "発送情報の参照のみ"
    }
  ]
}
```

> `service` ロール（M2M用）はフロントエンドには表示しない。

#### UI 利用箇所
- ユーザー管理画面 (SCR-030) のユーザー作成・編集ダイアログのロール選択プルダウン
- ユーザー一覧のロールフィルタ

### 5A.2 ロールのパーミッション一覧取得

| 項目 | 内容 |
|---|---|
| HTTP | GET |
| Endpoint | `/api/v1/roles/:id/permissions` |
| 説明 | 指定ロールに紐づくパーミッション一覧を取得 |

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 2,
      "code": "operator",
      "name": "オペレーター"
    },
    "permissions": [
      { "id": 2, "code": "shipping:read", "name": "発送参照", "description": "発送一覧・詳細の参照" },
      { "id": 3, "code": "shipping:update", "name": "発送更新", "description": "発送情報の更新（ステータス変更含む）" }
    ]
  }
}
```

#### UI 利用箇所
- ユーザー管理画面 (SCR-030) のロール詳細表示（参考情報として権限を表示）

---

## 6. Dashboard 集計用 API

### 6.1 Dashboard Summary 取得

| 項目 | 内容 |
|---|---|
| HTTP | GET |
| Endpoint | `/api/v1/shipments/summary` |
| 説明 | Dashboard 用の発送ステータス件数を一括取得 |

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "created": 12,
    "ready": 5,
    "shipped_today": 8,
    "returned": 1
  }
}
```

#### UI 利用箇所
- Dashboard 上部の 4 枚カード
- **一覧 API を複数回呼ばない設計**とする

### 6.2 Priority Shippings 取得

| 項目 | 内容 |
|---|---|
| HTTP | GET |
| Endpoint | `/api/v1/shipments/priority` |
| Query | `limit` (default: 5) |
| 説明 | 優先度の高い発送を取得（RETURNED > CREATED(24h以上) > READY） |

#### Response（200 OK）
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": "ORD-2024-001",
      "status": "RETURNED",
      "carrier": "YAMATO",
      "tracking_number": "1234567890",
      "shipping_address": "東京都...",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-02T00:00:00Z"
    }
  ]
}
```

---

## 7. 画面別 UI ↔ API 対応表

### 7.1 ログイン画面 (SCR-010)

| UI操作 | HTTP | Endpoint | Payload | 備考 |
|---|---|---|---|---|
| ログイン | POST | /api/v1/auth/login | username, password | JWT 発行 |
| Silent Refresh | POST | /api/v1/auth/refresh | (Cookie) | Access Token 有効期限 2分前に自動実行 |
| ログアウト | POST | /api/v1/auth/logout | - | トークン無効化 |

---

### 7.2 プロフィール画面 (SCR-020)

| UI操作 | HTTP | Endpoint | Payload | 備考 |
|---|---|---|---|---|
| プロフィール取得 | GET | /api/v1/users/me | - | 初期表示 |
| プロフィール更新 | PUT | /api/v1/users/me | display_name, email, version | 楽観ロック |
| パスワード変更 | PUT | /api/v1/users/me/password | current_password, new_password | - |

---

### 7.3 ユーザー管理画面 (SCR-030)

| UI操作 | HTTP | Endpoint | Query/Payload | 備考 |
|---|---|---|---|---|
| 一覧取得 | GET | /api/v1/users | keyword, role, is_active, page, size | admin 専用 |
| ユーザー作成 | POST | /api/v1/users | username, display_name, email, role, password | admin 専用 |
| ユーザー更新 | PUT | /api/v1/users/:id | display_name, email, role, version | admin 専用 |
| 有効/無効切替 | PUT | /api/v1/users/:id/status | is_active, version | admin 専用 |
| パスワードリセット | PUT | /api/v1/users/:id/password | new_password | admin 専用 |

---

### 7.4 Dashboard（Overview Cards）

| UI操作 | HTTP | Endpoint | Query | 備考 |
|---|---|---|---|---|
| 初期表示 | GET | /api/v1/shipments/summary | - | 件数一括取得 |
| 優先リスト | GET | /api/v1/shipments/priority | limit=5 | 要対応発送 |
| カードクリック | - | (クライアント遷移) | - | /shipping/list?status=XXX |

---

### 7.5 Shipping List（一覧・検索）

| UI操作 | HTTP | Endpoint | Query | 備考 |
|---|---|---|---|---|
| 一覧取得 | GET | /api/v1/shipments | page, size | デフォルト: page=1, size=20 |
| ステータス絞込 | GET | /api/v1/shipments | status | CREATED/READY/SHIPPED/DELIVERED/RETURNED/CANCELLED |
| キーワード検索 | GET | /api/v1/shipments | keyword | order_id, tracking_number への部分一致 (Case Insensitive) |
| Carrier 絞込 | GET | /api/v1/shipments | carrier | YAMATO/SAGAWA/JAPANPOST |

#### Response（200 OK）
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": "ORD-2024-001",
      "status": "READY",
      "carrier": null,
      "tracking_number": null,
      "shipping_address": "東京都...",
      "ready_at": "2024-01-01T10:00:00Z",
      "shipped_at": null,
      "delivered_at": null,
      "version": 2,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 20
}
```

---

### 7.6 Shipping Detail（詳細）

| UI操作 | HTTP | Endpoint | Path | 備考 |
|---|---|---|---|---|
| 詳細表示 | GET | /api/v1/shipments/:order_id | order_id | Drawer/Sheet 用 |

#### Response（200 OK）
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": "ORD-2024-001",
    "status": "SHIPPED",
    "carrier": "YAMATO",
    "tracking_number": "123456789012",
    "shipping_address": "東京都渋谷区...",
    "ready_at": "2024-01-01T10:00:00Z",
    "shipped_at": "2024-01-02T09:00:00Z",
    "delivered_at": null,
    "version": 3,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-02T09:00:00Z"
  }
}
```

---

### 7.7 ステータス更新（READY → SHIPPED 等）

| UI操作 | HTTP | Endpoint | Payload | 備考 |
|---|---|---|---|---|
| ステータス更新 | PUT | /api/v1/shipments/:order_id | Body (下記参照) | |
| 排他エラー | - | - | 409 Conflict | Toast + 再取得 |

#### Request Body
```json
{
  "status": "SHIPPED",
  "carrier": "YAMATO",
  "tracking_number": "123456789012",
  "version": 2
}
```

#### ステータス遷移ルール
| 現在のステータス | 許可される遷移先 |
|---|---|
| CREATED | READY, CANCELLED |
| READY | SHIPPED, CANCELLED |
| SHIPPED | DELIVERED, RETURNED |

#### SHIPPED への遷移時の必須項目
- `carrier`: 必須（YAMATO / SAGAWA / JAPANPOST）
- `tracking_number`: 必須

---

## 8. バリデーションエラー仕様

### 8.1 400 Bad Request

```json
{
  "success": false,
  "errorCode": 400,
  "errorMessage": "validation error"
}
```

### 8.2 409 Conflict（楽観ロック）

```json
{
  "success": false,
  "errorCode": 409,
  "errorMessage": "データが更新されています。再読み込みしてください。"
}
```

### 8.3 UI 側の挙動
- 400: 入力エラーをフィールド単位で表示
- 409: Toast表示 + 再読み込みボタン

---

## 9. エラーハンドリング対応表

| HTTP Status | UI挙動 | UX |
|---|---|---|
| 400 | 入力エラー表示 | フィールド単位 |
| 401 | ログイン画面へリダイレクト | トークン期限切れ / 未認証 |
| 403 | 権限不足トースト | Dashboard へリダイレクト |
| 404 | データなし | Sheet を閉じる |
| 409 | 競合 | Toast + Reload Action |
| 429 | Rate Limit | 一時的に操作無効化 |
| 500 | システムエラー | 共通エラートースト |

---

## 10. イベント連携（非同期）

| 発生元 | イベント | Shipping 側処理 |
|---|---|---|
| Order Service | ORDER_PAID | Shipping 作成（CREATED） |
| Order Service | ORDER_CANCELLED | CANCELLED |
| Shipping Service | SHIPPING_COMPLETED | Order へ通知 |

---

## 11. UI 実装状況

| UI Framework | 実装状況 | 備考 |
|---|---|---|
| Ant Design Pro | 完了 | apps/admin-antd-pro |
| Material UI | 完了 | apps/admin-mui |

### 11.1 MUI 版の設定

```javascript
// apps/admin-mui/src/services/shipping.ts
const USE_MOCK = false;  // API 接続モード

// apps/admin-mui/vite.config.mjs
proxy: {
  '/api/v1': {
    target: 'http://localhost:8080',
    changeOrigin: true
  }
}
```

---

## 12. Tech Lead 補足

- Dashboard 集計は **必ず Summary API を使用**
- 一覧 API の多重呼び出しは禁止
- 409 Conflict は「異常系」ではなく「通常の競合パス」
- `version` フィールドによる楽観ロックを必ず実装
- 認証エンドポイントには Rate Limiting を適用
- ユーザー無効化・パスワードリセット時は対象トークンを即時無効化

---

本ドキュメントは以下とセットで使用する：

- shipping-service-requirements.md v0.5.0
- ui-dashboard-design.md v0.3.0
- ADR-008-authentication-authorization.md v1.3.0
- shipping_db_v0.2.sql
- SCR-010-login.md v1.0.0
- SCR-020-profile.md v1.0.0
- SCR-030-user-management.md v1.0.0

## 13. 変更履歴

| Version | 日付 | 変更内容 |
|---------|------|----------|
| 0.4.0 | — | MUI Integration Complete |
| 0.5.0 | 2026-02-16 | 認証 API (login/refresh/logout)、ユーザー管理 API (CRUD/profile/password)、画面別対応表 (SCR-010/020/030)、エラーハンドリングに 401/403/429 を追加 |
| 0.6.0 | 2026-02-16 | ロール・パーミッション参照 API 追加、発送管理 API に権限列追加、見出し番号修正、参照バージョン整合性修正 |
| 0.6.1 | 2026-02-16 | パーミッション API レスポンスに description を追加、要件定義参照を v0.5.0 に更新 |

**UI ↔ API 契約としての最新版（v0.6.1）**
