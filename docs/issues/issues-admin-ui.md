# admin-ui (Next.js + shadcn/ui) 実装Issue管理

**作成日**: 2026-02-01  
**対象プロジェクト**: Shipping Service Admin UI  
**UIベース**: Next.js + shadcn/ui  
**実装ディレクトリ**: `apps/admin-ui`  
**Issue採番範囲**: 0xx（学習テスト用、成果物ではない）  
**ソースフォルダ構成**: admin-ui独自の構成に従う  
**共通仕様**: [UI リファクタリング共通仕様](./ui-refactoring-common.md)  
**根拠 ADR**: [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md), [ADR-003: UIアーキテクチャ](../adr/ADR-003-ui-architecture.md)

---

## 📋 admin-ui 実装概要

### admin-ui の特徴
- **軽量・高速**: Next.js App Router + shadcn/ui
- **カスタマイズ性**: コンポーネントコードを直接管理
- **モダンスタック**: TypeScript + TailwindCSS + Radix UI
- **Phase 1完了**: 基本実装済み（発送一覧・詳細・ダッシュボード）

### admin-ui 実装方針
- **🎨 shadcn/ui スタイルガイド準拠**:
  - TailwindCSS ユーティリティクラス活用
  - Radix UI Primitives ベース
  - カスタムコンポーネントは最小限

- **♻️ shadcn/ui コンポーネント活用**:
  1. **shadcn/ui 標準コンポーネント**（最優先）
     - `npx shadcn@latest add {component-name}` でインストール
     - `components/ui/` 配下で管理
  2. **カスタムコンポーネント作成**（必要な場合のみ）
     - `features/` 配下でドメイン別に管理
     - shadcn/ui スタイルガイドに準拠

**機能要件は全UIベースで共通**です。詳細は [UI リファクタリング共通仕様](./ui-refactoring-common.md) を参照してください。

---

## 🎯 Issue 一覧

**機能要件は [共通仕様](./ui-refactoring-common.md) を参照**してください。  
以下は admin-ui 固有の実装詳細のみを記載します。

