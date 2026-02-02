# Ant Design (admin-antd) 実装Issue管理

**作成日**: 2026-02-01  
**対象プロジェクト**: Shipping Service Admin UI  
**UIベース**: React + Ant Design + Vite  
**実装ディレクトリ**: `apps/admin-antd`  
**Issue採番範囲**: 5xx  
**ソースフォルダ構成**: Ant Design独自の構成に従う  
**共通仕様**: [UI リファクタリング共通仕様](./ui-refactoring-common.md)  
**根拠 ADR**: [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md)

---

## 📋 Ant Design 実装概要

### Ant Design の特徴
- **エンタープライズ向け**: 豊富なコンポーネント、充実したドキュメント
- **デザインシステム**: 統一されたデザイン言語
- **Pro Components**: 高度なテーブル・フォーム機能
- **公式URL**: https://ant.design/

### Ant Design 実装方針
- **🎨 Ant Design デザインシステム準拠**:
  - Ant Design Design Values に準拠
  - カスタムテーマは最小限
  - Pro Components 活用

- **♻️ Ant Design コンポーネント活用**:
  1. **Ant Design 標準コンポーネント**（最優先）
     - Button, Card, Table, Form, Select, Input など
  2. **Pro Components**（高度な機能が必要な場合）
     - ProTable, ProForm, ProLayout
  3. **カスタムコンポーネント**（最小限）
     - Ant Design デザインガイドに準拠

**機能要件は全UIベースで共通**です。詳細は [UI リファクタリング共通仕様](./ui-refactoring-common.md) を参照してください。

---

## 🎯 Issue 一覧

**機能要件は [共通仕様](./ui-refactoring-common.md) を参照**してください。  
以下は Ant Design 固有の実装詳細のみを記載します。

