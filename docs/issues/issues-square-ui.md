# Square UI (admin-square-ui) 実装Issue管理

**作成日**: 2026-02-01  
**対象プロジェクト**: Shipping Service Admin UI  
**UIベース**: Next.js + Square UI  
**実装ディレクトリ**: `apps/admin-square-ui`  
**Issue採番範囲**: 3xx  
**ソースフォルダ構成**: Square UI独自の構成に従う  
**共通仕様**: [UI リファクタリング共通仕様](./ui-refactoring-common.md)  
**根拠 ADR**: [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md)

---

## 📋 Square UI 実装概要

### Square UI の特徴
- **モダンデザイン**: クリーンで直感的なUI
- **shadcn/ui ベース**: カスタマイズ可能なコンポーネント
- **Next.js 統合**: App Router 対応
- **参考**: Square UI は独自のデザインシステムを持つUIキット

### Square UI 実装方針
- **🎨 Square UI デザインシステム準拠**:
  - Square UI のデザインガイドライン準拠
  - カスタムテーマは最小限
  - shadcn/ui ベースのコンポーネント活用

- **♻️ Square UI コンポーネント活用**:
  1. **Square UI 既存コンポーネント**（最優先）
     - `components/ui/` 配下のコンポーネント
     - Square UI 提供のレイアウト・機能コンポーネント
  2. **shadcn/ui 標準コンポーネント追加**（必要な場合）
     - Square UI のテーマに準拠してインストール
  3. **カスタムコンポーネント**（最小限）
     - Square UI スタイルガイドに準拠

**機能要件は全UIベースで共通**です。詳細は [UI リファクタリング共通仕様](./ui-refactoring-common.md) を参照してください。

---

## 🎯 Issue 一覧

**機能要件は [共通仕様](./ui-refactoring-common.md) を参照**してください。  
以下は Square UI 固有の実装詳細のみを記載します。

