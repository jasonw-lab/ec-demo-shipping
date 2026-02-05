# Issue 015: 発送一覧画面 Horizon UI 移行

**作成日**: 2026-01-26  
**優先度**: P1  
**工数見積**: 1日  
**ステータス**: 🔴 未着手  
**前提条件**: Issue 013（レイアウトシステム統一）完了  
**関連 ADR**: [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)

---

## 📋 概要

既存の発送一覧画面（Issue 011 で拡張済み）を Horizon UI ベースにリファクタリングする。

**重要**: UI フレームワークの移行のみを行い、機能仕様・ビジネスロジックは完全に維持します。

---

## 📖 機能仕様参照

本Issueは以下の既存仕様を維持します：

### 参照ドキュメント
- **[Issue 011: 発送一覧画面操作性改善](issue-011-shipping-list.md)** - フィルタ、ソート、一括操作の詳細仕様

### 機能仕様の詳細

#### 一括操作トランザクション方針
- **戦略**: 部分成功方式（業務継続性優先）
- **API**: `PATCH /api/v1/shipments/bulk`
- **レスポンス形式**:
  ```json
  {
    "success": [{"id": 1, "status": "SHIPPED"}],
    "failed": [{"id": 2, "error": "VERSION_CONFLICT", "message": "..."}]
  }
  ```
- **楽観ロック**: 各行のversionを送信、競合時は409を個別返却
- **UI表示**: 結果サマリをToastで表示、失敗行はテーブル上でハイライト
- **再試行機能**: 失敗行の「再試行」ボタンを提供（最新データ取得後に再実行）

#### データ取得API
- **一覧取得**: `GET /api/v1/shipments?page={n}&limit=20&sort=updated_at&order=desc`
- **ソート対応カラム**: `order_id`, `status`, `updated_at`
- **デフォルトソート**: `updated_at desc`（最新順）

---

## 🎯 対応内容

### 1. データテーブル UI 変更
- Horizon UI の Table コンポーネントを使用
- 行クリック時のインタラクション改善（hover エフェクト強化）
- ステータスバッジのデザイン統一（Horizon UI の Badge variant 使用）

### 2. フィルタバー UI 変更
- Horizon UI の Input / Select コンポーネントを使用
- アクティブフィルタの可視化（Badge 表示）
- フィルタクリアボタンの追加

### 3. 一括操作 UI 変更
- 選択行数の表示（ヘッダー上部に固定表示）
- アクションボタンのデザイン統一
- 部分成功時の結果表示（Toast + テーブルハイライト）

### 4. レスポンシブ対応
- Table: Horizontal Scroll 対応（Mobile）
- フィルタバー: 折りたたみ可能（Mobile）

---

## 🛠️ 技術要件

### 使用コンポーネント
- Horizon UI: Table, Card (フィルタバーコンテナ)
- shadcn/ui: Select, Input, Badge, Button, Sheet (詳細表示)
- TanStack Table: テーブル状態管理
- lucide-react: アイコン

### ファイル変更箇所
```
apps/admin-horizon-ui/
├── app/
│   └── (dashboard)/
│       └── shipments/
│           └── page.tsx                         # Server Component (変更なし)
└── features/
    └── shipping/
        └── components/
            ├── shipping-list.tsx                # ← Horizon UI ベース (メイン変更)
            ├── shipping-table.tsx               # ← Horizon UI Table (メイン変更)
            ├── filter-bar.tsx                   # ← Horizon UI Input/Select (メイン変更)
            ├── status-badge.tsx                 # ← Horizon UI Badge (デザイン統一)
            ├── pagination.tsx                   # (軽微な変更)
            └── shipping-detail-sheet.tsx        # (Issue 016 で対応)
```

---

## ✅ 受け入れ条件

- [ ] テーブルが Horizon UI デザインで表示される
- [ ] 行クリックで発送詳細 Sheet が開く
- [ ] フィルタバーが正常に動作（ステータス / 配送業者 / 日付範囲）
- [ ] アクティブフィルタが Badge で可視化される
- [ ] ソート機能が正常に動作（各列クリック）
- [ ] 一括操作が正常に動作（複数行選択 → ステータス変更）
  - 部分成功時に結果サマリがToastで表示される
  - 失敗行がテーブル上でハイライト表示される
  - 失敗行に「再試行」ボタンが表示される
