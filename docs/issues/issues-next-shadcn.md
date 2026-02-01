# Next Shadcn Dashboard (admin-next-shadcn) 実装Issue管理

**作成日**: 2026-02-01  
**対象プロジェクト**: Shipping Service Admin UI  
**UIベース**: Next.js + shadcn/ui + Next Shadcn Dashboard Starter  
**実装ディレクトリ**: `apps/admin-next-shadcn`  
**Issue採番範囲**: 1xx  
**ソースフォルダ構成**: Next Shadcn Dashboard独自の構成に従う  
**共通仕様**: [UI リファクタリング共通仕様](./ui-refactoring-common.md)  
**根拠 ADR**: [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)

---

## 📋 Next Shadcn Dashboard 実装概要

### Next Shadcn Dashboard の特徴
- **シンプル構成**: 最小限の設定で高速スタート
- **軽量**: 必要最小限の依存関係
- **カスタマイズ性**: shadcn/ui ベースで柔軟に拡張可能
- **公式URL**: https://github.com/Kiranism/next-shadcn-dashboard-starter

### Next Shadcn Dashboard 実装方針
- **🎨 Next Shadcn Dashboard スタイル維持**:
  - レイアウト・テーマシステムは変更しない
  - Next Shadcn Dashboard のソースコードをベースに開発
  - 全体的な画面スタイル・レイアウトシステムは維持
  - テーマ色の一貫性保証: Next Shadcn Dashboard 定義のカラーパレットのみ使用

- **♻️ Next Shadcn Dashboard 既存コンポーネント優先利用**:
  1. **Next Shadcn Dashboard の既存コンポーネント・パーツを最大限利用**（最優先）
     - `components/` 配下の既存コンポーネント
     - `components/ui/` 配下のUIコンポーネント
  2. **shadcn/ui標準コンポーネントを追加**（必要な場合）
     - Next Shadcn Dashboard のテーマに準拠してインストール
  3. **新規作成は最小限**（上記のいずれも適用できない場合のみ）
     - Next Shadcn Dashboard のスタイルガイドに厳密に準拠

**機能要件は全UIベースで共通**です。詳細は [UI リファクタリング共通仕様](./ui-refactoring-common.md) を参照してください。

---

## 🎯 Issue 一覧

**機能要件は [共通仕様](./ui-refactoring-common.md) を参照**してください。  
以下は Next Shadcn Dashboard 固有の実装詳細のみを記載します。

