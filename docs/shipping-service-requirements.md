# 発送管理システム (Shipping Service) 要件定義

**Version:** 0.2.0 (Final for MVP)
**Status:** Approved
**Author:** Tech Lead Candidate

---

## 1. 目的と背景

### 1.1 目的
- **マイクロサービスアーキテクチャの拡張:** 既存のJava/Springエコシステムに対し、新たにGo言語によるサービスを追加し、Polyglotな構成およびイベント駆動アーキテクチャ（EDA）を実証する。
- **物流ドメインの分離:** 注文（Order）と物理的な物流（Shipping）のライフサイクルを分離し、倉庫業務の実情に即したシステムフローを定義する。

### 1.2 背景
既存の `ec-demo` は注文・決済・在庫までを同期的な分散トランザクション（Seata）で管理している。しかし、発送業務は物理的な時間を要し、外部配送業者との連携も発生するため、非同期かつ結果整合性を用いた疎結合な設計が求められる。

---

## 2. 前提条件・制約事項（Scope Management）

### 2.1 業務制約（MVPスコープ）
1.  **シングルシップメント（1注文1発送）**
    * 1つの注文IDに対して、必ず1回の発送（1個口）を行う。
    * 分割発送（Split Shipment）および複数注文の同梱（Merge Shipment）は対象外とする。
2.  **住所変更の制限**
    * 発送データ生成後（ステータス: `READY` 以降）のシステム上の住所変更は対応しない。
    * 運用での個別対応（配送業者への直接連絡など）とする。
3.  **配送業者連携のモック化**
    * ヤマト運輸や佐川急便等のAPIとのリアルタイム連携は行わない。
    * 配送業者の選択と追跡番号の入力・バリデーションのみを実装する。

### 2.2 技術制約
1.  **認証・認可**
    * 既存のBFFおよび認証基盤（Firebase Auth / Session）を利用する。
2.  **データ整合性**
    * Order Serviceとの連携はKafkaイベントを用いた「結果整合性（Eventual Consistency）」を採用する。
    * 厳密なトランザクション（Seata）は使用しない。

---

## 3. 業務フローとステータス定義

### 3.1 ステータスライフサイクル

| ステータス | コード | 担当 | 定義・業務状態 | キャンセル可否 |
| :--- | :--- | :--- | :--- | :--- |
| **CREATED** | `10` | System | 注文確定後、データが連携された初期状態。倉庫作業未着手。 | **可** (Order側で可能) |
| **READY** | `20` | Ops | **[Cut-off Point]** 出荷指示済み。ピッキングリスト出力・梱包作業中。 | **不可** (システム上ロック) |
| **SHIPPED** | `30` | Ops | 配送業者へ引き渡し完了。追跡番号確定。ec-demoへ発送通知。 | **不可** |
| **DELIVERED**| `40` | System | 購入者へのお届け完了（今回は手動更新またはバッチ想定）。 | **不可** (返品扱い) |
| **RETURNED** | `90` | Ops | 宛先不明・長期不在等による差出人返送。 | **不可** |
| **CANCELLED**| `99` | System | 発送作業前に注文がキャンセルされた状態。 | - |

---

## 4. 機能要件詳細

### 4.1 Backend API (Go: Shipping Service)

**技術要件:** Gin/Echo等のWebフレームワークを使用し、Clean ArchitectureまたはStandard Go Layoutを採用すること。

| カテゴリ | Method | Endpoint | 説明 | 技術的考慮事項 |
| :--- | :--- | :--- | :--- | :--- |
| **Event** | - | `Kafka: order.events` | 注文作成/キャンセルイベントの購読 | **冪等性(Idempotency)**: `order_id` をキーに重複処理を防止。 |
| **Query** | `GET` | `/shippings` | 発送一覧取得 | ステータス、キーワード検索。ページネーション。 |
| **Query** | `GET` | `/shippings/:orderId` | 発送詳細取得 | |
| **Command**| `PUT` | `/shippings/:orderId` | 発送情報の登録・更新 | **楽観ロック(Optimistic Lock)**: `version` カラムの一致を確認。不一致なら `409 Conflict`。 |

### 4.2 Management UI (Next.js Admin)

以下の操作画面を実装する。

#### (1) 発送登録 (Shipment Registration)
* **トリガー:** ステータス `READY` の注文。
* **入力項目:**
    * 配送業者 (Carrier): Select (Yamato, Sagawa, JapanPost)
    * 追跡番号 (Tracking Number): Text
* **バリデーション:** 配送業者ごとに追跡番号の桁数・形式をチェック（例: 数字12桁）。

#### (2) 発送情報修正 (Shipment Update)
* **トリガー:** ステータス `SHIPPED` / `RETURNED` の注文。
* **排他制御UX:**
    * 画面を開いた時点の `version` を送信する。
    * 他者が更新していた場合（Backendから `409` 返却）、エラーメッセージ「他ユーザーにより更新されました」を表示し、最新データを再取得する。

---

## 5. データモデル設計 (Schema)

```go
type Shipping struct {
    ID              uint64    `gorm:"primaryKey" json:"id"`
    OrderID         uint64    `gorm:"uniqueIndex;not null" json:"order_id"`
    Status          string    `gorm:"size:20;index" json:"status"` 
    Carrier         string    `gorm:"size:20" json:"carrier"`
    TrackingNumber  string    `gorm:"size:50" json:"tracking_number"`
    ShippingAddress JSON      `gorm:"type:json" json:"shipping_address"` // Snapshot
    Version         uint64    `gorm:"default:1" json:"version"` // Optimistic Lock
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}
```
