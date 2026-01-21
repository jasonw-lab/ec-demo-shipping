# 発送管理システム (Shipping Service) 要件定義

**Version:** 0.2.2  
**Status:** Approved (Architecture Review Applied)

---

## 1. 目的と背景

### 1.1 目的
- 既存 EC システム（ec-demo）に対する発送管理機能の分離・提供
- 物流ドメインを独立したマイクロサービスとして定義する
- 非同期連携を前提とした実務的なアーキテクチャを採用する

### 1.2 背景
既存の ec-demo は、注文・決済・在庫までを同期的な分散トランザクションで管理している。  
一方、発送業務は物理的な作業時間を伴い、外部要因（倉庫作業・配送業者）に強く依存するため、  
**結果整合性（Eventual Consistency）を前提とした非同期設計**が適している。

---

## 2. 前提条件・制約事項（Scope Management）

### 2.1 業務制約（MVPスコープ）
1. **1注文 = 1発送（シングルシップメント）**
2. **READY 以降の住所変更は不可**
3. **配送業者 API 連携は行わない（手動入力のみ）**

### 2.2 技術制約
- 認証・認可は BFF / Gateway 側で完結
- Shipping Service は内部 API として提供
- Order Service との整合性は Kafka による非同期連携とする
- 分散トランザクション（Seata / Saga）は使用しない

---

## 3. 業務フローとステータス定義

| ステータス | コード | 定義 |
|---|---|---|
| CREATED | 10 | 注文確定直後、作業未着手 |
| READY | 20 | 出荷指示済み（業務上の Cut-off） |
| SHIPPED | 30 | 配送業者へ引き渡し完了 |
| DELIVERED | 40 | 配送完了（将来拡張） |
| RETURNED | 90 | 返送対応 |
| CANCELLED | 99 | 発送前キャンセル |

---

## 4. 機能要件（API）

### 4.1 発送一覧・詳細 API

| Method | Endpoint | 説明 |
|---|---|---|
| GET | /shippings | 発送一覧取得（検索・フィルタ） |
| GET | /shippings/{order_id} | 発送詳細取得 |
| PUT | /shippings/{order_id} | 発送情報更新（楽観ロック） |

---

### 4.2 Dashboard 集計用 API（追加）

**目的:**  
Dashboard 上部に表示する各ステータス件数を、**1リクエストで効率的に取得**する。

| Method | Endpoint | 説明 |
|---|---|---|
| GET | /shippings/summary | 発送ステータス別件数を取得 |

#### Response（例）
```json
{
  "created": 10,
  "ready": 5,
  "shipped_today": 8,
  "returned": 1
}
```

- Dashboard 表示は **必ず本 API を使用**する
- 一覧 API の全件取得・count で代替しないこと

---

## 5. データモデル（概要）

```go
type Shipping struct {
    ID             uint64    `json:"id"`
    OrderID        uint64    `json:"order_id"`
    Status         string    `json:"status"`
    Carrier        string    `json:"carrier"`
    TrackingNumber string    `json:"tracking_number"`
    Version        uint64    `json:"version"`
    CreatedAt      time.Time `json:"created_at"`
    UpdatedAt      time.Time `json:"updated_at"`
}
```

---

## 6. 非機能要件

- **整合性:** Kafka イベントの冪等処理
- **同時更新:** version による楽観ロック
- **可観測性:** 構造化ログ（JSON）出力
- **拡張性:** 配送業者 API / ステータス自動更新に対応可能な設計

---

## 7. アーキテクチャ方針（確定）

- Go における **Standard Go Layout** を採用
  - `cmd/`
  - `internal/handler`
  - `internal/service`
  - `internal/repository`
- 過度な Clean Architecture は採用しない
- 実装は MVP スコープを厳守する

---

本ドキュメントは、以下と整合していることを保証する。

- UI 設計: ui-dashboard-design.md v0.2.2  
- UI ↔ API I/F: ui-api-interface-mapping.md v0.2.0  

**Shipping Service 要件定義の最新版（v0.2.2）とする。**
