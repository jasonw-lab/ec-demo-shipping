# UI リファクタリング 共通仕様

**作成日**: 2026-01-26  
**最終更新**: 2026-02-01  
**対象プロジェクト**: Shipping Service Admin UI  
**リファクタリングスコープ**: 複数UIベース並行評価  
**根拠 ADR**: [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)

---

## 📋 概要

このドキュメントは、複数UIベース（Horizon UI、Square UI、Next Shadcn Dashboard、Material UI、Ant Design）の並行評価における**共通機能要件**を定義します。

各UIベースの実装詳細は個別のIssueファイル（`issues-xxx.md`）で管理し、本ドキュメントは全UIベース共通の仕様として参照されます。

### 基本方針
- **機能要件は全UIベースで共通**: API仕様、ビジネスロジック、画面機能は統一
- **実装方法は各UIベース独自**: レイアウト、コンポーネント、スタイルは各UIベースのベストプラクティスに従う
- **🎨 各UIベーススタイル維持（重要）**: レイアウト・テーマシステムは各UIベースのまま維持
- **♻️ 既存コンポーネント優先利用**: 各UIベースの既存コンポーネントを最大限活用

---

## 📖 仕様参照

本ドキュメントの機能仕様は以下のドキュメントを基準とします：

### 設計書
- **[UI設計書](../design/ui-dashboard-design.md)** - 画面レイアウト、コンポーネント仕様
- **[UI-APIインターフェース定義](../design/ui-api-interface-mapping.md)** - API仕様、データ構造

### 要件定義
- **[Shipping Service要件定義](../design/shipping-service-requirements.md)** - 業務要件、ステータス定義、API仕様

---

## 🎯 共通機能要件

### Phase 1: レイアウトシステム統一

#### 概要
各UIベースの Layout System（Sidebar / Header / Theme）を基盤として整備し、すべての画面で共通使用する。

#### 対応内容

1. **各UIベース Layout System 整備**
   - `components/layouts/` に各UIベースのレイアウトを配置
   - Sidebar / Header / DashboardLayout の実装（各UIベースのスタイルそのまま）
   - next-themes による Light/Dark Mode 切り替え

2. **テーマシステム検証・確定**
   - 各UIベースのテーマシステムをそのまま採用（変更なし）
   - 既存の Tailwind CSS カスタムカラー設定を確認・検証
   - 既存の CSS Variables デザイントークンを確認・検証
   - Light/Dark Mode 切り替えが正常に動作することを検証
   - **注意**: テーマシステムの変更・カスタマイズは行わない

3. **ナビゲーション構造**
   
   **重要**: 既存のサイドバーメニュー（`apps/admin-ui`）は**一旦保留**し、効果確認のため並行稼働させます。
   
   各UIベースで以下の**新規メニュー項目を追加**します：
   ```
   Sidebar（各UIベース）
    ├─ [既存メニュー項目] ← 保留（一旦残す）
    ├─ ──────────────── （区切り線）
    ├─ 📊 ダッシュボード（新） (/dashboard-new or /)
    └─ 📦 発送一覧（新） (/shipments-new or /shipments)
   ```
   
   **並行稼働の方針**:
   - 既存メニュー: `apps/admin-ui` の画面へ遷移（従来機能）
   - 新規メニュー: 各UIベースの新画面へ遷移（リファクタリング版）
   - ユーザーは両方の画面を比較・検証可能
   - 評価完了後、既存メニュー削除のIssueを作成（Phase 4で対応）

4. **レスポンシブ対応**
   - Sidebar の折りたたみ機能
   - Mobile 表示対応（ハンバーガーメニュー）

#### 受け入れ条件
- [ ] Light/Dark Mode が正常に切り替わる
- [ ] Sidebar が折りたたみ可能
- [ ] Mobile 表示で正常に動作（ハンバーガーメニュー表示）
- [ ] すべてのページで共通レイアウトが適用される
- [ ] アクセシビリティ検証（キーボード操作可能）
- [ ] 既存メニューと新規メニューが明確に区別されている（区切り線・ラベルなど）
- [ ] 既存メニューから従来画面へ正常に遷移する
- [ ] 新規メニューから各UIベースの新画面へ正常に遷移する

---

### Phase 2: 画面実装（機能要件）

以下の3画面を各UIベースで実装します。**機能要件は全UIベースで共通**です。

---

#### 2-1. ダッシュボード画面

**機能仕様参照**:
- **[Issue 010: ダッシュボード画面改善](issue-010-dashboard.md)** - KPI定義、要対応発送リスト仕様

**機能要件（全UIベース共通）**:
- KPI カード表示（CREATED / READY / SHIPPED TODAY / RETURNED）
  - **SHIPPED TODAY定義**: JST基準で当日00:00:00〜23:59:59の間にステータスがSHIPPEDに変更された発送
- KPI カードからのフィルタ付き遷移
- 要対応発送リスト表示（最大5件）
  - **優先度**: ①RETURNED（全件）→ ②CREATED（作成後24h超過）→ ③READY（更新日時の古い順）
- データ取得:
  - `GET /api/v1/shipments/summary` (KPI)
  - `GET /api/v1/shipments/priority?limit=5` (要対応リスト)

**レスポンシブ要件**:
- KPI カード: Grid レイアウト（Mobile: 1列、Tablet: 2列、Desktop: 4列）
- 要対応リスト: Horizontal Scroll 対応（Mobile）

---

#### 2-2. 発送一覧画面