| Issue ID | 画面/機能 | 優先度 | 工数見積 | ステータス |
|---|---|---|---|---|
| [Issue 101](#issue-101-next-shadcn-dashboard-プロジェクトセットアップ) | プロジェクトセットアップ | P0 | 0.5日 | 🔴 未着手 |
| [Issue 102](#issue-102-next-shadcn-dashboard-レイアウトシステム整備) | レイアウトシステム整備 | P0 | 1日 | 🔴 未着手 |
| [Issue 103](#issue-103-next-shadcn-dashboard-ダッシュボード画面) | ダッシュボード画面 | P1 | 0.5〜1日 | 🔴 未着手 |
| [Issue 104](#issue-104-next-shadcn-dashboard-発送一覧画面) | 発送一覧画面 | P1 | 1日 | 🔴 未着手 |
| [Issue 105](#issue-105-next-shadcn-dashboard-発送詳細画面) | 発送詳細画面 | P1 | 0.5〜1日 | 🔴 未着手 |

**合計工数見積**: 3.5〜4.5日

---

## Issue 101: Next Shadcn Dashboard プロジェクトセットアップ

### 概要
Next Shadcn Dashboard Starter をベースに、Shipping Service 向けのプロジェクトを構築する。

### 実装内容

#### 1. プロジェクト初期化
```bash
# Next Shadcn Dashboard Starter のクローンまたはテンプレート利用
npx create-next-app@latest apps/admin-next-shadcn --example https://github.com/Kiranism/next-shadcn-dashboard-starter
```

#### 2. 依存関係の追加
- TanStack Query (データフェッチング)
- axios (HTTP クライアント)
- date-fns (日時処理)
- zod (バリデーション)

#### 3. プロジェクト構造確認
Next Shadcn Dashboard のディレクトリ構造をベースに、Shipping Service 向けにカスタマイズ。

### 技術スタック
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Next Shadcn Dashboard Starter
- **State**: TanStack Query
- **HTTP**: axios
- **Form**: React Hook Form + zod
- **Date**: date-fns

### 受け入れ条件
- [ ] プロジェクトが正常にビルド・起動する
- [ ] Next Shadcn Dashboard のコンポーネントが正常に動作する
- [ ] TanStack Query が正常に設定される
- [ ] API クライアントが正常に設定される

---

## Issue 102: Next Shadcn Dashboard レイアウトシステム整備

### 概要
Next Shadcn Dashboard の Layout System（Sidebar / Header / Theme）を基盤として整備する。

**機能要件**: [共通仕様 - Phase 1](./ui-refactoring-common.md#phase-1-レイアウトシステム統一) を参照

### Next Shadcn Dashboard 固有の実装詳細

#### 1. Layout System 整備
- Next Shadcn Dashboard のレイアウトをそのまま使用
- Sidebar / Header の実装は既存をベースに
- next-themes による Light/Dark Mode 切り替え

#### 2. テーマシステム検証・確定
- Next Shadcn Dashboard のテーマシステムをそのまま採用（変更なし）
- 既存の Tailwind CSS カスタムカラー設定を確認・検証
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
- Next Shadcn Dashboard: Layout System
- shadcn/ui: Button, Sheet (Mobile Menu)
- lucide-react: アイコン

### 受け入れ条件
- [ ] Light/Dark Mode が正常に切り替わる
- [ ] Sidebar が折りたたみ可能
- [ ] Mobile 表示で正常に動作
- [ ] すべてのページで共通レイアウトが適用される

---

## Issue 103: Next Shadcn Dashboard ダッシュボード画面

### 概要
ダッシュボード画面を Next Shadcn Dashboard ベースで実装する。

**機能要件**: [共通仕様 - 2-1. ダッシュボード画面](./ui-refactoring-common.md#2-1-ダッシュボード画面) を参照

### Next Shadcn Dashboard 固有の実装詳細

#### 1. KPI カード UI
- Next Shadcn Dashboard の Card コンポーネント
- クリッカブルデザイン（hover エフェクト）
- RETURNED カードの警告表示（赤色強調）

#### 2. 要対応発送リスト UI
- Next Shadcn Dashboard の Table コンポーネント
- コンパクト表示
- 「すべて表示」リンク

#### 3. レスポンシブ対応
- KPI カード: Grid レイアウト（Mobile: 1列、Tablet: 2列、Desktop: 4列）
- 要対応リスト: Horizontal Scroll 対応（Mobile）

### 使用コンポーネント
- Next Shadcn Dashboard: Card, Table, Badge
- shadcn/ui: Button
- TanStack Query: useQuery

### 受け入れ条件
- [ ] KPI カードが Next Shadcn Dashboard デザインで表示される
- [ ] KPI カードクリックで適切な発送一覧に遷移する
- [ ] RETURNED カードが警告表示される
- [ ] 要対応発送リストが正しく表示される（最大5件）
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

---

## Issue 104: Next Shadcn Dashboard 発送一覧画面

### 概要
発送一覧画面を Next Shadcn Dashboard ベースで実装する。

**機能要件**: [共通仕様 - 2-2. 発送一覧画面](./ui-refactoring-common.md#2-2-発送一覧画面) を参照

### Next Shadcn Dashboard 固有の実装詳細

#### 1. フィルタバー UI
- Next Shadcn Dashboard のコンポーネントによる横並び配置
- Select（ステータス、配送業者）
- Input（キーワード検索）
- Button（リセット）

#### 2. 発送一覧テーブル
- Next Shadcn Dashboard の Table コンポーネント
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
- Next Shadcn Dashboard の Pagination コンポーネント

### 使用コンポーネント
- Next Shadcn Dashboard: Table, Card
- shadcn/ui: Select, Input, Button, Badge, Sheet, Checkbox, DropdownMenu, Pagination
- TanStack Query: useQuery, useMutation

### 受け入れ条件
- [ ] 発送一覧が正しく表示される
- [ ] 初期表示時に READY でフィルタされている
- [ ] フィルタ・検索が正常に動作する
- [ ] 行クリックで Sheet が開く
- [ ] ソートが正常に動作する
- [ ] 一括操作が動作する
- [ ] ページネーションが正常に動作する

---

## Issue 105: Next Shadcn Dashboard 発送詳細画面

### 概要
発送詳細画面を Next Shadcn Dashboard ベースで実装する（Sheet 形式）。

**機能要件**: [共通仕様 - 2-3. 発送詳細画面](./ui-refactoring-common.md#2-3-発送詳細画面) を参照

### Next Shadcn Dashboard 固有の実装詳細

#### 1. 基本情報表示
- Order ID, Status, 配送先住所
- Next Shadcn Dashboard の Card コンポーネント

#### 2. ステータスタイムライン
- カスタムタイムラインコンポーネント
- 完了: 緑、現在: 青、未到達: グレー

#### 3. 配送情報セクション
- 配送業者, 追跡番号（Copy 機能）
- Link（外部追跡リンク）
- 配送方法, 備考

#### 4. 操作エリア
- Select（ステータス選択）
- Button（更新、返送）
- ステータスに応じた操作可否制御

### 使用コンポーネント
- Next Shadcn Dashboard: Sheet, Card
- shadcn/ui: Badge, Button, Select, Separator
- TanStack Query: useQuery, useMutation
- React Hook Form + zod

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
- **Next Shadcn Dashboard スタイルガイド**: コンポーネントのカスタマイズは最小限
- **レスポンシブ**: Mobile First アプローチ

### 状態管理
- **TanStack Query**: サーバー状態管理
- **React Hook Form**: フォーム状態管理
- **URL State**: フィルタ・検索条件は URL パラメータで管理

---

## 🔗 関連ドキュメント

- [UI リファクタリング共通仕様](./ui-refactoring-common.md)
- [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)
- [Next Shadcn Dashboard Starter](https://github.com/Kiranism/next-shadcn-dashboard-starter)
