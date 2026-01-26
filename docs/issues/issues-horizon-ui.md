# Horizon UI リファクタリング Issue 管理

**作成日**: 2026-01-26  
**対象プロジェクト**: Shipping Service Admin UI  
**リファクタリングスコープ**: apps/admin-horizon-ui への UI 統一  
**根拠 ADR**: [ADR-006: Horizon UI Shadcn テンプレート採用](../adr/ADR-006-horizon-ui-adoption.md)

---

## 📋 リファクタリング概要

### 目的
現在のハイブリッド UI 構成（arhamkhnz + shadcn Blocks）から、**Horizon UI Shadcn Boilerplate** に統一することで、以下を実現する：

- UI/UX の一貫性向上
- 保守性の改善（単一ソース管理）
- 開発効率の向上（明確な UI パターン）
- ダークモード完全対応

### 基本方針
- **段階的移行**: 画面単位で順次リファクタリング
- **機能保証**: 既存機能の動作を完全に保証（API 層・ビジネスロジック層は変更なし）
- **並行稼働**: `apps/admin-ui` を一時的に保持（ロールバック可能）
- **🎨 Horizon UI スタイル維持（重要）**: レイアウト・テーマシステムは変更しない
  - Horizon UI のソースコードをベースに開発
  - 全体的な画面スタイル・レイアウトシステムは維持
  - **テーマ色の一貫性保証**: Horizon UI 定義のカラーパレットのみ使用
  - 個別コンポーネントの variant 指定は許容（Horizon UI の variant のみ）

---

## 🎯 Issue 一覧

