# issue-008: Dashboard Summary UI

## 概要
ダッシュボードにステータス別サマリカードが表示される

## 目的
倉庫担当者が一目で「本日やるべきこと」を把握できるようにする

## エピック
E3: ダッシュボード概要

## やること
- サマリカード 4 種類の実装
- カードクリックで一覧フィルタ連動
- READY カードを視覚的に強調
- READY 件数 0 時のポジティブメッセージ

## 受け入れ条件
- [ ] 4つのサマリカードが表示される
- [ ] 各カードに正しい件数が表示される
- [ ] カードクリックで一覧がフィルタされる
- [ ] READY カードがオレンジ色で強調される
- [ ] READY 件数が 0 の場合「全ての発送作業が完了しました」と表示

## 画面構成（参照: ui-dashboard-design v0.2.2）

```
┌─────────────────────────────────────────────────────────────┐
│ ダッシュボード                                                │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│  │  未着手    │ │ 出荷待ち  │ │ 本日出荷  │ │  返送     │   │
│  │  CREATED  │ │  READY    │ │  TODAY    │ │ RETURNED  │   │
│  │           │ │  (強調)   │ │           │ │           │   │
│  │    12     │ │    5      │ │    8      │ │    1      │   │
│  │   Gray    │ │  Orange   │ │   Blue    │ │   Red     │   │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│                                                              │
│  クリックで一覧に遷移 (フィルタ付き)                          │
└─────────────────────────────────────────────────────────────┘
```

## サマリカード仕様

| カード | 表示名 | 色 | クリック遷移先 | 重要度 |
|--------|--------|-----|---------------|--------|
| created | 未着手 | Gray | /shipments?status=CREATED | 低 |
| ready | 出荷作業待ち | **Orange (Primary)** | /shipments?status=READY | **高** |
| shipped_today | 本日出荷 | Blue | /shipments?status=SHIPPED | 中 |
| returned | 返送/トラブル | Red | /shipments?status=RETURNED | 中 |

## UX 改善ポイント（参照: ui-dashboard-design v0.2.2 Section 10）

### 達成感を与えるフィードバック
- READY 件数が 0 の場合：
  - 無機質な「0」や「No Data」ではなく
  - 「全ての発送作業が完了しました」というポジティブメッセージを表示

### 認知負荷の軽減
- 識別子（件数）は大きく表示
- READY カードは他より目立つデザイン（ボーダー、背景色など）

## ファイル構成

```
src/features/shipping/
├── api/
│   └── use-summary.ts           # サマリ取得 hook
├── components/
│   ├── dashboard.tsx            # ダッシュボードコンテナ
│   └── summary-card.tsx         # サマリカード
└── index.ts
```

## データ取得

```typescript
const { data, isLoading } = useSummary();

// TanStack Query hook
export function useSummary() {
  return useQuery({
    queryKey: ['shippings', 'summary'],
    queryFn: () => fetchSummary(),
  });
}
```

> **Note:** ポーリング（自動更新）は MVP では任意。必要に応じて `refetchInterval` を設定。

## デモ / 確認方法
- ダッシュボード画面を開く
- 各カードの件数を API レスポンスと照合
- READY カードをクリック → 一覧が READY でフィルタ
- READY が 0 件の状態でポジティブメッセージ確認

## 非スコープ
- グラフ表示
- 日別推移
- リアルタイム WebSocket 更新

## 依存関係
- issue-006 (List UI) 完了が前提 (一覧遷移のため)
- issue-005 (Summary API) 完了が前提

## 次の Issue
- issue-009 (Kafka Consumer)

## 関連ドキュメント
- [ui-dashboard-design.md v0.2.2](../architecture/ui-dashboard-design.md)
- [ui-api-interface-mapping.md v0.2.0](../architecture/ui-api-interface-mapping.md)
