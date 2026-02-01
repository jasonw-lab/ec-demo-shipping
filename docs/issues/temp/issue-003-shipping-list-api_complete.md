# issue-003: Shipping List API

## 概要
発送一覧を取得する API が動作し、フィルタ・ページネーションができる

## 目的
Frontend が発送データを取得・表示するための API を提供する

## エピック
E1: 発送一覧・検索

## やること
- Shipping ドメインモデル定義
- Repository 層実装 (FindAll)
- Service 層実装
- `GET /shippings` ハンドラ実装
- クエリパラメータ対応 (status, carrier, keyword, page, size)

## 受け入れ条件
- [ ] `GET /shippings` が発送一覧を JSON で返す
- [ ] `?status=READY` でフィルタできる
- [ ] `?keyword=123` で order_id / tracking_number を部分一致検索できる（Case Insensitive）
- [ ] `?carrier=YAMATO` でフィルタできる
- [ ] `?page=1&size=20` でページネーションできる
- [ ] レスポンスに total, page, size が含まれる
- [ ] JSON は snake_case で返す

## API 仕様（参照: ui-api-interface-mapping v0.2.0）

### Request
```
GET /shippings?status=READY&carrier=YAMATO&keyword=123&page=1&size=20
```

### Response (200 OK)
```json
{
  "data": [
    {
      "order_id": "ORD-001",
      "status": "READY",
      "carrier": null,
      "tracking_number": null,
      "shipping_address": "東京都渋谷区...",
      "ready_at": "2024-01-15T12:00:00Z",
      "shipped_at": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T12:00:00Z",
      "version": 2
    }
  ],
  "total": 100,
  "page": 1,
  "size": 20
}
```

## デモ / 確認方法
- `curl http://localhost:8080/shippings?status=READY` → 該当データが返る
- `curl http://localhost:8080/shippings?keyword=ORD` → 部分一致検索
- Postman / Insomnia でパラメータを変えて確認

## 非スコープ
- 更新 API
- 詳細 API
- ダッシュボードサマリ

## 依存関係
- issue-001 (Backend Setup) 完了が前提

## 次の Issue
- issue-006 (List UI) - この API を使用
- issue-004 (Detail/Update API)

## 関連ドキュメント
- [shipping-service-requirements.md v0.2.2](../design/shipping-service-requirements.md)
- [ui-api-interface-mapping.md v0.2.0](../architecture/ui-api-interface-mapping.md)