| Issue ID | 画面/機能 | 優先度 | 工数見積 | ステータス |
|---|---|---|---|---|
| [Issue 013](#issue-013-レイアウトシステム統一) | レイアウトシステム統一 | P0 | 1日 | 🔴 未着手 |
| [Issue 014](#issue-014-ダッシュボード画面-horizon-ui-移行) | ダッシュボード画面 | P1 | 0.5〜1日 | 🔴 未着手 |
| [Issue 015](#issue-015-発送一覧画面-horizon-ui-移行) | 発送一覧画面 | P1 | 1日 | 🔴 未着手 |
| [Issue 016](#issue-016-発送詳細画面-horizon-ui-移行) | 発送詳細画面 | P1 | 0.5〜1日 | 🔴 未着手 |

**合計工数見積**: 3〜4日

---

## Issue 013: レイアウトシステム統一

### 概要
Horizon UI の Layout System（Sidebar / Header / Theme）を基盤として整備し、すべての画面で共通使用する。

### 対応内容

#### 1. Horizon UI Layout System 整備
- `components/layouts/` に Horizon UI ベースのレイアウトを配置
- Sidebar / Header / DashboardLayout の実装
- next-themes による Light/Dark Mode 切り替え

#### 2. テーマシステム検証・確定
- Horizon UI のテーマシステムをそのまま採用（変更なし）
- 既存の Tailwind CSS カスタムカラー設定（`tailwind.config.ts`）を確認・検証
- 既存の CSS Variables デザイントークン（`globals.css`）を確認・検証
- Light/Dark Mode 切り替えが正常に動作することを検証
- **注意**: テーマシステムの変更・カスタマイズは行わない

#### 3. ナビゲーション構造
```
Sidebar
 ├─ ダッシュボード (/)
 └─ 発送一覧 (/shipments)
```

#### 4. レスポンシブ対応
- Sidebar の折りたたみ機能
- Mobile 表示対応（ハンバーガーメニュー）

### 技術要件

#### 使用コンポーネント
- Horizon UI: Layout System (Sidebar, Header, DashboardLayout)
- shadcn/ui: Button, Sheet (Mobile Menu)
- lucide-react: アイコン

#### ディレクトリ構造
```
apps/admin-horizon-ui/
├── components/
│   └── layouts/
│       ├── sidebar.tsx           # Horizon UI ベースのサイドバー
│       ├── header.tsx            # Horizon UI ベースのヘッダー
│       ├── dashboard-layout.tsx  # メインレイアウト
│       └── index.ts
├── styles/
│   └── globals.css               # CSS Variables & Theme
└── tailwind.config.ts            # デザイントークン設定
```

### 受け入れ条件
- [ ] Light/Dark Mode が正常に切り替わる
- [ ] Sidebar が折りたたみ可能
- [ ] Mobile 表示で正常に動作（ハンバーガーメニュー表示）
- [ ] すべてのページで共通レイアウトが適用される
- [ ] アクセシビリティ検証（キーボード操作可能）

### カスタマイズ制約（重要）

#### 🚫 変更禁止（Horizon UI をそのまま使用）
- Sidebar の構造・スタイル・幅
- Header の構造・スタイル・高さ
- テーマシステム（CSS Variables / デザイントークン）
- レイアウトグリッド・Spacing システム
- Light/Dark Mode 切り替え機構

#### ✅ カスタマイズ可能
- ナビゲーション項目（日本語ラベル、リンク先）
- アイコンの選択（lucide-react 範囲内）
- ロゴ・ブランディング要素

#### ⚠️ 変更が必要な場合
全体スタイル・レイアウトの変更が必要と判断した場合：
1. 変更理由を文書化
2. 代替案を検討（Horizon UI の枠内で解決できないか）
3. Tech Lead の承認を得る

### 非対応（本Issue外）
- ユーザープロファイル機能（ヘッダー右上）
- 多言語対応
- 通知機能

---

## Issue 014: ダッシュボード画面 Horizon UI 移行

### 概要
既存のダッシュボード画面（Issue 010 で拡張済み）を Horizon UI ベースにリファクタリングする。

### 機能仕様参照
本Issueは以下の既存仕様を維持します：
- **[Issue 010: ダッシュボード画面改善](issue-010-dashboard.md)** - KPI定義、要対応発送リスト仕様
- **SHIPPED TODAY定義**: JST基準で当日00:00:00〜23:59:59の間にステータスがSHIPPEDに変更された発送
- **要対応発送の優先度**: ①RETURNED（全件）→ ②CREATED（作成後24h超過）→ ③READY（更新日時の古い順）
- **データ取得**: `GET /api/v1/shipments/summary` (KPI), `GET /api/v1/shipments/priority?limit=5` (要対応リスト)

### 現状の機能（維持が必要）
- KPI カード表示（CREATED / READY / SHIPPED TODAY / RETURNED）
- KPI カードからのフィルタ付き遷移
- 要対応発送リスト表示（最大5件、上記優先度ルールに従う）

### 対応内容

#### 1. KPI カード UI 変更
- Horizon UI の Card コンポーネントを使用
- クリッカブルデザインの強化（hover エフェクト）
- RETURNED カードの警告表示（赤色強調）

#### 2. 要対応発送リスト UI 変更
- Horizon UI の Table コンポーネントを使用
- コンパクト表示（Dashboard 下部に配置）
- 「すべて表示」リンクの視認性向上

#### 3. レスポンシブ対応
- KPI カード: Grid レイアウト（Mobile: 1列、Tablet: 2列、Desktop: 4列）
- 要対応リスト: Horizontal Scroll 対応（Mobile）

### 技術要件

#### 使用コンポーネント
- Horizon UI: Card (KPI カード)
- shadcn/ui: Table (要対応リスト), Badge (ステータス表示)
- lucide-react: アイコン

#### ファイル変更箇所
```
apps/admin-horizon-ui/
├── app/
│   └── (dashboard)/
│       └── page.tsx                      # Server Component (変更なし)
└── features/
    └── shipping/
        └── components/
            ├── dashboard.tsx              # ← Horizon UI ベース (メイン変更)
            └── summary-card.tsx           # ← Horizon UI Card (メイン変更)
```

### 受け入れ条件
- [ ] KPI カードが Horizon UI デザインで表示される
- [ ] KPI カードクリックで適切な発送一覧に遷移する
- [ ] RETURNED カードが警告表示（赤色強調）される
- [ ] 要対応発送リストが正しく表示される（最大5件）
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

### カスタマイズ制約（重要）

#### 🚫 変更禁止
- Horizon UI の Card コンポーネント構造
- グリッドレイアウトシステム（`grid gap-4 md:grid-cols-2 lg:grid-cols-4`）
- Horizon UI が提供する Spacing / Padding
- テーマカラーシステム

#### ✅ カスタマイズ可能
- KPI カードの variant 指定（Horizon UI の variant のみ）
  - 例: RETURNED は `variant="destructive"` または `className="border-destructive bg-destructive/10"`
  - ❌ 禁止: `className="border-red-300 bg-red-50"` （独自色指定）
- カード内のアイコン（lucide-react 範囲内）
- カード内のテキスト・ラベル（日本語化）
- 数値フォーマット（3桁カンマ区切りなど）

#### ⚠️ 実装時の注意
- Horizon UI の Card コンポーネントをベースに使用
- 構造は変更せず、`className` での色変更に留める
- レスポンシブグリッドは Horizon UI のパターンを維持

### 非対応（本Issue外）
- データ取得ロジックの変更（`api/` は変更なし）
- グラフ・チャート追加
- 新規 KPI 追加

### 実装ガイドライン（AI Agent 向け）

#### 必須遵守事項
1. **Horizon UI のソースコードをベースに実装**
   - `components/ui/card.tsx` をそのまま使用
   - 構造・スタイルは変更しない

2. **カスタマイズは Horizon UI のテーマカラーのみ**
   ```tsx
   // ✅ OK: Horizon UI のテーマカラー使用
   <Card className="border-destructive bg-destructive/10">
     <CardContent className="text-destructive-foreground">
       返送が発生しています
     </CardContent>
   </Card>
   
   // ❌ NG: Tailwind の独自色指定
   <Card className="border-red-300 bg-red-50">
   </Card>
   ```

3. **データ取得ロジックは変更しない**
   - `features/shipping/api/` は維持

4. **Horizon UI の推奨パターンに従う**
   - ドキュメント参照: https://horizon-ui.com/docs-boilerplate/shadcn-components

---

## Issue 015: 発送一覧画面 Horizon UI 移行

### 概要
既存の発送一覧画面（Issue 011 で拡張済み）を Horizon UI ベースにリファクタリングする。

### 機能仕様参照
本Issueは以下の既存仕様を維持します：
- **[Issue 011: 発送一覧画面操作性改善](issue-011-shipping-list.md)** - フィルタ、ソート、一括操作の詳細仕様
- **一括操作トランザクション方針**: 部分成功方式（業務継続性優先）
  - API: `PATCH /api/v1/shipments/bulk` は成功/失敗を個別に返却
  - 楽観ロック: 各行のversionを送信、競合時は409を個別返却
  - UI表示: 結果サマリをToastで表示、失敗行はテーブル上でハイライト
  - 失敗行の「再試行」機能を提供
- **データ取得**: `GET /api/v1/shipments?page={n}&limit=20&sort=updated_at&order=desc`

### 現状の機能（維持が必要）
- 発送データテーブル表示（ステータス / 注文ID / 配送業者 / 更新日時）
- 行クリックで発送詳細 Sheet 表示
- フィルタバー（ステータス / 配送業者 / 日付範囲）
- ソート機能（各列クリック）
- ページネーション
- 一括操作（複数行選択 → ステータス変更、上記トランザクション方針に従う）

### 対応内容

#### 1. データテーブル UI 変更
- Horizon UI の Table コンポーネントを使用
- 行クリック時のインタラクション改善（hover エフェクト強化）
- ステータスバッジのデザイン統一

#### 2. フィルタバー UI 変更
- Horizon UI の Input / Select コンポーネントを使用
- アクティブフィルタの可視化（Badge 表示）
- フィルタクリアボタンの追加

#### 3. 一括操作 UI 変更
- 選択行数の表示（ヘッダー上部に固定表示）
- アクションボタンのデザイン統一

#### 4. レスポンシブ対応
- Table: Horizontal Scroll 対応（Mobile）
- フィルタバー: 折りたたみ可能（Mobile）

### 技術要件

#### 使用コンポーネント
- Horizon UI: Table, Card (フィルタバーコンテナ)
- shadcn/ui: Select, Input, Badge, Button, Sheet (詳細表示)
- lucide-react: アイコン

#### ファイル変更箇所
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

### 受け入れ条件
- [ ] テーブルが Horizon UI デザインで表示される
- [ ] 行クリックで発送詳細 Sheet が開く
- [ ] フィルタバーが正常に動作（ステータス / 配送業者 / 日付範囲）
- [ ] アクティブフィルタが Badge で可視化される
- [ ] ソート機能が正常に動作（各列クリック）
- [ ] 一括操作が正常に動作（複数行選択 → ステータス変更）
- [ ] 選択行数が表示される
- [ ] ページネーションが正常に動作
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

### カスタマイズ制約（重要）

#### 🚫 変更禁止
- Horizon UI の Table コンポーネント構造・スタイル
- テーブルのレイアウト・Spacing
- フィルタバーの基本レイアウト
- Input / Select コンポーネントのデザイン

#### ✅ カスタマイズ可能
- ステータスバッジの variant 指定（Horizon UI の variant のみ）
  - 例: `<Badge variant="destructive">RETURNED</Badge>`
  - ❌ 禁止: `<Badge className="bg-red-500 text-white">` （独自色指定）
- フィルタ項目のラベル（日本語化）
- アクションボタンの variant 指定（視認性向上のため）
  - 例: `<Button variant="destructive">削除</Button>`
- アイコンの選択（lucide-react 範囲内）

#### ⚠️ 実装時の注意
- Horizon UI の Table をベースに使用（構造は維持）
- TanStack Table のロジックと Horizon UI のスタイルを統合
- フィルタバーは Horizon UI の Input/Select をそのまま使用

### 非対応（本Issue外）
- データ取得ロジックの変更（`api/` は変更なし）
- CSVエクスポート機能
- 新規フィルタ項目追加
- 一括操作のトランザクション処理改善（既存仕様を維持）

### 実装ガイドライン（AI Agent 向け）

#### 必須遵守事項
1. **Horizon UI の Table/Input/Select をベースに実装**
   - `components/ui/table.tsx` をそのまま使用
   - `components/ui/input.tsx` / `select.tsx` も同様

2. **TanStack Table との統合**
   ```tsx
   // Horizon UI の Table スタイルを維持しつつ、TanStack Table のロジックを使用
   import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
   import { useReactTable } from '@tanstack/react-table';
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

---

## Issue 016: 発送詳細画面 Horizon UI 移行

### 概要
既存の発送詳細画面（Issue 012 で拡張済み）を Horizon UI ベースにリファクタリングする。

### 機能仕様参照
本Issueは以下の既存仕様を維持します：
- **[Issue 012: 発送詳細画面情報拡充](issue-012-shipping-detail.md)** - タイムライン、配送情報、監査ログ、操作エリアの詳細仕様
- **タイムライン取得**: `GET /api/v1/shipments/{id}/timeline` - 監査ログから復元
- **監査ログ取得**: `GET /api/v1/shipments/{id}/audit-logs?limit=10&offset=0` - 最新10件ずつ読み込み
- **配送業者追跡URL**: フロントエンド定数で管理（YAMATO, SAGAWA, JAPANPOST）
- **楽観ロック**: バージョン管理によるVERSION_CONFLICT検知
- **返送処理**: ステータスをRETURNEDに変更のみ（後続業務連携は別Issue）

### 現状の機能（維持が必要）
- Sheet（サイドドロワー）での詳細表示
- 基本情報表示（注文ID / ステータス / 配送業者 / 住所）
- タイムライン表示（ステータス変更履歴、監査ログから復元）
- 配送情報表示（追跡番号 / 配送予定日、業者別外部リンク）
- 監査ログ表示（更新者 / 更新日時、最新10件 + 追加読み込み）
- ステータス変更フォーム（ステータス別の入力項目）
- 楽観ロック対応（バージョン管理）

### 対応内容

#### 1. Sheet デザイン変更
- Horizon UI の Sheet コンポーネントを使用
- セクション区切りの視認性向上（Card コンポーネント使用）
- アクションボタンの配置最適化（Sheet Footer に固定）

#### 2. タイムライン UI 変更
- Horizon UI のタイムラインスタイルを適用
- 各ステータス変更のビジュアル強化（アイコン + 色分け）

#### 3. フォーム UI 変更
- Horizon UI の Form コンポーネントを使用
- バリデーションエラー表示のデザイン統一
- ローディング状態の視認性向上

#### 4. レスポンシブ対応
- Sheet の幅調整（Desktop: 50%, Mobile: 100%）
- フォーム項目のレイアウト最適化（Mobile: 1列）

### 技術要件

#### 使用コンポーネント
- Horizon UI: Sheet, Card (セクションコンテナ), Form
- shadcn/ui: Input, Select, Button, Badge, Toast (エラー通知)
- lucide-react: アイコン

#### ファイル変更箇所
```
apps/admin-horizon-ui/
└── features/
    └── shipping/
        └── components/
            ├── shipping-detail-sheet.tsx        # ← Horizon UI Sheet (メイン変更)
            ├── shipping-info.tsx                # ← Horizon UI Card (デザイン統一)
            ├── ship-form.tsx                    # ← Horizon UI Form (メイン変更)
            ├── tracking-link.tsx                # (軽微な変更)
            └── status-action-button.tsx         # (軽微な変更)
```

### 受け入れ条件
- [ ] Sheet が Horizon UI デザインで表示される
- [ ] 基本情報が正しく表示される
- [ ] タイムラインが視覚的に分かりやすく表示される
- [ ] 配送情報・監査ログが正しく表示される
- [ ] ステータス変更フォームが正常に動作（ステータス別の入力項目）
- [ ] バリデーションエラーが適切に表示される
- [ ] 楽観ロック競合時にエラーメッセージが表示される
- [ ] 送信成功時に Toast 通知が表示される
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

### カスタマイズ制約（重要）

#### 🚫 変更禁止
- Horizon UI の Sheet コンポーネント構造・スタイル
- Sheet の幅・高さ・アニメーション
- Form コンポーネントのレイアウト・Spacing
- Card セクションの基本構造

#### ✅ カスタマイズ可能
- セクション内の情報配置（業務要件に応じて）
- タイムラインアイコンの選択（lucide-react 内）
- タイムラインの色: Horizon UI のテーマカラー使用
  - 例: `text-primary`, `text-destructive`, `text-muted-foreground`
  - ❌ 禁止: `text-blue-600`, `text-red-500` （独自色指定）
- フォーム項目のラベル（日本語化）
- バリデーションエラーメッセージ
- アクションボタンの variant 指定

#### ⚠️ 実装時の注意
- Horizon UI の Sheet/Form/Card をベースに使用
- セクション区切りは Card コンポーネントで実現
- タイムラインは Horizon UI のスタイルに準拠

### 非対応（本Issue外）
- データ取得ロジックの変更（`api/` は変更なし）
- ステータスフローの変更
- 新規フィールド追加
- 配送業者APIとのリアルタイム連携

### 実装ガイドライン（AI Agent 向け）

#### 必須遵守事項
1. **Horizon UI の Sheet/Form/Card をベースに実装**
   - `components/ui/sheet.tsx` をそのまま使用
   - `components/ui/form.tsx` も同様
   - 構造は変更しない

2. **React Hook Form との統合**
   ```tsx
   // Horizon UI の Form コンポーネントと React Hook Form を統合
   import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
   import { useForm } from 'react-hook-form';
   ```

3. **セクション区切りは Card で実現**
   ```tsx
   <Sheet>
     <SheetContent>
       <Card>
         <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
         <CardContent>...</CardContent>
       </Card>
       <Card>
         <CardHeader><CardTitle>タイムライン</CardTitle></CardHeader>
         <CardContent>...</CardContent>
       </Card>
     </SheetContent>
   </Sheet>
   ```

4. **カスタマイズは Horizon UI のテーマカラーのみ**
   ```tsx
   // ✅ OK: タイムラインで Horizon UI のテーマカラー使用
   <div className="flex items-center gap-2">
     <div className="bg-primary h-2 w-2 rounded-full" />
     <span className="text-primary">CREATED</span>
   </div>
   <div className="flex items-center gap-2">
     <div className="bg-destructive h-2 w-2 rounded-full" />
     <span className="text-destructive">RETURNED</span>
   </div>
   
   // ❌ NG: Tailwind の独自色指定
   <div className="bg-blue-600 h-2 w-2 rounded-full" />
   <span className="text-red-500">RETURNED</span>
   ```

5. **データ取得・バリデーションは変更しない**
   - `features/shipping/api/` は維持
   - React Hook Form のバリデーションロジックを継続
   - 楽観ロックエラーハンドリングは既存のまま

---

## 🔍 レビューフォーマット

各 Issue のレビューは以下のフォーマットで実施し、**同一 md ファイル内に追記**する。

### レビューセクションテンプレート

```markdown
---

## 📝 Issue [Issue番号] レビュー結果

**レビュー実施日**: YYYY-MM-DD  
**レビュー担当**: [担当者名 or モデル名]  
**対象 Issue**: [Issue 番号 - Issue タイトル]

### ✅ 実装確認項目

#### 機能要件
- [ ] 項目1: [確認結果]
- [ ] 項目2: [確認結果]
- [ ] 項目3: [確認結果]

#### UI/UX 品質
- [ ] Horizon UI デザインシステム準拠
- [ ] Light/Dark Mode 正常動作
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）
- [ ] アクセシビリティ（キーボード操作、ARIA 属性）

#### コード品質
- [ ] Feature-based Architecture (ADR-003) 準拠
- [ ] 既存 API 層・ビジネスロジック層への影響なし
- [ ] TypeScript 型安全性保証
- [ ] ESLint / Prettier 準拠

### 🐛 指摘事項

#### 🔴 Critical (実装前に対応必須)
1. [指摘内容]
   - **現状**: [問題の詳細]
   - **期待**: [あるべき姿]
   - **対応方針**: [修正案]

#### 🟡 Warning (改善推奨)
1. [指摘内容]
   - **現状**: [問題の詳細]
   - **提案**: [改善案]

#### 💡 Suggestion (任意改善)
1. [指摘内容]
   - **提案**: [改善案]

### 📊 テスト結果

#### 手動テスト
- [ ] 基本動作確認（Happy Path）
- [ ] エラーハンドリング確認
- [ ] レスポンシブ表示確認
- [ ] ダークモード確認

#### 自動テスト
- [ ] Unit Test 実行結果: [Pass/Fail]
- [ ] E2E Test 実行結果: [Pass/Fail]

### 🎯 総合評価

**ステータス**: [承認 / 条件付き承認 / 差し戻し]

**コメント**:
[総合的な評価コメント]

**次のアクション**:
- [ ] アクション1
- [ ] アクション2

---
```

### レビュー実施タイミング

1. **実装前レビュー** (Design Review)
   - Issue 仕様の妥当性確認
   - 技術的な懸念点の洗い出し
   - 工数見積の妥当性確認

2. **実装後レビュー** (Code Review)
   - コード品質確認
   - 受け入れ条件の達成確認
   - テスト結果の検証

3. **統合レビュー** (Integration Review)
   - 全 Issue 完了後の統合確認
   - パフォーマンス検証
   - アクセシビリティ検証

---

## 📈 進捗管理

### 進捗状況

| ステータス | Icon | 説明 |
|---|---|---|
| 未着手 | 🔴 | Issue 着手前 |
| 実装中 | 🟡 | 実装作業中 |
| レビュー待ち | 🔵 | 実装完了・レビュー待ち |
| 修正中 | 🟠 | レビュー指摘対応中 |
| 完了 | 🟢 | レビュー承認・実装完了 |

### マイルストーン

- **Phase 1 完了**: Issue 013 完了（レイアウトシステム統一）
- **Phase 2 完了**: Issue 014〜016 完了（全画面移行）
- **Phase 3 完了**: 統合テスト・パフォーマンステスト完了

---

## 📚 参考資料

### プロジェクト資料
- [ADR-006: Horizon UI Shadcn テンプレート採用](../adr/ADR-006-horizon-ui-adoption.md)
- [ADR-001: UI フレームワーク選定](../adr/ADR-001-ui-framework.md)
- [ADR-003: UI アプリアーキテクチャ](../adr/ADR-003-ui-architecture.md)
- [ui-dashboard-design.md](../architecture/ui-dashboard-design.md)
- [ui-api-interface-mapping.md](../architecture/ui-api-interface-mapping.md)

### 技術リファレンス
- [Horizon UI Shadcn Boilerplate](https://horizon-ui.com/shadcn-ui)
- [Horizon UI Documentation](https://horizon-ui.com/docs-boilerplate/shadcn-components)
- [shadcn/ui](https://ui.shadcn.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🚀 開始方法

### 1. Issue 013（レイアウトシステム）から着手
```bash
# apps/admin-horizon-ui に移動
cd apps/admin-horizon-ui

# 依存パッケージインストール
npm install

# 開発サーバー起動
npm run dev
```

### 2. 実装ガイドライン確認
- Horizon UI のコンポーネント使用例を参照
- 既存の `apps/admin-ui` から機能ロジックを維持
- API 層（`features/shipping/api/`）は変更しない

### 3. レビューリクエスト
- 実装完了後、本ファイルにレビュー結果を追記
- レビューテンプレートを使用して構造化

---

**このドキュメントは、Horizon UI リファクタリングプロジェクトの管理マスターファイルです。**  
**すべてのレビュー結果は本ファイルに集約されます。**

---

## レビュー記録

20260126 123500 Copilot(GPT-5.2) 指摘：本ドキュメントは「UI置き換え」だけでなく、既存機能仕様（例: Issue 010/011/012 の追加要件）を“維持”する前提なので、各 Issue に **機能仕様の参照先**（どの Issue / API / 定義に準拠するか）を明記すると、移行中の仕様ブレを防げます。
20260126 123500 Copilot(GPT-5.2) 指摘：Issue 014（Dashboard）は「SHIPPED TODAY」「要対応発送」の **定義が機能仕様として未記載**です。既存の合意（タイムゾーン・優先度ルール・API有無）があるなら、本Issueに参照で良いので必ず追記してください。
20260126 123500 Copilot(GPT-5.2) 指摘：Issue 015（一括操作）は **部分成功/全失敗/ロールバック方針**が機能仕様として不明確です（UIだけ移行でもユーザー体験に直結）。既存仕様があるなら参照、無いなら最小の仕様決定（レスポンス形式・失敗表示）を追記してください。
20260126 123500 Copilot(GPT-5.2) 指摘：Issue 013 は「テーマシステム統一」と書かれており、作業内容に `tailwind.config.ts` / `globals.css` の変更が含まれるように読めます。一方で本プロジェクト方針は「Horizon UI のテーマ色・テーマシステムは変更しない」です。作成者は **“統一=変更” ではなく “統一=Horizon UI を採用し検証して固定化”** と読めるように記述を調整してください。
20260126 123500 Copilot(GPT-5.2) 指摘：テーマ色一貫性の方針が明確になっていて良いです。実装時は `variant` / `bg-primary` 等の **Horizon UI テーマカラーのみ**で表現し、Tailwind の色直指定（`bg-blue-600` 等）は禁止ルールを徹底してください。
20260126 123500 Copilot(GPT-5.2) 質問：仕様参照の置き場所はどこにしますか？（A）各 Issue 内に「機能仕様参照」セクションを追加、（B）別の “機能仕様マスタ” を作ってリンク、どちらが運用しやすいですか？
20260126 123500 Copilot(GPT-5.2) 質問：テーマ色一貫性の “例外申請” は運用上必要ですか？（例: 法令対応の強制カラー、ブランド統一など）必要なら、申請条件（期限・影響範囲・ロールバック）を決めておくと破綻しません。
20260126 130000 Claude(Sonnet-4.5) 対応完了：レビュー指摘への対応結果を記録します。
20260126 130000 Claude(Sonnet-4.5) 対応①：Issue 013「テーマシステム統一」→「テーマシステム検証・確定」に修正。Horizon UIのテーマを「変更しない・検証のみ」と明記しました。
20260126 130000 Claude(Sonnet-4.5) 対応②：Issue 014に機能仕様参照セクション追加。SHIPPED TODAY定義（JST基準）、要対応発送の優先度ルール（①RETURNED→②CREATED 24h超過→③READY古い順）を明記しました。参照元はIssue 010です。
20260126 130000 Claude(Sonnet-4.5) 対応③：Issue 015に機能仕様参照セクション追加。一括操作トランザクション方針（部分成功方式、個別エラー返却、再試行機能）を明記しました。参照元はIssue 011です。
20260126 130000 Claude(Sonnet-4.5) 対応④：Issue 016に機能仕様参照セクション追加。タイムライン復元方法（監査ログから）、配送業者URL管理（フロントエンド定数）、返送処理範囲（ステータス変更のみ）を明記しました。参照元はIssue 012です。
20260126 130000 Claude(Sonnet-4.5) 対応⑤：テーマ色一貫性のポジティブフィードバック→対応不要（既に各Issueで「🚫変更禁止」「✅カスタマイズ可能」を明記済み、コード例も記載済み）。
20260126 130000 Claude(Sonnet-4.5) 回答⑥：仕様参照の置き場所→各Issue内に「機能仕様参照」セクションを追加する方式を採用しました。理由：Issue単位で完結する情報として管理し、別ファイルへのリンク切れリスクを回避するため。
20260126 130000 Claude(Sonnet-4.5) 回答⑦：テーマ色例外申請の運用→現時点では不要と判断。理由：Horizon UIのセマンティックカラー（primary/secondary/destructive/muted/accent）で業務要件を充足可能。将来的に法令対応等で必要になった場合は、ADR-006の「3.2 カスタマイズ原則 - Level 3: 要承認」フローに従い、Tech Lead承認プロセスで対応します。
20260126 101500 Antigravity(Gemini-Exp) 指摘(Critical)：`apps/admin-horizon-ui/components/ui` ディレクトリが存在しませんが、`components/sidebar/Sidebar.tsx` 内で `../ui/badge` 等が import されています。現状ではビルドエラーになるため、Issue 013 の対応内容に `npx shadcn@latest add` 等によるコンポーネント（Button, Badge, Card, Avatar, Sheet, Form, Table, Select, Input 等）のインストール/復元手順を明記する必要があります。
20260126 101500 Antigravity(Gemini-Exp) 提案(Suggestion)：Issue 013 のディレクトリ構造計画で `components/layouts/sidebar.tsx` が定義されていますが、Boilerplate の現状は `components/sidebar/Sidebar.tsx` です。Horizon UI の更新追従や構造維持のため、既存ファイルを移動せずそのまま使用するか、Wrap する方針を推奨します。
20260126 101500 Antigravity(Gemini-Exp) 指摘(Warning)：`package.json` に `shadcn-ui` ライブラリが含まれていますが、現在の shadcn/ui は CLI Tool によるコード生成 (`components/ui` 配置) が標準です。`components/ui` が空である点と矛盾しており、ライブラリ依存かコード管理かの方針を明確にする必要があります（Boilerplate推奨はコード管理）。