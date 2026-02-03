# Shipping Service UI ↔ API Interface Mapping

**Version:** 0.4.0
**Status:** Final (MUI Integration Complete)
**Scope:** Shipping Service Admin UI – Backend API Contract

---

## 1. 目的

本ドキュメントは、Shipping Service における
**Admin UI（React / Ant Design Pro / MUI）と Backend API（Go）間のインターフェース対応関係**を定義する。

本版（v0.4.0）では、以下を反映した。

- API エンドポイントの統一 (`/api/v1/shipments`)
- MUI 版 Admin UI の対応
- JSON 命名規則（snake_case）の明確化

---

## 2. 共通設計方針（Tech Lead Decision）

### 2.1 認証・認可
- 認証・RBAC は BFF / Gateway 側で完結
- Shipping Service は内部 API として動作

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

| HTTP | Endpoint | 説明 |
|------|----------|------|
| GET | `/api/v1/shipments` | 発送一覧取得（フィルタ・ページネーション対応） |
| GET | `/api/v1/shipments/summary` | ダッシュボード用サマリー取得 |
| GET | `/api/v1/shipments/priority` | 優先対応発送一覧取得 |
| GET | `/api/v1/shipments/:order_id` | 発送詳細取得 |
| PUT | `/api/v1/shipments/:order_id` | 発送情報更新 |

---

## 4. Dashboard 集計用 API

### 4.1 Dashboard Summary 取得

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

### 4.2 Priority Shippings 取得

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

## 5. 画面別 UI ↔ API 対応表

### 5.1 Dashboard（Overview Cards）

| UI操作 | HTTP | Endpoint | Query | 備考 |
|---|---|---|---|---|
| 初期表示 | GET | /api/v1/shipments/summary | - | 件数一括取得 |
| 優先リスト | GET | /api/v1/shipments/priority | limit=5 | 要対応発送 |
| カードクリック | - | (クライアント遷移) | - | /shipping/list?status=XXX |

---

### 5.2 Shipping List（一覧・検索）

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

### 5.3 Shipping Detail（詳細）

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

### 5.4 ステータス更新（READY → SHIPPED 等）

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

## 6. バリデーションエラー仕様

### 6.1 400 Bad Request

```json
{
  "success": false,
  "errorCode": 400,
  "errorMessage": "validation error"
}
```

### 6.2 409 Conflict（楽観ロック）

```json
{
  "success": false,
  "errorCode": 409,
  "errorMessage": "データが更新されています。再読み込みしてください。"
}
```

### 6.3 UI 側の挙動
- 400: 入力エラーをフィールド単位で表示
- 409: Toast表示 + 再読み込みボタン

---

## 7. エラーハンドリング対応表

| HTTP Status | UI挙動 | UX |
|---|---|---|
| 400 | 入力エラー表示 | フィールド単位 |
| 404 | データなし | Sheet を閉じる |
| 409 | 競合 | Toast + Reload Action |
| 500 | システムエラー | 共通エラートースト |

---

## 8. イベント連携（非同期）

| 発生元 | イベント | Shipping 側処理 |
|---|---|---|
| Order Service | ORDER_PAID | Shipping 作成（CREATED） |
| Order Service | ORDER_CANCELLED | CANCELLED |
| Shipping Service | SHIPPING_COMPLETED | Order へ通知 |

---

## 9. UI 実装状況

| UI Framework | 実装状況 | 備考 |
|---|---|---|
| Ant Design Pro | 完了 | apps/admin-antd-pro |
| Material UI | 完了 | apps/admin-mui |

### 9.1 MUI 版の設定

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

## 10. Tech Lead 補足

- Dashboard 集計は **必ず Summary API を使用**
- 一覧 API の多重呼び出しは禁止
- 409 Conflict は「異常系」ではなく「通常の競合パス」
- `version` フィールドによる楽観ロックを必ず実装

---

本ドキュメントは以下とセットで使用する：

- shipping-service-requirements.md v0.2.1
- ui-dashboard-design.md v0.2.2

**UI ↔ API 契約としての最終版（v0.4.0）**