- [ ] 選択行数が表示される
- [ ] ページネーションが正常に動作
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

---

## 🎨 カスタマイズ制約（重要）

### 🚫 変更禁止
- Horizon UI の Table コンポーネント構造・スタイル
- テーブルのレイアウト・Spacing
- フィルタバーの基本レイアウト
- Input / Select コンポーネントのデザイン

### ✅ カスタマイズ可能
- ステータスバッジの variant 指定（Horizon UI の variant のみ）
  - 例: `<Badge variant="destructive">RETURNED</Badge>`
  - ❌ 禁止: `<Badge className="bg-red-500 text-white">` （独自色指定）
- フィルタ項目のラベル（日本語化）
- アクションボタンの variant 指定（視認性向上のため）
  - 例: `<Button variant="destructive">削除</Button>`
- アイコンの選択（lucide-react 範囲内）

### ⚠️ 実装時の注意
- Horizon UI の Table をベースに使用（構造は維持）
- TanStack Table のロジックと Horizon UI のスタイルを統合
- フィルタバーは Horizon UI の Input/Select をそのまま使用

---

## 🚫 非対応（本Issue外）

- データ取得ロジックの変更（`api/` は変更なし）
- CSVエクスポート機能（別Issueで対応）
- 新規フィルタ項目追加
- 一括操作のトランザクション処理改善（既存仕様を維持）

---

## 📚 参考資料

- [Issue 011: 発送一覧画面操作性改善](issue-011-shipping-list.md)
- [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)
- [Horizon UI Table Component](https://horizon-ui.com/docs-boilerplate/shadcn-components)
- [TanStack Table](https://tanstack.com/table/latest)

---

## 📝 実装ガイドライン（AI Agent 向け）

### 必須遵守事項

1. **Horizon UI の Table/Input/Select をベースに実装**
   - `components/ui/table.tsx` をそのまま使用
   - `components/ui/input.tsx` / `select.tsx` も同様

2. **TanStack Table との統合**
   ```tsx
   // Horizon UI の Table スタイルを維持しつつ、TanStack Table のロジックを使用
   import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
   import { useReactTable } from '@tanstack/react-table';
   
   const table = useReactTable({
     data: shipments,
     columns,
     getCoreRowModel: getCoreRowModel(),
     manualSorting: true, // サーバーサイドソート
     manualPagination: true,
   });
   ```

3. **カスタマイズは Horizon UI のテーマカラーのみ**
   ```tsx
   // ✅ OK: Horizon UI の variant 使用
   <Badge variant="destructive">RETURNED</Badge>
   <Badge variant="default">CREATED</Badge>
   <Badge variant="secondary">SHIPPED</Badge>
   
   <Button variant="destructive">削除</Button>
   <Button variant="default">確認</Button>
   
   // ❌ NG: Tailwind の独自色指定
   <Badge className="bg-red-500 text-white">RETURNED</Badge>
   <Button className="bg-blue-600">OK</Button>
   ```

4. **データ取得・状態管理は変更しない**
   - `features/shipping/api/` は維持
   - `useState` でのフィルタ管理を継続
   - 一括操作の部分成功ロジックは既存実装を維持

### 一括操作の結果表示実装例

```tsx
// 一括更新実行後
const result = await bulkUpdateShipments(selectedIds, newStatus);

// Toast で結果サマリ表示
toast({
  title: result.success.length > 0 ? "一部成功" : "エラー",
  description: `成功: ${result.success.length}件、失敗: ${result.failed.length}件`,
  variant: result.failed.length > 0 ? "destructive" : "default",
});

// 失敗行をハイライト表示
const failedIds = result.failed.map(f => f.id);
setHighlightedRows(failedIds);
```

---

**このIssueは Issue 013（レイアウトシステム統一）完了後に着手してください。**
