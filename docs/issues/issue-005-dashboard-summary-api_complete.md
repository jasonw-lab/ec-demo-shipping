# issue-005: Dashboard Summary API

## 概要
ダッシュボード用のステータス別集計 API が動作する

## 目的
Frontend がサマリカードを表示するためのデータを効率的に取得できる

## エピック
E3: ダッシュボード概要

## やること
- Repository 層に集計クエリ追加
- `GET /shippings/summary` ハンドラ実装
- shipped_today の JST 日付境界処理

## 受け入れ条件
- [ ] `GET /shippings/summary` が集計データを返す
- [ ] created, ready, shipped_today, returned の 4 項目を含む
- [ ] shipped_today は JST の当日 (0:00-23:59) でカウント
- [ ] 1回のクエリで全集計が取得できる（効率的な SQL）

## API 仕様（参照: ui-api-interface-mapping v0.2.0）

### GET /shippings/summary

```json
{
  "created": 12,
  "ready": 5,
  "shipped_today": 8,
  "returned": 1
}
```

> **重要:** Dashboard 表示は必ず本 API を使用する。一覧 API の全件取得・count で代替しないこと。

## 集計ロジック

| 項目 | 条件 |
|------|------|
| created | status = 'CREATED' |
| ready | status = 'READY' |
| shipped_today | status IN ('SHIPPED', 'DELIVERED') AND shipped_at >= JST今日0:00 AND shipped_at < JST明日0:00 |
| returned | status = 'RETURNED' |

## JST 日付境界処理

```go
// JST で今日の開始・終了を計算
jst := time.FixedZone("JST", 9*60*60)
now := time.Now().In(jst)
todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, jst)
todayEnd := todayStart.AddDate(0, 0, 1)
```

## デモ / 確認方法
- `curl http://localhost:8080/shippings/summary` → 集計 JSON
- テストデータ投入後、各カウントが正しいことを確認
- JST 日付境界をまたぐデータで shipped_today が正しくカウントされることを確認

## 非スコープ
- キャッシュ
- リアルタイム更新

## 依存関係
- issue-003 (List API) 完了が前提

## 次の Issue
- issue-008 (Summary UI) - この API を使用

## 関連ドキュメント
- [shipping-service-requirements.md v0.2.2](../requirements/shipping-service-requirements.md)
- [ui-api-interface-mapping.md v0.2.0](../architecture/ui-api-interface-mapping.md)
