# issue-004: Shipping Detail & Update API

## 概要
発送詳細の取得と更新ができ、楽観ロック・バリデーションが動作する

## 目的
Frontend が発送の詳細確認・ステータス更新を行うための API を提供する

## エピック
E2: 発送詳細・編集

## やること
- `GET /shippings/{order_id}` 実装
- `PUT /shippings/{order_id}` 実装
- ステータス遷移バリデーション
- 追跡番号フォーマットバリデーション (業者別)
- 楽観ロック実装 (version 不一致で 409)
- バリデーションエラー形式の実装

## 受け入れ条件
- [ ] `GET /shippings/{order_id}` が詳細データを返す
- [ ] `PUT` で status, carrier, tracking_number を更新できる
- [ ] 不正なステータス遷移は 400 エラー
- [ ] 不正な追跡番号形式は 400 エラー（フィールド単位エラー）
- [ ] version 不一致は 409 Conflict
- [ ] 存在しない order_id は 404 Not Found

## API 仕様（参照: ui-api-interface-mapping v0.2.0）

### GET /shippings/{order_id}
```json
{
  "order_id": "ORD-001",
  "status": "READY",
  "carrier": null,
  "tracking_number": null,
  "shipping_address": "東京都渋谷区神宮前1-2-3 ABCビル 101",
  "ready_at": "2024-01-15T12:00:00Z",
  "shipped_at": null,
  "delivered_at": null,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z",
  "version": 2
}
```

### PUT /shippings/{order_id}

#### Request
```json
{
  "status": "SHIPPED",
  "carrier": "YAMATO",
  "tracking_number": "123456789012",
  "version": 2
}
```

#### Response (200 OK)
```json
{
  "order_id": "ORD-001",
  "status": "SHIPPED",
  "carrier": "YAMATO",
  "tracking_number": "123456789012",
  "shipped_at": "2024-01-15T14:00:00Z",
  "version": 3
}
```

#### Response (400 Bad Request)
```json
{
  "message": "validation error",
  "errors": [
    {
      "field": "tracking_number",
      "reason": "invalid format"
    }
  ]
}
```

#### Response (409 Conflict)
```json
{
  "error": "conflict",
  "message": "データが更新されています。再読み込みしてください。"
}
```

## ステータス遷移ルール（参照: requirements v0.2.2）

| コード | ステータス |
|--------|-----------|
| 10 | CREATED |
| 20 | READY |
| 30 | SHIPPED |
| 40 | DELIVERED |
| 90 | RETURNED |
| 99 | CANCELLED |

### 許可される遷移
- CREATED → READY: 出荷指示
- CREATED → CANCELLED: キャンセル
- READY → SHIPPED: 出荷完了（carrier + tracking_number 必須）
- READY → CANCELLED: 出荷前キャンセル
- SHIPPED → DELIVERED: 配達完了
- SHIPPED → RETURNED: 返送

### 禁止される遷移
- SHIPPED → READY: 逆戻り禁止
- 完了後の変更: DELIVERED 後のステータス変更は不可

## 追跡番号フォーマット (MVP では簡易チェック)

| 業者 | パターン |
|------|----------|
| YAMATO | 12桁数字 |
| SAGAWA | 12桁数字 |
| JAPAN_POST | 11-13桁英数字 |

## デモ / 確認方法
- curl で CREATED → READY → SHIPPED の遷移を確認
- curl で SHIPPED → READY (不正) が 400 になることを確認
- 同時更新シナリオで 409 を確認
- 不正な追跡番号で 400 (field: tracking_number) を確認

## 非スコープ
- RETURNED 処理の詳細フロー（Phase 2）
- 住所変更禁止ルール

## 依存関係
- issue-003 (List API) 完了が前提 (Shipping モデル共有)

## 次の Issue
- issue-007 (Detail/Edit UI) - この API を使用

## 関連ドキュメント
- [ADR-005: 排他制御 (Optimistic Lock)](../adr/ADR-005-optimistic-lock.md)
- [shipping-service-requirements.md v0.2.2](../requirements/shipping-service-requirements.md)
- [ui-api-interface-mapping.md v0.2.0](../architecture/ui-api-interface-mapping.md)