| Issue ID | 画面/機能 | 優先度 | 工数見積 | ステータス |
|---|---|---|---|---|
| [Issue 501](#issue-501-ant-design-プロジェクトセットアップ) | プロジェクトセットアップ | P0 | 0.5日 | 🟢 完了 |
| [Issue 502](#issue-502-ant-design-レイアウトシステム整備) | レイアウトシステム整備 | P0 | 1日 | 🟢 完了 |
| [Issue 503](#issue-503-ant-design-ダッシュボード画面) | ダッシュボード画面 | P1 | 0.5〜1日 | 🔴 未着手 |
| [Issue 504](#issue-504-ant-design-発送一覧画面) | 発送一覧画面 | P1 | 1日 | 🔴 未着手 |
| [Issue 505](#issue-505-ant-design-発送詳細画面) | 発送詳細画面 | P1 | 0.5〜1日 | 🔴 未着手 |

**合計工数見積**: 3.5〜4.5日

---

## Issue 501: Ant Design プロジェクトセットアップ

### 概要
Ant Design + Vite ベースの Frontend プロジェクトを構築する。

### 実装内容

#### 1. プロジェクト初期化
- Vite + React + TypeScript セットアップ
- ESLint + Prettier 設定
- Ant Design インストール

#### 2. Ant Design 設定
```bash
npm install antd @ant-design/icons
npm install @ant-design/pro-components
```

#### 3. ライブラリインストール
- TanStack Query (データフェッチング)
- axios (HTTP クライアント)
- dayjs (日時処理 - Ant Design 推奨)
- React Router (ルーティング)

#### 4. プロジェクト構造
```
apps/admin-antd/
├── src/
│   ├── components/        # 共通コンポーネント
│   ├── features/          # ドメイン別機能
│   │   └── shipping/
│   ├── layouts/           # レイアウト
│   ├── lib/               # ユーティリティ
│   │   ├── api-client.ts
│   │   └── utils.ts
│   ├── routes/            # ルーティング設定
│   ├── types/             # 型定義
│   ├── App.tsx
│   └── main.tsx
└── vite.config.ts
```

### 技術スタック
- **Framework**: Vite + React 18
- **UI**: Ant Design 5.x + Pro Components
- **State**: TanStack Query
- **HTTP**: axios
- **Form**: Ant Design Form
- **Date**: dayjs
- **Router**: React Router 6

### 受け入れ条件
- [ ] プロジェクトが正常にビルド・起動する
- [ ] Ant Design コンポーネントが正常に動作する
- [ ] TanStack Query が正常に設定される
- [ ] API クライアントが正常に設定される

---

## Issue 018: Ant Design レイアウトシステム整備

### 概要
Ant Design の ProLayout を使用してレイアウトシステムを整備する。

**機能要件**: [共通仕様 - Phase 1](./ui-refactoring-common.md#phase-1-レイアウトシステム統一) を参照

### Ant Design 固有の実装詳細

#### 1. ProLayout 整備
- ProLayout によるサイドバー・ヘッダー構成
- メニュー設定（ダッシュボード、発送一覧）
- Light/Dark Mode 切り替え

#### 2. テーマ設定
```typescript
// theme.config.ts
export const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
  algorithm: theme.defaultAlgorithm,
};
```

#### 3. ナビゲーション構造
```
Sidebar
 ├─ ダッシュボード (/)
 └─ 発送一覧 (/shipments)
```

#### 4. レスポンシブ対応
- ProLayout の自動レスポンシブ機能活用
- Mobile 表示でサイドバー折りたたみ

### 使用コンポーネント
- @ant-design/pro-components: ProLayout
- antd: Menu, Button, Switch (Theme Toggle)
- @ant-design/icons: アイコン

### ファイル構造
```
apps/admin-antd/
└── src/
    ├── layouts/
    │   ├── dashboard-layout.tsx    # ProLayout ベース
    │   └── index.ts
    ├── config/
    │   └── theme.config.ts         # テーマ設定
    └── App.tsx                      # ConfigProvider 設定
```

### 受け入れ条件
- [ ] Light/Dark Mode が正常に切り替わる
- [ ] サイドバーが折りたたみ可能
- [ ] Mobile 表示で正常に動作
- [ ] すべてのページで共通レイアウトが適用される

---

## Issue 019: Ant Design ダッシュボード画面

### 概要
ダッシュボード画面を Ant Design ベースで実装する。

**機能要件**: [共通仕様 - 2-1. ダッシュボード画面](./ui-refactoring-common.md#2-1-ダッシュボード画面) を参照

### Ant Design 固有の実装詳細

#### 1. KPI カード UI
- Ant Design Card + Statistic コンポーネント
- クリッカブルデザイン（hover エフェクト）
- RETURNED カードの警告表示（danger タイプ）

#### 2. 要対応発送リスト UI
- Ant Design Table コンポーネント
- コンパクト表示（size="small"）
- 「すべて表示」リンク

#### 3. レスポンシブ対応
- Col, Row による Grid レイアウト
- Mobile: 1列、Tablet: 2列、Desktop: 4列

### 使用コンポーネント
- antd: Card, Statistic, Table, Tag (Status Badge), Button, Row, Col, Skeleton
- TanStack Query: useQuery
- React Router: useNavigate

### ファイル構造
```
apps/admin-antd/
└── src/
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
- [ ] KPI カードが Ant Design デザインで表示される
- [ ] KPI カードクリックで適切な発送一覧に遷移する
- [ ] RETURNED カードが警告表示（danger）される
- [ ] 要対応発送リストが正しく表示される（最大5件）
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

---

## Issue 020: Ant Design 発送一覧画面

### 概要
発送一覧画面を Ant Design ベースで実装する。

**機能要件**: [共通仕様 - 2-2. 発送一覧画面](./ui-refactoring-common.md#2-2-発送一覧画面) を参照

### Ant Design 固有の実装詳細

#### 1. フィルタバー UI
- Space コンポーネントによる横並び配置
- Select（ステータス、配送業者）
- Input.Search（キーワード検索）
- Button（リセット）

#### 2. 発送一覧テーブル
- ProTable または Table コンポーネント
- カラム: Order ID, Status, Carrier, Tracking, Updated
- Tag による ステータス表示
- 行クリックで Drawer 表示（発送詳細）

#### 3. ソート対応
- Table の sorter プロパティ活用

#### 4. 一括操作
- Table の rowSelection プロパティ
- Dropdown による一括操作メニュー
- CSVエクスポート機能

#### 5. ページネーション
- Table 組み込みの Pagination

### 使用コンポーネント
- antd: Table (または ProTable), Select, Input, Button, Tag, Drawer, Checkbox, Dropdown, Space, Skeleton
- TanStack Query: useQuery, useMutation
- React Router: useSearchParams

### ファイル構造
```
apps/admin-antd/
└── src/
    └── features/
        └── shipping/
            ├── api/
            │   └── shipping-api.ts              # API クライアント
            ├── components/
            │   ├── shipping-list.tsx            # メインコンポーネント
            │   ├── filter-bar.tsx               # フィルタバー
            │   ├── shipping-table.tsx           # テーブル
            │   ├── shipping-detail-drawer.tsx   # Drawer（発送詳細）
            │   └── bulk-actions.tsx             # 一括操作
            └── types/
                └── shipping.ts                  # 型定義
```

### 受け入れ条件
- [ ] 発送一覧が正しく表示される
- [ ] 初期表示時に READY でフィルタされている
- [ ] フィルタ・検索が正常に動作する
- [ ] 行クリックで Drawer が開く
- [ ] ソートが正常に動作する
- [ ] 一括操作（ステータス変更、CSVエクスポート）が動作する
- [ ] ページネーションが正常に動作する

---

## Issue 021: Ant Design 発送詳細画面

### 概要
発送詳細画面を Ant Design ベースで実装する（Drawer 形式）。

**機能要件**: [共通仕様 - 2-3. 発送詳細画面](./ui-refactoring-common.md#2-3-発送詳細画面) を参照

### Ant Design 固有の実装詳細

#### 1. 基本情報表示
- Descriptions コンポーネント
- Order ID, Status, 配送先住所

#### 2. ステータスタイムライン
- Steps コンポーネント（vertical）
- 完了: finish、現在: process、未到達: wait

#### 3. 配送情報セクション
- Descriptions コンポーネント
- 配送業者, 追跡番号（Copy 機能: Typography.Paragraph copyable）
- Button.Link（外部追跡リンク）
- 配送方法, 備考

#### 4. 操作エリア
- Form コンポーネント
- Select（ステータス選択）
- Button（更新、返送）
- ステータスに応じた操作可否制御

### 使用コンポーネント
- antd: Drawer, Descriptions, Steps, Tag, Button, Form, Select, Typography, Divider, Space, message (Toast)
- TanStack Query: useQuery, useMutation
- React Hook Form (オプション)

### ファイル構造
```
apps/admin-antd/
└── src/
    └── features/
        └── shipping/
            ├── api/
            │   └── shipping-api.ts              # API クライアント
            ├── components/
            │   ├── shipping-detail-drawer.tsx   # Drawer メイン
            │   ├── status-timeline.tsx          # タイムライン
            │   ├── shipping-info.tsx            # 配送情報
            │   └── shipping-actions.tsx         # 操作エリア
            └── types/
                └── shipping.ts                  # 型定義
```

### 受け入れ条件
- [ ] Drawer で発送詳細が表示される
- [ ] ステータスタイムラインが正しく表示される
- [ ] 配送情報が正しく表示される
- [ ] 追跡番号がコピーできる
- [ ] 外部追跡リンクが正常に動作する
- [ ] ステータス更新が正常に動作する
- [ ] 楽観ロック競合時にエラーが表示される

---

## 📝 実装ルール

### コンポーネント設計
- **Feature-based 構造**: ドメイン別にコンポーネント管理
- **Ant Design コンポーネント活用**: カスタムコンポーネントは最小限
- **Pro Components 活用**: ProTable, ProForm など高度な機能で活用

### スタイリング
- **Ant Design デザインシステム**: 標準デザインを尊重
- **カスタムテーマ**: 必要最小限のテーマカスタマイズ
- **レスポンシブ**: Grid システム（Row, Col）活用

### 状態管理
- **TanStack Query**: サーバー状態管理
- **Ant Design Form**: フォーム状態管理
- **URL State**: フィルタ・検索条件は URL パラメータで管理

---

## 🔗 関連ドキュメント

- [UI リファクタリング共通仕様](./ui-refactoring-common.md)
- [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md)
- [Ant Design 公式ドキュメント](https://ant.design/)
- [Pro Components](https://procomponents.ant.design/)
