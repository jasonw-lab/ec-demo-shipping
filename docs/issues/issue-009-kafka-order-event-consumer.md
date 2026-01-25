# issue-009: Kafka Order Event Consumer

## 概要
ORDER_PAID イベントで発送レコードが自動作成される

## 目的
Order Service との連携を実現し、発送データを自動生成する

## エピック
E4: Kafka イベント連携

## やること
- Kafka Consumer 設定
- ORDER_PAID イベントハンドラ
- 発送レコード作成 (CREATED ステータス)
- 冪等処理 (order_id 重複チェック)
- リトライ・DLQ 設定

## 受け入れ条件
- [ ] ORDER_PAID イベントで Shipping レコードが作成される
- [ ] 作成される Shipping の status は CREATED
- [ ] 同じイベントを複数回処理しても重複しない（冪等）
- [ ] 処理失敗時は DLQ に送られる
- [ ] ログに処理結果が出力される

## イベント連携仕様（参照: ui-api-interface-mapping v0.2.0）

| 発生元 | イベント | Shipping 側処理 |
|--------|----------|-----------------|
| Order Service | ORDER_PAID | Shipping 作成（CREATED） |
| Order Service | ORDER_CANCELLED | ステータス更新（CANCELLED）※Phase 2 |
| Shipping Service | SHIPPING_COMPLETED | Order へ通知 ※Phase 2 |

## ORDER_PAID イベントスキーマ

```json
{
  "event_type": "ORDER_PAID",
  "order_id": "ORD-001",
  "paid_at": "2024-01-15T10:00:00Z",
  "customer": {
    "name": "山田太郎",
    "phone": "090-1234-5678",
    "address": {
      "postal_code": "150-0001",
      "prefecture": "東京都",
      "city": "渋谷区",
      "street": "神宮前1-2-3",
      "building": "ABCビル 101"
    }
  },
  "items": [
    {
      "product_id": "PROD-001",
      "name": "Tシャツ (M)",
      "quantity": 2
    }
  ]
}
```

## Kafka 設定

```yaml
kafka:
  brokers:
    - localhost:9092
  consumer_group: shipping-service
  topics:
    order_events: order-events
  dlq_topic: shipping-service-dlq
  max_retries: 3
  retry_backoff: 1s
```

## 冪等処理

```go
func (h *OrderEventHandler) HandleOrderPaid(event OrderPaidEvent) error {
    // 既存チェック
    _, err := h.repo.FindByOrderID(event.OrderID)
    if err == nil {
        // 既に存在 → スキップ (冪等)
        log.Info("Shipping already exists, skipping", "order_id", event.OrderID)
        return nil
    }
    if !errors.Is(err, gorm.ErrRecordNotFound) {
        return err // 予期せぬエラー → リトライ
    }

    // 新規作成
    shipping := domain.Shipping{
        OrderID:         event.OrderID,
        Status:          domain.StatusCreated,
        ShippingAddress: formatAddress(event.Customer.Address),
        Version:         1,
    }

    return h.repo.Create(&shipping)
}
```

## エラーハンドリング

| エラー種別 | 対応 |
|-----------|------|
| DB 接続エラー | リトライ (最大3回、backoff 1s) |
| バリデーションエラー | DLQ へ送信（リトライしない） |
| 重複 (冪等) | 正常終了（ログ出力） |

## ファイル構成

```
apps/api/internal/
├── infra/
│   └── kafka/
│       ├── consumer.go          # Kafka Consumer
│       └── order_event_handler.go # イベントハンドラ
└── domain/
    └── shipping.go              # ドメインモデル
```

## デモ / 確認方法
- Kafka に ORDER_PAID イベントを投入
- DB に Shipping レコードが作成されることを確認
- 同じイベント再投入 → 重複作成されないことを確認
- ログに処理結果が出力されることを確認

## 非スコープ
- ORDER_CANCELLED 処理（Phase 2）
- SHIPPING_COMPLETED イベント発行（Phase 2）
- イベントソーシング

## 依存関係
- issue-001 (Backend Setup) 完了が前提
- issue-003 (List API) 完了が前提 (Repository 共有)

## 備考
- この Issue は MVP の最後に実装
- Order Service 側のイベント発行実装と並行して進められる

## 関連ドキュメント
- [ADR-004: 非同期連携 (Kafka + Eventual Consistency)](../adr/ADR-004-async-kafka-eventual-consistency.md)
- [shipping-service-requirements.md v0.2.2](../requirements/shipping-service-requirements.md)
- [ui-api-interface-mapping.md v0.2.0](../architecture/ui-api-interface-mapping.md)