| Issue ID | 画面/機能 | 優先度 | 工数見積 | ステータス | 完了日 |
|---|---|---|---|---|---|
| [Issue 002](#issue-002-frontend-プロジェクトセットアップ) | プロジェクトセットアップ | P0 | 0.5日 | ✅ 完了 | 2026-01-23 |
| [Issue 006](#issue-006-発送一覧画面-基本実装) | 発送一覧画面（基本） | P1 | 1日 | ✅ 完了 | 2026-01-24 |
| [Issue 007](#issue-007-発送詳細編集画面-基本実装) | 発送詳細編集画面（基本） | P1 | 0.5日 | ✅ 完了 | 2026-01-24 |
| [Issue 008](#issue-008-ダッシュボード画面-基本実装) | ダッシュボード画面（基本） | P1 | 0.5日 | ✅ 完了 | 2026-01-24 |
| [Issue 010](#issue-010-ダッシュボード画面-改善) | ダッシュボード画面（改善） | P2 | 1日 | 🔴 未着手 | - |
| [Issue 011](#issue-011-発送一覧画面-ux改善) | 発送一覧画面（UX改善） | P2 | 1.5日 | 🔴 未着手 | - |
| [Issue 012](#issue-012-発送詳細画面-情報拡充) | 発送詳細画面（情報拡充） | P2 | 1日 | 🔴 未着手 | - |

**注**: Issue番号は既存のまま維持（0xx範囲外だが、学習テスト用のため変更不要）

**合計工数**: Phase 1: 2.5日（✅ 完了）、Phase 2: 3.5日（🔴 未着手）

---

## Issue 002: Frontend プロジェクトセットアップ

### 概要
Next.js + shadcn/ui + TanStack Query ベースの Frontend プロジェクトを構築する。

### 実装内容

#### 1. プロジェクト初期化
- Next.js 14 (App Router) セットアップ
- TypeScript + ESLint + Prettier 設定
- TailwindCSS 設定

#### 2. shadcn/ui インストール
```bash
npx shadcn@latest init
```
- 基本コンポーネントインストール: Button, Card, Input, Select, Table, Badge

#### 3. ライブラリインストール
- TanStack Query (データフェッチング)
- axios (HTTP クライアント)
- date-fns (日時処理)
- zod (バリデーション)

#### 4. プロジェクト構造
```
apps/admin-ui/
├── app/                    # App Router
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/                 # shadcn/ui コンポーネント
├── features/               # ドメイン別機能
│   └── shipping/
├── lib/                    # ユーティリティ
│   ├── api-client.ts
│   └── utils.ts
└── types/                  # 型定義
```

### 技術スタック
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + TailwindCSS
- **State**: TanStack Query
- **HTTP**: axios
- **Form**: React Hook Form + zod
- **Date**: date-fns

### 受け入れ条件
- ✅ プロジェクトが正常にビルド・起動する
- ✅ shadcn/ui コンポーネントが正常に動作する
- ✅ TanStack Query が正常に設定される
- ✅ API クライアントが正常に設定される

---

## Issue 006: 発送一覧画面（基本実装）

### 概要
発送一覧画面の基本機能を実装する。

**機能要件**: [共通仕様 - 2-2. 発送一覧画面](./ui-refactoring-common.md#2-2-発送一覧画面) の基本機能を参照

### 実装内容

#### 1. API クライアント設定
- TanStack Query による発送一覧取得
- フィルタ・検索・ページネーション対応

#### 2. フィルタバー UI
- ステータスフィルタ（Select）
- 配送業者フィルタ（Select）
- キーワード検索（Input）
- リセットボタン

#### 3. 発送一覧テーブル
- TanStack Table による一覧表示
- カラム: Order ID, Status, Carrier, Tracking, Updated
- ステータスバッジ（色分け）

#### 4. ページネーション
- shadcn/ui Pagination コンポーネント

#### 5. 初期表示仕様
- **初期表示時に READY でフィルタ**

### 使用コンポーネント
- shadcn/ui: Table, Select, Input, Button, Badge, Skeleton
- TanStack Query: useQuery
- TanStack Table: useReactTable

### ファイル構造
```
apps/admin-ui/
└── features/
    └── shipping/
        ├── api/
        │   └── shipping-api.ts        # API クライアント
        ├── components/
        │   ├── shipping-list.tsx      # メインコンポーネント
        │   ├── filter-bar.tsx         # フィルタバー
        │   └── shipping-table.tsx     # テーブル
        └── types/
            └── shipping.ts            # 型定義
```

### 受け入れ条件
- ✅ 発送一覧が API から取得されて表示される
- ✅ 初期表示時に READY でフィルタされている
- ✅ ステータスで絞り込みができる
- ✅ キーワード検索ができる（order_id / tracking_number 部分一致）
- ✅ 配送業者で絞り込みができる
- ✅ ページ送りができる
- ✅ ローディング状態が表示される

---

## Issue 007: 発送詳細編集画面（基本実装）

### 概要
発送詳細編集画面の基本機能を実装する。

**機能要件**: [共通仕様 - 2-3. 発送詳細画面](./ui-refactoring-common.md#2-3-発送詳細画面) の基本機能を参照

### 実装内容

#### 1. 発送詳細表示
- Order ID, Status, 配送先住所
- 配送情報（配送業者、追跡番号、配送方法、備考）

#### 2. ステータス更新フォーム
- Select による ステータス選択
- Button によるステータス更新

#### 3. 楽観ロック対応
- version フィールドによる楽観ロック
- 競合時のエラー表示

### 使用コンポーネント
- shadcn/ui: Card, Select, Input, Button, Badge, Alert
- TanStack Query: useQuery, useMutation
- React Hook Form + zod

### ファイル構造
```
apps/admin-ui/
└── features/
    └── shipping/
        ├── api/
        │   └── shipping-api.ts        # API クライアント
        ├── components/
        │   ├── shipping-detail.tsx    # メインコンポーネント
        │   └── status-update-form.tsx # ステータス更新フォーム
        └── types/
            └── shipping.ts            # 型定義
```

### 受け入れ条件
- ✅ 発送詳細が正しく表示される
- ✅ ステータス更新ができる
- ✅ 楽観ロック競合時にエラーが表示される
- ✅ 更新成功時にトースト通知が表示される

---

## Issue 008: ダッシュボード画面（基本実装）

### 概要
ダッシュボード画面の基本機能を実装する。

**機能要件**: [共通仕様 - 2-1. ダッシュボード画面](./ui-refactoring-common.md#2-1-ダッシュボード画面) の基本機能を参照

### 実装内容

#### 1. KPI カード
- CREATED（未着手）
- SHIPPED TODAY（本日出荷）
- RETURNED（返送・トラブル）

#### 2. API 統合
- GET /api/v1/shipments/summary
- TanStack Query による自動リフレッシュ

### 使用コンポーネント
- shadcn/ui: Card, Badge, Skeleton
- TanStack Query: useQuery

### ファイル構造
```
apps/admin-ui/
└── features/
    └── shipping/
        ├── api/
        │   └── shipping-api.ts        # API クライアント
        ├── components/
        │   ├── dashboard.tsx          # メインコンポーネント
        │   └── summary-card.tsx       # KPIカード
        └── types/
            └── shipping.ts            # 型定義
```

### 受け入れ条件
- ✅ KPI カードが正しく表示される
- ✅ API からデータが取得される
- ✅ ローディング状態が表示される

---

## Issue 010: ダッシュボード画面（改善）

### 概要
ダッシュボード画面の UX を改善する。

**機能要件**: [共通仕様 - 2-1. ダッシュボード画面](./ui-refactoring-common.md#2-1-ダッシュボード画面) を参照  
**詳細仕様**: [issue-010-dashboard.md](./issue-010-dashboard.md) を参照

### 実装内容

#### 1. KPI カード改善
- クリッカブルデザイン強化（hover エフェクト）
- クリック時に発送一覧画面へフィルタ付き遷移
- RETURNED カードの警告表示（赤色強調）

#### 2. 要対応発送リスト追加
- ダッシュボード下部に要対応発送リストを表示（最大5件）
- 表示項目: Order ID, Status, Carrier, Updated
- 「すべて表示」リンクで発送一覧画面へ遷移

#### 3. 要対応発送の優先度ルール
1. ①RETURNED（全件） - 最優先対応
2. ②CREATED（作成後24h超過） - 長期滞留の未着手
3. ③READY（更新日時の古い順） - 準備完了の古いもの

### 使用コンポーネント
- shadcn/ui: Card, Table, Badge, Button
- TanStack Query: useQuery
- Next.js: useRouter (遷移制御)

### ファイル構造
```
apps/admin-ui/
└── features/
    └── shipping/
        ├── api/
        │   └── shipping-api.ts              # API クライアント
        ├── components/
        │   ├── dashboard.tsx                # メインコンポーネント（更新）
        │   ├── summary-card.tsx             # KPIカード（更新）
        │   └── action-required-list.tsx     # 要対応リスト（新規）
        └── types/
            └── shipping.ts                  # 型定義
```

### 受け入れ条件
- [ ] KPI カードクリックで適切な発送一覧に遷移する
- [ ] RETURNED カードが警告表示される
- [ ] 要対応発送リストが正しく表示される（最大5件）
- [ ] 要対応発送が存在しない場合、リストは非表示
- [ ] 「すべて表示」リンクが正常に動作する

---

## Issue 011: 発送一覧画面（UX改善）

### 概要
発送一覧画面の UX を改善する。

**機能要件**: [共通仕様 - 2-2. 発送一覧画面](./ui-refactoring-common.md#2-2-発送一覧画面) を参照  
**詳細仕様**: [issue-011-shipping-list.md](./issue-011-shipping-list.md) を参照

### 実装内容

#### 1. 一覧操作性改善
- 行クリックで発送詳細サイドパネルを表示
- 編集アイコンは補助操作として残す

#### 2. 検索・フィルタ改善
- ステータス / 配送業者フィルタにラベル追加
- フィルタ適用中の条件をチップ表示
- リセット操作を明確化

#### 3. ソート対応
- 注文ID
- ステータス
- 更新日時

#### 4. 一括操作
- チェックボックスによる複数選択
- ステータス一括変更
- CSVエクスポート

#### 5. 一括操作トランザクション方針
- **戦略**: 部分成功方式（業務継続性優先）
- **API**: `PATCH /api/v1/shipments/bulk`
- **楽観ロック**: 各行のversionを送信、競合時は409を個別返却
- **UI表示**: 結果サマリをToastで表示、失敗行はテーブル上でハイライト

### 使用コンポーネント
- shadcn/ui: Sheet (サイドパネル), Checkbox, Badge, Button, DropdownMenu
- TanStack Query: useQuery, useMutation
- TanStack Table: useReactTable (ソート機能)

### ファイル構造
```
apps/admin-ui/
└── features/
    └── shipping/
        ├── api/
        │   └── shipping-api.ts              # API クライアント（更新）
        ├── components/
        │   ├── shipping-list.tsx            # メインコンポーネント（更新）
        │   ├── filter-bar.tsx               # フィルタバー（更新）
        │   ├── shipping-table.tsx           # テーブル（更新）
        │   ├── shipping-detail-panel.tsx    # サイドパネル（新規）
        │   └── bulk-actions.tsx             # 一括操作（新規）
        └── types/
            └── shipping.ts                  # 型定義
```

### 受け入れ条件
- [ ] 行クリックで発送詳細サイドパネルが開く
- [ ] フィルタ適用中の条件がチップで表示される
- [ ] ソート（注文ID, ステータス, 更新日時）が動作する
- [ ] チェックボックスで複数選択できる
- [ ] ステータス一括変更ができる（部分成功対応）
- [ ] CSVエクスポートができる

---

## Issue 012: 発送詳細画面（情報拡充）

### 概要
発送詳細画面の情報を拡充し、業務対応を強化する。

**機能要件**: [共通仕様 - 2-3. 発送詳細画面](./ui-refactoring-common.md#2-3-発送詳細画面) を参照  
**詳細仕様**: [issue-012-shipping-detail.md](./issue-012-shipping-detail.md) を参照

### 実装内容

#### 1. 基本情報表示
- Order ID, Status, 配送先住所

#### 2. ステータスタイムライン表示
- 対象ステータス: CREATED, PREPARED, SHIPPED, DELIVERED, RETURNED
- UI: 完了（緑）、現在（青）、未到達（グレー）

#### 3. 配送情報セクション
- 配送業者, 追跡番号（コピー機能）
- 外部追跡リンク
- 配送方法, 備考（オペレーター用メモ）

#### 4. 操作エリア
- ステータス更新（ステータスに応じて操作可否を制御）
- 返送処理
- 再出荷（将来拡張）

### 使用コンポーネント
- shadcn/ui: Card, Badge, Button, Separator, Tooltip
- TanStack Query: useQuery, useMutation
- React Hook Form + zod

### ファイル構造
```
apps/admin-ui/
└── features/
    └── shipping/
        ├── api/
        │   └── shipping-api.ts              # API クライアント
        ├── components/
        │   ├── shipping-detail.tsx          # メインコンポーネント（更新）
        │   ├── status-timeline.tsx          # タイムライン（新規）
        │   ├── shipping-info.tsx            # 配送情報（新規）
        │   └── shipping-actions.tsx         # 操作エリア（新規）
        └── types/
            └── shipping.ts                  # 型定義
```

### 受け入れ条件
- [ ] ステータスタイムラインが正しく表示される
- [ ] 配送情報が正しく表示される
- [ ] 追跡番号がコピーできる
- [ ] 外部追跡リンクが正常に動作する
- [ ] ステータスに応じて操作可否が制御される
- [ ] 返送処理が正常に動作する

---

## 📝 実装ルール

### コンポーネント設計
- **Server Components 優先**: データフェッチングは Server Components で
- **Client Components**: インタラクションが必要な場合のみ
- **Feature-based 構造**: ドメイン別にコンポーネント管理

### スタイリング
- **TailwindCSS**: ユーティリティクラス活用
- **shadcn/ui**: コンポーネントのカスタマイズは最小限
- **レスポンシブ**: Mobile First アプローチ

### 状態管理
- **TanStack Query**: サーバー状態管理
- **React Hook Form**: フォーム状態管理
- **URL State**: フィルタ・検索条件は URL パラメータで管理

---

## 🔗 関連ドキュメント

- [UI リファクタリング共通仕様](./ui-refactoring-common.md)
- [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md)
- [ADR-003: UIアーキテクチャ](../adr/ADR-003-ui-architecture.md)