**機能仕様参照**:
- **[Issue 011: 発送一覧画面操作性改善](issue-011-shipping-list.md)** - フィルタ、ソート、一括操作の詳細仕様

**機能要件（全UIベース共通）**:
- 発送データテーブル表示（ステータス / 注文ID / 配送業者 / 更新日時）
- 行クリックで発送詳細 Sheet 表示
- フィルタバー（ステータス / 配送業者 / 日付範囲）
- ソート機能（各列クリック）
- ページネーション
- 一括操作（複数行選択 → ステータス変更）
  - **トランザクション方針**: 部分成功方式（業務継続性優先）
  - API: `PATCH /api/v1/shipments/bulk` は成功/失敗を個別に返却
  - 楽観ロック: 各行のversionを送信、競合時は409を個別返却
  - UI表示: 結果サマリをToastで表示、失敗行はテーブル上でハイライト
  - 失敗行の「再試行」機能を提供
- データ取得: `GET /api/v1/shipments?page={n}&limit=20&sort=updated_at&order=desc`

**レスポンシブ要件**:
- Table: Horizontal Scroll 対応（Mobile）
- フィルタバー: 折りたたみ可能（Mobile）

---

#### 2-3. 発送詳細画面

**機能仕様参照**:
- **[Issue 012: 発送詳細画面情報拡充](issue-012-shipping-detail.md)** - タイムライン、配送情報、監査ログ、操作エリアの詳細仕様

**機能要件（全UIベース共通）**:
- Sheet（サイドドロワー）での詳細表示
- 基本情報表示（注文ID / ステータス / 配送業者 / 住所）
- タイムライン表示（ステータス変更履歴）
  - 取得: `GET /api/v1/shipments/{id}/timeline` - 監査ログから復元
- 配送情報表示（追跡番号 / 配送予定日）
  - **配送業者追跡URL**: フロントエンド定数で管理（YAMATO, SAGAWA, JAPANPOST）
- 監査ログ表示（更新者 / 更新日時）
  - 取得: `GET /api/v1/shipments/{id}/audit-logs?limit=10&offset=0` - 最新10件ずつ読み込み
- ステータス変更フォーム（ステータス別の入力項目）
- **楽観ロック**: バージョン管理によるVERSION_CONFLICT検知
- **返送処理**: ステータスをRETURNEDに変更のみ（後続業務連携は別Issue）

**レスポンシブ要件**:
- Sheet の幅調整（Desktop: 50%, Mobile: 100%）
- フォーム項目のレイアウト最適化（Mobile: 1列）

---

## 🎨 各UIベース実装ガイドライン

### 共通カスタマイズ制約

#### 🚫 変更禁止（各UIベース内で維持必須）
- Sidebar / Header の構造・スタイル・幅・高さ
- テーマシステム（CSS Variables / デザイントークン）
- カラーシステム（各UIベースのテーマカラーパレット）
- レイアウトグリッド・Spacing システム
- Light/Dark Mode 切り替え機構

#### ✅ カスタマイズ可能
- **個別コンポーネントの色**: 各UIベースのテーマカラー内でのバリエーション
  - 例: `bg-primary`, `bg-destructive`, `bg-secondary` など各UIベース定義の色のみ使用
  - ⚠️ 独自の色（`bg-blue-600` など）は**原則使用しない**（各UIベースのテーマ色一貫性を維持）
- ビジネスロジック連携（データ表示、API 連携、状態管理）
- コンテンツエリアの配置（各UIベースのレイアウト枠内）
- テキスト・ラベル（日本語化、業務用語への置き換え）

#### 🔧 実装時の優先順位（重要）

**Step 1: 既存コンポーネント調査**
```bashconfig
# 各UIベースの既存コンポーネントを確認
ls apps/admin-{ui-base}/components/
ls apps/admin-{ui-base}/components/ui/
```

**Step 2: 実装方法の選択**
1. ✅ **既存コンポーネントがある場合** → そのまま使用（最優先）
   ```tsx
   // 例: 各UIベースの既存Cardコンポーネントをそのまま使用
   import { Card } from '@/components/ui/card';
   <Card>...</Card>
   ```

2. ✅ **既存コンポーネントがない場合** → shadcn/ui標準を追加
   ```bash
   # 各UIベースのテーマに準拠してインストール
   npx shadcn@latest add {component-name}
   ```

3. ⚠️ **新規作成が必要な場合** → 各UIベースのスタイルに準拠
   - 各UIベースの既存コンポーネントを参考にスタイルを踏襲
   - Tech Leadの承認を得る

#### ⚠️ 変更が必要な場合の手順
全体的なスタイル・レイアウトの変更が必要と判断した場合：
1. **理由を明確に文書化**（なぜ変更が必要か）
2. **影響範囲の特定**（どの画面・コンポーネントに影響するか）
3. **代替案の検討**（各UIベースの枠内で解決できないか）
4. **承認を得る**（Tech Lead / プロジェクトオーナー）

---

## 📚 参考資料

### プロジェクト資料
- [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)
- [ADR-001: UI フレームワーク選定](../adr/ADR-001-ui-framework.md)
- [ADR-003: UI アプリアーキテクチャ](../adr/ADR-003-ui-architecture.md)

### 技術リファレンス
- [shadcn/ui](https://ui.shadcn.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/)

---

**このドキュメントは、複数UIベース並行評価プロジェクトの共通仕様マスターファイルです。**  
**各UIベース固有の実装詳細は個別Issueファイルを参照してください。**