| Issue ID | 画面/機能 | 優先度 | 工数見積 | ステータス |
|---|---|---|---|---|
| [Issue 301](#issue-301-square-ui-プロジェクトセットアップ) | プロジェクトセットアップ | P0 | 0.5日 | 🔴 未着手 |
| [Issue 302](#issue-302-square-ui-レイアウトシステム整備) | レイアウトシステム整備 | P0 | 1日 | 🔴 未着手 |
| [Issue 303](#issue-303-square-ui-ダッシュボード画面) | ダッシュボード画面 | P1 | 0.5〜1日 | 🔴 未着手 |
| [Issue 304](#issue-304-square-ui-発送一覧画面) | 発送一覧画面 | P1 | 1日 | 🔴 未着手 |
| [Issue 305](#issue-305-square-ui-発送詳細画面) | 発送詳細画面 | P1 | 0.5〜1日 | 🔴 未着手 |

**合計工数見積**: 3.5〜4.5日

---

## Issue 301: Square UI プロジェクトセットアップ

### 概要
Square UI + Next.js ベースの Frontend プロジェクトを構築する。

### 実装内容

#### 1. プロジェクト初期化
- Next.js 14 (App Router) セットアップ
- TypeScript + ESLint + Prettier 設定
- TailwindCSS 設定
- Square UI コンポーネント設定

#### 2. Square UI 設定
```bash
# Square UI の初期設定（実際の設定方法はプロジェクトに依存）
# shadcn/ui ベースの場合
npx shadcn@latest init
```

#### 3. ライブラリインストール
- TanStack Query (データフェッチング)
- axios (HTTP クライアント)
- date-fns (日時処理)
- zod (バリデーション)

#### 4. プロジェクト構造
```
apps/admin-square-ui/
├── app/                    # App Router
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                 # Square UI コンポーネント
├── features/               # ドメイン別機能
│   └── shipping/
├── lib/                    # ユーティリティ
│   ├── api-client.ts
│   └── utils.ts
└── types/                  # 型定義
```

### 技術スタック
- **Framework**: Next.js 14 (App Router)
- **UI**: Square UI + TailwindCSS
- **State**: TanStack Query
- **HTTP**: axios
- **Form**: React Hook Form + zod
- **Date**: date-fns

### 受け入れ条件
- [ ] プロジェクトが正常にビルド・起動する
- [ ] Square UI コンポーネントが正常に動作する
- [ ] TanStack Query が正常に設定される
- [ ] API クライアントが正常に設定される

---

## Issue 028: Square UI レイアウトシステム整備

### 概要
Square UI の Layout System（Sidebar / Header / Theme）を基盤として整備する。

**機能要件**: [共通仕様 - Phase 1](./ui-refactoring-common.md#phase-1-レイアウトシステム統一) を参照

### Square UI 固有の実装詳細

#### 1. Layout System 整備
- `components/layouts/` に Square UI ベースのレイアウトを配置
- Sidebar / Header / DashboardLayout の実装
- next-themes による Light/Dark Mode 切り替え

#### 2. テーマシステム検証・確定
- Square UI のテーマシステムをそのまま採用（変更なし）
- 既存の Tailwind CSS カスタムカラー設定を確認・検証
- 既存の CSS Variables デザイントークンを確認・検証
- Light/Dark Mode 切り替えが正常に動作することを検証

#### 3. ナビゲーション構造
```
Sidebar
 ├─ ダッシュボード (/)
 └─ 発送一覧 (/shipments)
```

#### 4. レスポンシブ対応
- Sidebar の折りたたみ機能
- Mobile 表示対応（ハンバーガーメニュー）

### 使用コンポーネント
- Square UI: Layout System (Sidebar, Header, DashboardLayout)
- shadcn/ui: Button, Sheet (Mobile Menu)
- lucide-react: アイコン

### ファイル構造
```
apps/admin-square-ui/
├── components/
│   └── layouts/
│       ├── sidebar.tsx           # Square UI ベースのサイドバー
│       ├── header.tsx            # Square UI ベースのヘッダー
│       ├── dashboard-layout.tsx  # メインレイアウト
│       └── index.ts
└── app/
    └── globals.css               # CSS Variables & Theme
```

### 受け入れ条件
- [ ] Light/Dark Mode が正常に切り替わる
- [ ] Sidebar が折りたたみ可能
- [ ] Mobile 表示で正常に動作（ハンバーガーメニュー表示）
- [ ] すべてのページで共通レイアウトが適用される
- [ ] アクセシビリティ検証（キーボード操作可能）

---

## Issue 029: Square UI ダッシュボード画面

### 概要
ダッシュボード画面を Square UI ベースで実装する。

**機能要件**: [共通仕様 - 2-1. ダッシュボード画面](./ui-refactoring-common.md#2-1-ダッシュボード画面) を参照

### Square UI 固有の実装詳細

#### 1. KPI カード UI
- Square UI の Card コンポーネント
- クリッカブルデザイン（hover エフェクト）
- RETURNED カードの警告表示（赤色強調）

#### 2. 要対応発送リスト UI
- Square UI の Table コンポーネント
- コンパクト表示（Dashboard 下部に配置）
- 「すべて表示」リンク

#### 3. レスポンシブ対応
- KPI カード: Grid レイアウト（Mobile: 1列、Tablet: 2列、Desktop: 4列）
- 要対応リスト: Horizontal Scroll 対応（Mobile）

### 使用コンポーネント
- Square UI: Card, Table, Badge
- shadcn/ui: Button
- lucide-react: アイコン
- TanStack Query: useQuery

### ファイル構造
```
apps/admin-square-ui/
└── features/
    └── shipping/
        ├── api/
        │   └── shipping-api.ts        # API クライアント
        ├── components/
        │   ├── dashboard.tsx          # メインコンポーネント
        │   ├── summary-card.tsx       # KPIカード
        │   └── action-required-list.tsx # 要対応リスト
        └── types/
            └── shipping.ts            # 型定義
```

### 受け入れ条件
- [ ] KPI カードが Square UI デザインで表示される
- [ ] KPI カードクリックで適切な発送一覧に遷移する
- [ ] RETURNED カードが警告表示（赤色強調）される
- [ ] 要対応発送リストが正しく表示される（最大5件）
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

---

## Issue 030: Square UI 発送一覧画面

### 概要
発送一覧画面を Square UI ベースで実装する。

**機能要件**: [共通仕様 - 2-2. 発送一覧画面](./ui-refactoring-common.md#2-2-発送一覧画面) を参照

### Square UI 固有の実装詳細

#### 1. フィルタバー UI
- Square UI のコンポーネントによる横並び配置
- Select（ステータス、配送業者）
- Input（キーワード検索）
- Button（リセット）

#### 2. 発送一覧テーブル
- Square UI の Table コンポーネント
- カラム: Order ID, Status, Carrier, Tracking, Updated
- Badge による ステータス表示
- 行クリックで Sheet 表示（発送詳細）

#### 3. ソート対応
- Table のソート機能活用

#### 4. 一括操作
- Checkbox による複数選択
- DropdownMenu による一括操作メニュー
- CSVエクスポート機能

#### 5. ページネーション
- Square UI の Pagination コンポーネント

### 使用コンポーネント
- Square UI: Table, Select, Input, Button, Badge, Sheet, Checkbox, DropdownMenu, Pagination
- TanStack Query: useQuery, useMutation
- Next.js: useSearchParams

### ファイル構造
```
apps/admin-square-ui/
└── features/
    └── shipping/
        ├── api/
        │   └── shipping-api.ts              # API クライアント
        ├── components/
        │   ├── shipping-list.tsx            # メインコンポーネント
        │   ├── filter-bar.tsx               # フィルタバー
        │   ├── shipping-table.tsx           # テーブル
        │   ├── shipping-detail-sheet.tsx    # Sheet（発送詳細）
        │   └── bulk-actions.tsx             # 一括操作
        └── types/
            └── shipping.ts                  # 型定義
```

### 受け入れ条件
- [ ] 発送一覧が正しく表示される
- [ ] 初期表示時に READY でフィルタされている
- [ ] フィルタ・検索が正常に動作する
- [ ] 行クリックで Sheet が開く
- [ ] ソートが正常に動作する
- [ ] 一括操作（ステータス変更、CSVエクスポート）が動作する
- [ ] ページネーションが正常に動作する

---

## Issue 031: Square UI 発送詳細画面

### 概要
発送詳細画面を Square UI ベースで実装する（Sheet 形式）。

**機能要件**: [共通仕様 - 2-3. 発送詳細画面](./ui-refactoring-common.md#2-3-発送詳細画面) を参照

### Square UI 固有の実装詳細

#### 1. 基本情報表示
- Order ID, Status, 配送先住所
- Square UI の Card コンポーネント

#### 2. ステータスタイムライン
- カスタムタイムラインコンポーネント
- 完了: 緑、現在: 青、未到達: グレー

#### 3. 配送情報セクション
- 配送業者, 追跡番号（Copy 機能: Button + clipboard API）
- Link（外部追跡リンク）
- 配送方法, 備考

#### 4. 操作エリア
- Select（ステータス選択）
- Button（更新、返送）
- ステータスに応じた操作可否制御

### 使用コンポーネント
- Square UI: Sheet, Card, Badge, Button, Select, Separator
- shadcn/ui: Toast (通知)
- lucide-react: アイコン
- TanStack Query: useQuery, useMutation
- React Hook Form + zod

### ファイル構造
```
apps/admin-square-ui/
└── features/
    └── shipping/
        ├── api/
        │   └── shipping-api.ts              # API クライアント
        ├── components/
        │   ├── shipping-detail-sheet.tsx    # Sheet メイン
        │   ├── status-timeline.tsx          # タイムライン
        │   ├── shipping-info.tsx            # 配送情報
        │   └── shipping-actions.tsx         # 操作エリア
        └── types/
            └── shipping.ts                  # 型定義
```

### 受け入れ条件
- [ ] Sheet で発送詳細が表示される
- [ ] ステータスタイムラインが正しく表示される
- [ ] 配送情報が正しく表示される
- [ ] 追跡番号がコピーできる
- [ ] 外部追跡リンクが正常に動作する
- [ ] ステータス更新が正常に動作する
- [ ] 楽観ロック競合時にエラーが表示される

---

## 📝 実装ルール

### コンポーネント設計
- **Server Components 優先**: データフェッチングは Server Components で
- **Client Components**: インタラクションが必要な場合のみ
- **Feature-based 構造**: ドメイン別にコンポーネント管理

### スタイリング
- **TailwindCSS**: ユーティリティクラス活用
- **Square UI スタイルガイド**: コンポーネントのカスタマイズは最小限
- **レスポンシブ**: Mobile First アプローチ

### 状態管理
- **TanStack Query**: サーバー状態管理
- **React Hook Form**: フォーム状態管理
- **URL State**: フィルタ・検索条件は URL パラメータで管理

---

## 🔗 関連ドキュメント

- [UI リファクタリング共通仕様](./ui-refactoring-common.md)
- [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md)
