# issue-006: Shipping List UI

## 概要
発送一覧画面が表示され、フィルタ・検索・ページネーションが動作する

## 目的
倉庫担当者が発送一覧を確認・絞り込みできるようにする

## エピック
E1: 発送一覧・検索

## やること
- API クライアント設定 (TanStack Query)
- フィルタバー UI (ステータス, 配送業者, キーワード)
- TanStack Table による一覧表示
- ステータスバッジ (色分け)
- ページネーション UI
- **初期表示は READY をデフォルトフィルタ**

## 受け入れ条件
- [ ] 発送一覧が API から取得されて表示される
- [ ] **初期表示時に READY でフィルタされている**
- [ ] ステータスで絞り込みができる
- [ ] キーワード検索ができる（order_id / tracking_number 部分一致）
- [ ] 配送業者で絞り込みができる
- [ ] ページ送りができる
- [ ] ローディング状態が表示される

## 画面構成（参照: ui-dashboard-design v0.2.2）

```
┌─────────────────────────────────────────────────┐
│ フィルタバー                                      │
│ [ステータス ▼] [配送業者 ▼] [🔍 検索...]  [Reset] │
├─────────────────────────────────────────────────┤
│ テーブル                                          │
│ Order ID | Status | Carrier | Tracking | Updated │
│ ORD-001  | [READY]| -       | -        | 2分前   │
│ ORD-002  |[SHIPPED]| 🚚ヤマト| 1234...  | 1時間前 │
├─────────────────────────────────────────────────┤
│ ◀ 1 2 3 ... 10 ▶                                │
└─────────────────────────────────────────────────┘
```

## ステータスバッジ配色（参照: ui-dashboard-design v0.2.2）

| ステータス | 色 | 備考 |
|------------|-----|------|
| CREATED | Gray | |
| READY | Orange (Primary) | **最重要 - 要作業** |
| SHIPPED | Green | |
| DELIVERED | Green | |
| RETURNED | Red | 要対応 |
| CANCELLED | Gray | |

## テーブルカラム

| Column | 内容 | UI 備考 |
|--------|------|---------|
| Order ID | 注文ID | Link（詳細Sheetを開く）、`font-mono` |
| Status | ステータス | Badge（色分け） |
| Carrier | 配送業者 | アイコン + テキスト |
| Tracking | 追跡番号 | `font-mono` + Copy ボタン |
| Updated | 更新日時 | Relative Time (例: 2分前) |
| Action | 操作 | Edit（Pencil Icon） |

## ファイル構成（ADR-003 準拠）

```
src/features/shipping/
├── api/
│   ├── use-shippings.ts      # TanStack Query hook
│   └── shipping-api.ts       # API クライアント
├── components/
│   ├── shipping-list.tsx     # メインコンポーネント
│   ├── shipping-table.tsx    # TanStack Table
│   ├── filter-bar.tsx        # フィルタバー
│   └── status-badge.tsx      # ステータスバッジ
├── types/
│   └── shipping.ts           # 型定義
└── index.ts                  # Public API
```

## デモ / 確認方法
- ブラウザで一覧画面を開く → **初期状態で READY フィルタ**
- 各フィルタを操作してテーブルが更新されることを確認
- ページネーションで次ページに移動
- 追跡番号の Copy ボタンでクリップボードにコピー

## 非スコープ
- 詳細シート
- 編集機能
- エラーハンドリング詳細

## 依存関係
- issue-002 (Frontend Setup) 完了が前提
- issue-003 (List API) 完了が前提

## 次の Issue
- issue-007 (Detail/Edit UI)

## 関連ドキュメント
- [ADR-003: UI アーキテクチャ (Feature-based)](../adr/ADR-003-ui-architecture.md)
- [ui-dashboard-design.md v0.2.2](../architecture/ui-dashboard-design.md)
- [ui-api-interface-mapping.md v0.2.0](../architecture/ui-api-interface-mapping.md)
