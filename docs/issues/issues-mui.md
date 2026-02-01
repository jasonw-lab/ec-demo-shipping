# Material UI (admin-mui) 実装Issue管理

**作成日**: 2026-02-01  
**対象プロジェクト**: Shipping Service Admin UI  
**UIベース**: React + Material UI + Vite  
**実装ディレクトリ**: `apps/admin-mui`  
**Issue採番範囲**: 4xx  
**ソースフォルダ構成**: Material UI独自の構成に従う  
**共通仕様**: [UI リファクタリング共通仕様](./ui-refactoring-common.md)  
**根拠 ADR**: [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md)

---

## 📋 Material UI 実装概要

### Material UI の特徴
- **Material Design**: Google のデザインシステム準拠
- **豊富なコンポーネント**: 包括的なUIコンポーネントライブラリ
- **カスタマイズ性**: テーマシステムによる柔軟なカスタマイズ
- **公式URL**: https://mui.com/

### Material UI 実装方針
- **🎨 Material Design 準拠**:
  - Material Design 3 ガイドライン準拠
  - MUI テーマシステム活用
  - カスタムテーマは最小限

- **♻️ Material UI コンポーネント活用**:
  1. **MUI 標準コンポーネント**（最優先）
     - Button, Card, Table, TextField, Select など
  2. **MUI X コンポーネント**（高度な機能が必要な場合）
     - DataGrid, DatePicker など
  3. **カスタムコンポーネント**（最小限）
     - Material Design ガイドに準拠

**機能要件は全UIベースで共通**です。詳細は [UI リファクタリング共通仕様](./ui-refactoring-common.md) を参照してください。

---

## 🎯 Issue 一覧

**機能要件は [共通仕様](./ui-refactoring-common.md) を参照**してください。  
以下は Material UI 固有の実装詳細のみを記載します。

