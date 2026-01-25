# issue-001: Backend Project Setup

## 概要
Go Backend の基盤構成が整い、ローカルで API サーバーが起動できる状態になる

## 目的
全ての Backend 実装の土台となるプロジェクト構成を確立する

## エピック
E5: 基盤セットアップ

## やること
- Gin フレームワーク導入・ルーティング設定
- GORM 導入・DB 接続設定
- 設定ファイル (config.yaml / 環境変数) 構造
- Shipping テーブルマイグレーション（要件定義のモデルに準拠）
- ヘルスチェックエンドポイント実装

## Shipping テーブル定義（参照: requirements v0.2.2）

```go
type Shipping struct {
    ID              uint64     `json:"id" gorm:"primaryKey"`
    OrderID         uint64     `json:"order_id" gorm:"uniqueIndex;not null"`
    Status          string     `json:"status" gorm:"type:varchar(20);not null"`
    Carrier         string     `json:"carrier" gorm:"type:varchar(50)"`
    TrackingNumber  string     `json:"tracking_number" gorm:"type:varchar(100)"`
    ShippingAddress string     `json:"shipping_address" gorm:"type:text"`
    ReadyAt         *time.Time `json:"ready_at"`
    ShippedAt       *time.Time `json:"shipped_at"`
    DeliveredAt     *time.Time `json:"delivered_at"`
    Version         uint64     `json:"version" gorm:"default:1"`
    CreatedAt       time.Time  `json:"created_at"`
    UpdatedAt       time.Time  `json:"updated_at"`
    DeletedAt       *time.Time `json:"deleted_at" gorm:"index"`
}
```

## 受け入れ条件
- [ ] `go run cmd/server/main.go` でサーバーが起動する
- [ ] `GET /health` が 200 OK を返す
- [ ] MySQL に shipping テーブルが作成される
- [ ] 設定を環境変数で上書きできる

## デモ / 確認方法
- ターミナルで `curl http://localhost:8080/health` → `{"status":"ok"}`
- MySQL CLI で `SHOW TABLES;` → shipping テーブル確認

## 非スコープ
- 認証・認可
- Kafka 設定
- Docker 化

## 依存関係
- なし (最初の Issue)

## 次の Issue
- issue-002 (Frontend Setup)
- issue-003 (List API) - この Issue 完了後に着手可能

## 関連ドキュメント
- [ADR-002: Backend Framework (Gin + GORM)](../adr/ADR-002-backend-framework-gin-gorm.md)
- [shipping-service-requirements.md v0.2.2](../requirements/shipping-service-requirements.md)
