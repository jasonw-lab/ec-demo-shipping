# Shipping Service UI ↔ API Interface Mapping

**Version:** 0.3.0
**Status:** Revised (Ant Design Pro Response Format Applied)
**Scope:** Shipping Service Admin UI – Backend API Contract

---

## 1. 目的

本ドキュメントは、Shipping Service における  
**Admin UI（Next.js）と Backend API（Go）間のインターフェース対応関係**を定義する。

本版（v0.2.0）では、**ダッシュボード表示の効率化・実務向けAPI設計**の観点から以下を強化した。

- Dashboard 用の **集計専用 API** を追加
- JSON 命名規則（snake_case / camelCase）の明確化
- バリデーションエラー形式の明示

---

## 2. 共通設計方針（Tech Lead Decision）

### 2.1 認証・認可
- 認証・RBAC は BFF / Gateway 側で完結
- Shipping Service は内部 API として動作

### 2.2 命名規則（重要）
- **Backend（Go）**
  - JSON レスポンスは `snake_case`
  - 例: `order_id`, `tracking_number`
- **Frontend（Next.js / Ant Design Pro）**
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

## 3. Dashboard 集計用 API（新規追加）

### 3.1 Dashboard Summary 取得

| 項目 | 内容 |
|---|---|
| HTTP | GET |
| Endpoint | `/shippings/summary` |
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

---

## 4. 画面別 UI ↔ API 対応表

### 4.1 Dashboard（Overview Cards）

| UI操作 | HTTP | Endpoint | Query | 備考 |
|---|---|---|---|---|
| 初期表示 | GET | /shippings/summary | - | 件数一括取得 |
| カードクリック | GET | /shippings | status={STATUS} | READY / CREATED 等 |

---

### 4.2 Shipping List（一覧・検索）

| UI操作 | HTTP | Endpoint | Query | 備考 |
|---|---|---|---|---|
| 一覧取得 | GET | /shippings | page, size | |
| ステータス絞込 | GET | /shippings | status | |
| キーワード検索 | GET | /shippings | keyword | order_id, tracking_number への部分一致 (Case Insensitive) |
| Carrier 絞込 | GET | /shippings | carrier | |

---

### 4.3 Shipping Detail（詳細）

| UI操作 | HTTP | Endpoint | Path | 備考 |
|---|---|---|---|---|
| 詳細表示 | GET | /shippings/{order_id} | order_id | Sheet 用。Responseは一覧DTOに `shipping_address` 等を追加した詳細形式 |

---

### 4.4 出荷完了登録（READY → SHIPPED）

| UI操作 | HTTP | Endpoint | Payload | 備考 |
|---|---|---|---|---|
| 出荷登録 | PUT | /shippings/{order_id} | Body: `{status, carrier, tracking_number, version}` | |
| 排他エラー | - | - | 409 Conflict | Toast + 再取得 |

---

### 4.5 発送情報修正（SHIPPED / RETURNED）

| UI操作 | HTTP | Endpoint | Payload | 備考 |
|---|---|---|---|---|
| 情報修正 | PUT | /shippings/{order_id} | carrier, tracking_number, version | |

---

## 5. バリデーションエラー仕様（明確化）

### 5.1 400 Bad Request

Ant Design Pro 形式のエラーレスポンス。

```json
{
  "success": false,
  "errorCode": 400,
  "errorMessage": "invalid format"
}
```

### 5.2 UI 側の挙動
- `field` に対応する入力欄の下に `FormMessage` を表示
- 複数エラーがある場合はすべて表示

---

## 6. エラーハンドリング対応表

| HTTP Status | UI挙動 | UX |
|---|---|---|
| 400 | 入力エラー表示 | フィールド単位 |
| 404 | データなし | Sheet を閉じる |
| 409 | 競合 | Toast + Reload Action |
| 500 | システムエラー | 共通エラートースト |

---

## 7. イベント連携（非同期）

| 発生元 | イベント | Shipping 側処理 |
|---|---|---|
| Order Service | ORDER_PAID | Shipping 作成（CREATED） |
| Order Service | ORDER_CANCELLED | CANCELLED |
| Shipping Service | SHIPPING_COMPLETED | Order へ通知 |

---

## 8. Tech Lead 補足

- Dashboard 集計は **必ず Summary API を使用**
- 一覧 API の多重呼び出しは禁止
- 409 Conflict は「異常系」ではなく「通常の競合パス」

---

本ドキュメントは以下とセットで使用する：

- shipping-service-requirements.md v0.2.1
- ui-dashboard-design.md v0.2.2

**UI ↔ API 契約としての最終版（v0.3.0）**
