# issue-007: Shipping Detail & Edit UI

## 概要
発送詳細シートで内容確認・ステータス更新ができる

## 目的
倉庫担当者が発送の詳細を確認し、出荷処理を完了できるようにする

## エピック
E2: 発送詳細・編集

## やること
- Sheet (右サイドバー) コンポーネント実装
- 詳細表示セクション (読み取り専用)
- 編集フォーム (React Hook Form + Zod)
- CREATED→READY ボタン
- READY→SHIPPED フォーム (業者選択 + 追跡番号)
- SHIPPED/RETURNED での追跡リンク表示
- 楽観ロックエラー時の Toast + リロード
- バリデーションエラーのフィールド単位表示

## 受け入れ条件
- [ ] 一覧から行クリックで詳細シートが開く
- [ ] 発送詳細 (住所, ステータス等) が表示される
- [ ] CREATED から READY に更新できる
- [ ] READY から SHIPPED に更新できる (業者 + 追跡番号入力)
- [ ] SHIPPED/RETURNED で追跡リンクが表示される（別タブで開く）
- [ ] 400 エラー時にフィールド単位でエラー表示
- [ ] 404 エラー時に Sheet を閉じる
- [ ] 409 エラー時に競合 Toast が表示され、自動再取得される
- [ ] `Esc` キーで Sheet を閉じられる

## 画面構成（参照: ui-dashboard-design v0.2.2）

```
┌─────────────────────────────────┐
│ 発送詳細               [×]     │
├─────────────────────────────────┤
│ Order ID: ORD-001 [Copy]        │
│ ステータス: [READY]             │
│                                 │
│ ── 配送先 ──                    │
│ 〒150-0001                      │
│ 東京都渋谷区神宮前1-2-3         │
│ ABCビル 101                     │
│                                 │
│ ── 出荷処理 ──                  │
│ [配送業者 ▼]                    │
│ [追跡番号: ____________]        │
│ ※ 12桁の数字を入力              │
│                                 │
│ [出荷完了]                      │
└─────────────────────────────────┘
```

## ステータス別 UI 分岐

| 現在のステータス | 表示するアクション |
|------------------|-------------------|
| CREATED | 「出荷準備完了」ボタン (→ READY) |
| READY | 業者選択 + 追跡番号 + 「出荷完了」ボタン (→ SHIPPED) |
| SHIPPED | 追跡リンク + 「配達完了」ボタン (→ DELIVERED) |
| DELIVERED | 追跡リンクのみ（アクションなし） |
| RETURNED | 追跡リンクのみ（アクションなし） |

## 追跡リンク生成（Frontend 側で URL 構築）

| 業者 | URL パターン |
|------|-------------|
| YAMATO | `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number={tracking_number}` |
| SAGAWA | `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo={tracking_number}` |
| JAPAN_POST | `https://trackings.post.japanpost.jp/services/srv/search?requestNo1={tracking_number}` |

## バリデーション (Zod)

```typescript
const shipSchema = z.object({
  carrier: z.enum(['YAMATO', 'SAGAWA', 'JAPAN_POST']),
  tracking_number: z.string()
    .min(11, '追跡番号は11桁以上です')
    .max(14, '追跡番号は14桁以下です')
    .regex(/^[A-Z0-9]+$/, '英数字のみ使用できます'),
  version: z.number()
});
```

## エラーハンドリング（参照: ui-api-interface-mapping v0.2.0）

| HTTP Status | UI挙動 |
|-------------|--------|
| 400 | フィールド単位で FormMessage 表示 |
| 404 | Sheet を閉じる + Toast「データが見つかりません」 |
| 409 | Toast「データの競合が発生しました」+ 自動再取得 |
| 500 | 共通エラートースト |

### 409 Conflict 処理

```typescript
if (error.status === 409) {
  toast.error('データの競合が発生しました。他のユーザーが既に更新しています。', {
    action: {
      label: '最新情報を読み込む',
      onClick: () => refetch()
    }
  });
  await queryClient.invalidateQueries(['shipping', orderId]);
}
```

## ファイル構成

```
src/features/shipping/
├── api/
│   ├── use-shipping-detail.ts   # 詳細取得 hook
│   └── use-update-shipping.ts   # 更新 mutation hook
├── components/
│   ├── shipping-detail-sheet.tsx # Sheet コンテナ
│   ├── shipping-info.tsx         # 詳細表示
│   ├── ship-form.tsx             # 出荷フォーム
│   ├── tracking-link.tsx         # 追跡リンク
│   └── status-action-button.tsx  # ステータス更新ボタン
└── index.ts
```

## デモ / 確認方法
- 一覧から発送を選択 → シート表示
- ステータス更新を実行 → 一覧に反映
- SHIPPED の発送で追跡リンクをクリック → 別タブで追跡ページ表示
- 別タブで同じ発送を開き、同時更新で 409 を確認
- 不正な追跡番号で 400 エラー → フィールド下にエラー表示

## 非スコープ
- RETURNED 処理の詳細フロー
- 住所変更

## 依存関係
- issue-006 (List UI) 完了が前提
- issue-004 (Detail/Update API) 完了が前提

## 次の Issue
- issue-008 (Summary UI)

## 関連ドキュメント
- [ADR-005: 排他制御 (Optimistic Lock)](../adr/ADR-005-optimistic-lock.md)
- [ui-dashboard-design.md v0.2.2](../architecture/ui-dashboard-design.md)
- [ui-api-interface-mapping.md v0.2.0](../architecture/ui-api-interface-mapping.md)