| Issue ID | 画面/機能 | 優先度 | 工数見積 | ステータス |
|---|---|---|---|---|
| [Issue 401](#issue-401-material-ui-プロジェクトセットアップ) | プロジェクトセットアップ | P0 | 0.5日 | 🔴 未着手 |
| [Issue 402](#issue-402-material-ui-レイアウトシステム整備) | レイアウトシステム整備 | P0 | 1日 | 🔴 未着手 |
| [Issue 403](#issue-403-material-ui-ダッシュボード画面) | ダッシュボード画面 | P1 | 0.5〜1日 | 🔴 未着手 |
| [Issue 404](#issue-404-material-ui-発送一覧画面) | 発送一覧画面 | P1 | 1日 | 🔴 未着手 |
| [Issue 405](#issue-405-material-ui-発送詳細画面) | 発送詳細画面 | P1 | 0.5〜1日 | 🔴 未着手 |

**合計工数見積**: 3.5〜4.5日

---

## Issue 401: Material UI プロジェクトセットアップ

### 概要
Material UI + Vite ベースの Frontend プロジェクトを構築する。

### 実装内容

#### 1. プロジェクト初期化
- Vite + React + TypeScript セットアップ
- ESLint + Prettier 設定
- Material UI インストール

#### 2. Material UI 設定
```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install @mui/x-data-grid @mui/x-date-pickers
```

#### 3. ライブラリインストール
- TanStack Query (データフェッチング)
- axios (HTTP クライアント)
- dayjs (日時処理)
- React Router (ルーティング)

#### 4. プロジェクト構造
```
apps/admin-mui/
├── src/
│   ├── components/        # 共通コンポーネント
│   ├── features/          # ドメイン別機能
│   │   └── shipping/
│   ├── layouts/           # レイアウト
│   ├── lib/               # ユーティリティ
│   │   ├── api-client.ts
│   │   └── utils.ts
│   ├── routes/            # ルーティング設定
│   ├── theme/             # テーマ設定
│   ├── types/             # 型定義
│   ├── App.tsx
│   └── main.tsx
└── vite.config.ts
```

### 技術スタック
- **Framework**: Vite + React 18
- **UI**: Material UI 5.x + MUI X
- **State**: TanStack Query
- **HTTP**: axios
- **Form**: React Hook Form + zod
- **Date**: dayjs
- **Router**: React Router 6

### 受け入れ条件
- [ ] プロジェクトが正常にビルド・起動する
- [ ] Material UI コンポーネントが正常に動作する
- [ ] TanStack Query が正常に設定される
- [ ] API クライアントが正常に設定される

---

## Issue 023: Material UI レイアウトシステム整備

### 概要
Material UI の Drawer + AppBar を使用してレイアウトシステムを整備する。

**機能要件**: [共通仕様 - Phase 1](./ui-refactoring-common.md#phase-1-レイアウトシステム統一) を参照

### Material UI 固有の実装詳細

#### 1. Layout 整備
- Drawer (Sidebar) + AppBar (Header) 構成
- Persistent Drawer（常時表示可能）
- Light/Dark Mode 切り替え（ThemeProvider）

#### 2. テーマ設定
```typescript
// theme.ts
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
  },
});
```

#### 3. ナビゲーション構造
```
Drawer (Sidebar)
 ├─ ダッシュボード (/)
 └─ 発送一覧 (/shipments)
```

#### 4. レスポンシブ対応
- Drawer の Temporary モード（Mobile）
- Permanent モード（Desktop）
- ハンバーガーメニュー（Mobile）

### 使用コンポーネント
- @mui/material: Drawer, AppBar, Toolbar, List, ListItem, ListItemIcon, ListItemText, IconButton, Box
- @mui/icons-material: Menu, Dashboard, LocalShipping, Brightness4, Brightness7
- React Router: useNavigate, useLocation

### ファイル構造
```
apps/admin-mui/
└── src/
    ├── layouts/
    │   ├── dashboard-layout.tsx    # メインレイアウト
    │   ├── sidebar.tsx             # Drawer (Sidebar)
    │   ├── header.tsx              # AppBar (Header)
    │   └── index.ts
    ├── theme/
    │   ├── theme.ts                # テーマ定義
    │   └── theme-provider.tsx      # テーマ切り替え Context
    └── App.tsx                      # ThemeProvider 設定
```

### 受け入れ条件
- [ ] Light/Dark Mode が正常に切り替わる
- [ ] Drawer が折りたたみ可能
- [ ] Mobile 表示で Temporary Drawer が動作する
- [ ] すべてのページで共通レイアウトが適用される

---

## Issue 024: Material UI ダッシュボード画面

### 概要
ダッシュボード画面を Material UI ベースで実装する。

**機能要件**: [共通仕様 - 2-1. ダッシュボード画面](./ui-refactoring-common.md#2-1-ダッシュボード画面) を参照

### Material UI 固有の実装詳細

#### 1. KPI カード UI
- Card + CardContent + Typography
- ButtonBase でクリッカブル化
- RETURNED カードの警告表示（error color）

#### 2. 要対応発送リスト UI
- TableContainer + Table コンポーネント
- Paper によるカード表示
- 「すべて表示」Button

#### 3. レスポンシブ対応
- Grid2 による Grid レイアウト
- Mobile: 1列、Tablet: 2列、Desktop: 4列

### 使用コンポーネント
- @mui/material: Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid2, Button, Chip, Skeleton, Box
- TanStack Query: useQuery
- React Router: useNavigate

### ファイル構造
```
apps/admin-mui/
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
- [ ] KPI カードが Material UI デザインで表示される
- [ ] KPI カードクリックで適切な発送一覧に遷移する
- [ ] RETURNED カードが警告表示（error）される
- [ ] 要対応発送リストが正しく表示される（最大5件）
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

---

## Issue 025: Material UI 発送一覧画面

### 概要
発送一覧画面を Material UI ベースで実装する。

**機能要件**: [共通仕様 - 2-2. 発送一覧画面](./ui-refactoring-common.md#2-2-発送一覧画面) を参照

### Material UI 固有の実装詳細

#### 1. フィルタバー UI
- Stack コンポーネントによる横並び配置
- Select（ステータス、配送業者）
- TextField（キーワード検索）
- Button（リセット）

#### 2. 発送一覧テーブル
- DataGrid (MUI X) または TableContainer + Table
- カラム: Order ID, Status, Carrier, Tracking, Updated
- Chip による ステータス表示
- 行クリックで Drawer 表示（発送詳細）

#### 3. ソート対応
- DataGrid のソート機能 または Table + TableSortLabel

#### 4. 一括操作
- DataGrid の checkboxSelection または Checkbox + TableRow
- Menu による一括操作メニュー
- CSVエクスポート機能

#### 5. ページネーション
- DataGrid 組み込み Pagination または TablePagination

### 使用コンポーネント
- @mui/material: Paper, Stack, Select, TextField, Button, Chip, Drawer, Checkbox, Menu, MenuItem, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, TablePagination, Skeleton
- @mui/x-data-grid: DataGrid (オプション)
- TanStack Query: useQuery, useMutation
- React Router: useSearchParams

### ファイル構造
```
apps/admin-mui/
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

## Issue 026: Material UI 発送詳細画面

### 概要
発送詳細画面を Material UI ベースで実装する（Drawer 形式）。

**機能要件**: [共通仕様 - 2-3. 発送詳細画面](./ui-refactoring-common.md#2-3-発送詳細画面) を参照

### Material UI 固有の実装詳細

#### 1. 基本情報表示
- List + ListItem + ListItemText
- Order ID, Status, 配送先住所

#### 2. ステータスタイムライン
- Stepper コンポーネント（vertical）
- 完了: completed、現在: active、未到達: disabled

#### 3. 配送情報セクション
- List + ListItem + ListItemText
- 配送業者, 追跡番号（IconButton でコピー）
- Link（外部追跡リンク）
- 配送方法, 備考

#### 4. 操作エリア
- Select（ステータス選択）
- Button（更新、返送）
- ステータスに応じた操作可否制御

### 使用コンポーネント
- @mui/material: Drawer, Box, Typography, List, ListItem, ListItemText, Stepper, Step, StepLabel, Chip, Button, Select, MenuItem, Link, IconButton, Divider, Snackbar, Alert
- @mui/icons-material: ContentCopy, OpenInNew
- TanStack Query: useQuery, useMutation
- React Hook Form + zod

### ファイル構造
```
apps/admin-mui/
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
- **MUI コンポーネント活用**: カスタムコンポーネントは最小限
- **MUI X 活用**: DataGrid など高度な機能で活用

### スタイリング
- **Material Design 準拠**: Material Design 3 ガイドライン準拠
- **MUI テーマシステム**: Theme による一貫したスタイル管理
- **sx prop**: インラインスタイルは sx prop 活用

### 状態管理
- **TanStack Query**: サーバー状態管理
- **React Hook Form**: フォーム状態管理
- **URL State**: フィルタ・検索条件は URL パラメータで管理

---

## 🔗 関連ドキュメント

- [UI リファクタリング共通仕様](./ui-refactoring-common.md)
- [ADR-001: UIフレームワーク選定](../adr/ADR-001-ui-framework.md)
- [Material UI 公式ドキュメント](https://mui.com/)
- [MUI X Data Grid](https://mui.com/x/react-data-grid/)
