# ADR-006: UI Template Strategy - 5種類並行評価アプローチ

**Status:** Proposed  
**Version:** 3.0.0  
**Last Updated:** 2026-02-01  
**Date:** 2026-01-26  
**Decision Makers:** Frontend Tech Lead  
**Context:** Shipping Service Admin UI リファクタリング - 5種類UIテンプレート並行評価

---

## 1. 背景 / Context

現在の Shipping Service 管理画面（`apps/admin-ui`）は、ADR-001 で決定した **ハイブリッド構成**（arhamkhnz/next-shadcn-admin-dashboard + shadcn/ui Official Blocks）で実装されている。

MVP として基本機能は実装完了しているが、以下の課題が顕在化している：

### 1.1 現状の課題

#### UI/UX の一貫性不足
- Layout（arhamkhnz）と Components（shadcn Blocks）の統合が不完全
- デザイントークン（色、間隔、タイポグラフィ）の一部に不整合が存在
- ダークモード対応が部分的で、一部コンポーネントで表示崩れが発生

#### コンポーネントの保守性
- 2つの異なるソースからのコンポーネント統合による複雑性
- カスタマイズ時の影響範囲が不明確（どちらのベースを修正すべきか判断が困難）
- アップデート追従性の低下（2つのリポジトリの変更を個別に追跡）

#### 開発効率の低下
- 新規画面追加時の UI パターン選択に時間がかかる
- コンポーネントの再利用性が低く、類似コードが散在
- AI Agent による実装指示の精度低下（複数のソースが混在）

---

## 2. 検討した選択肢 / Options

### Option A: 現状維持（ハイブリッド構成の継続改善）

既存の arhamkhnz + shadcn Blocks 構成を維持し、統合の改善に注力する。

**メリット**
- 既存資産を活かせる
- リファクタリングコストが最小

**デメリット**
- 根本的な統合問題は解決しない
- 2つのソースの保守負担が継続
- 長期的な技術的負債が蓄積

---

### Option B: 5種類UIテンプレート並行評価アプローチ **[採用]**

**5つの異なるUIベーステンプレート**を並行で評価し、効果確認後に最適なものを選定する。

#### 評価対象UIベース（5種類）

| UIベース | ディレクトリ | 技術スタック | 特徴 |
|---|---|---|---|
| **Horizon UI** | `apps/admin-horizon-ui` | shadcn/ui + Next.js | 商用品質、30+コンポーネント、充実ドキュメント |
| **Square UI** | `apps/admin-square-ui` | shadcn/ui + Next.js | モダンデザイン、Dashboard特化 |
| **Next Shadcn Dashboard** | `apps/admin-next-shadcn` | shadcn/ui + Next.js | シンプル構成、軽量 |
| **Mantis (MUI版)** | `apps/admin-mui` | Material-UI + React | デザイン性、高密度表示、業務UI実績 |
| **Ant Design Pro** | `apps/admin-antd` | Ant Design + React | 高度コンポーネント（ProTable）、爆速実装 |

#### 並行評価の方針

**重要原則**: 各UIベースの全体スタイル（テンプレート）に合わせる
- ✅ **レイアウト・テーマシステムは各UIベースのまま維持**
- ✅ **全体的な画面スタイル（テーマ色）の一貫性を各UIベース内で保証**
- ✅ **コンポーネント追加時は各UIベースのスタイルに準拠**
- ❌ **独自のレイアウト・テーマ変更は行わない**

**メリット**
- **リスク分散**: 1つのテンプレートに依存しない
- **実践的評価**: 実際の実装を通じて使い勝手を検証
- **最適選択**: 効果確認後に最も適したテンプレートを選定
- **柔軟性**: プロジェクト要件の変化に対応可能
- **技術スタック比較**: shadcn/ui系 vs MUI vs AntD の実践的比較

**デメリット**
- 並行開発のため初期コストが増加（ただし MVP 段階のため限定的）
- 5つのテンプレートの学習コストが一時的に発生
- 評価期間中の保守対象が複数存在

---

### Option C: 完全自前実装（shadcn/ui のみを使用）

shadcn/ui コンポーネントのみを使用し、Layout やテーマ管理を一から実装する。

**メリット**
- 完全なカスタマイズ自由度
- 外部依存の最小化

**デメリット**
- 開発コストが極めて高い（MVP フェーズとして非現実的）
- デザインシステムの設計に専門知識が必要
- 保守負担が増大

---

## 3. 決定 / Decision

**5種類UIテンプレート並行評価アプローチを採用**し、3つのshadcn/ui系 + 2つの業務UI特化系を並行で開発・評価する。

### 3.1 並行評価の実施方針

#### 共通アーキテクチャレイヤー

| レイヤー | 技術 | 説明 |
|---|---|---|
| **ベーステンプレート** | 各UIベース固有 | Layout / Theme / Base Components（各UIベースのまま維持） |
| **UI コンポーネント** | 各UIベース固有 | shadcn/ui / MUI / AntD（各UIベースのライブラリ） |
| **状態管理** | 共通戦略 | TanStack Query（サーバー状態） + Zustand（グローバルUI状態） |
| **ビジネスロジック** | 共通 features/ 構造 | Feature-based Architecture (ADR-003) - 全UIベースで共有可能 |

#### 各UIベースの実装ディレクトリ

```
apps/
├── admin-horizon-ui/     # Horizon UI ベース (shadcn/ui)
├── admin-square-ui/      # Square UI ベース (shadcn/ui)
├── admin-next-shadcn/    # Next Shadcn Dashboard ベース (shadcn/ui)
├── admin-mui/            # Mantis ベース (Material-UI) ← 新規追加
└── admin-antd/           # Ant Design Pro ベース (Ant Design) ← 新規追加
```

### 3.2 状態管理戦略（全UIベース共通）

#### サーバー状態: TanStack Query (React Query)
- Go APIからのデータ取得、キャッシュ、ローディング状態管理
- 異なるUIプロジェクト間でもロジック（Hooks）を共通化

#### グローバルUI状態: Zustand
- Reduxに比べ軽量で学習コストが低い
- 2〜5日の短期間開発でもオーバーヘッドが少ない

#### URL状態: useSearchParams
- 発送リストの検索条件やページネーションをURLに同期
- 共有や「戻る」操作を可能に

#### フォーム管理
- **shadcn/ui系**: React Hook Form（柔軟性重視）
- **Mantis**: React Hook Form（柔軟性重視）
- **AntD Pro**: AntD Form / ProForm（爆速実装重視）

### 3.3 カスタマイズ原則（重要）

**各UIベースのスタイル・レイアウトシステムは原則変更しない**  
**各UIベース内での画面スタイル（テーマ色）の一貫性を保証する**

#### コンポーネント利用の優先順位
1. **各UIベースの既存コンポーネント・パーツを最大限利用**（最優先）
   - 各UIベースが提供する既存コンポーネントをそのまま使用
   - カスタマイズは最小限に留める
   - 既存のスタイル・構造を維持
2. **各UIベースの標準コンポーネントライブラリを利用**
   - shadcn/ui系 → shadcn/ui標準コンポーネント
   - Mantis → Material-UI コンポーネント
   - AntD Pro → ProTable, ProForm 等の高度コンポーネント
3. **新規コンポーネントを作成**（上記のいずれも適用できない場合のみ）
   - 各UIベースのスタイルガイドに厳密に準拠
   - Tech Leadの承認必須

#### 変更不可（各UIベース内で維持必須）
- **レイアウトシステム**: Sidebar / Header / DashboardLayout の構造・スタイル（各UIベース固有）
- **テーマシステム**: CSS Variables / デザイントークン / Light-Dark 切り替え機構（各UIベース固有）
- **カラーシステム**: 各UIベースのテーマカラーパレット（primary, secondary, accent など）
- **全体的な画面スタイル**: 各UIベースが提供する統一感のある UI デザイン
- **グリッドシステム**: レスポンシブレイアウトの基本構造（各UIベース固有）
- **Typography システム**: フォントサイズ・行間・ウェイトの体系（各UIベース固有）

#### 変更可能（カスタマイズ許容）
- **個別コンポーネントの色**: 各UIベースのテーマカラー内でのバリエーション
    - 例: `bg-primary`, `bg-destructive`, `bg-secondary` など各UIベース定義の色のみ使用
    - ⚠️ 独自の色（`bg-blue-600` など）は**原則使用しない**（各UIベースのテーマ色一貫性を維持）
- **ビジネスロジック連携**: データ表示、API 連携、状態管理
- **コンテンツエリアの配置**: 業務要件に応じた情報配置（各UIベースのレイアウト枠内）
- **テキスト・ラベル**: 日本語化、業務用語への置き換え

#### 修正が必要な場合の手順
全体的なスタイル・レイアウトの変更が必要と判断した場合：
1. **理由を明確に文書化**（なぜ変更が必要か）
2. **影響範囲の特定**（どの画面・コンポーネントに影響するか）
3. **代替案の検討**（Horizon UI の枠内で解決できないか）
4. **承認を得る**（Tech Lead / プロジェクトオーナー）

### 3.4 並行評価戦略

#### Phase 1: 各UIベースのレイアウト整備（優先度: 高）
各UIベースで以下を実施：
- Sidebar / Header の **各UIベーススタイルをそのまま使用**
- テーマシステムは **各UIベースのまま維持**（Light/Dark Mode + カラーパレット）
- **カラーシステムの維持**（各UIベース定義の色のみ使用）
- **ナビゲーション構造の追加**（既存メニュー保留、新規メニュー追加）
    - 既存サイドバーメニューは一旦保留（効果確認のため並行稼働）
    - 新規メニュー項目を追加（ダッシュボード、発送一覧）
    - 既存メニューと新規メニューを明確に区別（区切り線・ラベル）
    - 日本語化対応

#### Phase 2: 画面単位での並行実装（各UIベースで同一機能を実装）
各UIベースで以下の画面を実装：
- **ダッシュボード画面**
- **発送一覧画面**（ProTableなど各UIベースの強みを活用）
- **発送詳細画面**

Issue管理：
- 各UIベース用の個別Issueファイルで管理

**Issue採番ルール**:
- **admin-ui**: 0xx（学習テスト用、成果物ではない）
- **next-shadcn**: 1xx
- **horizon-ui**: 2xx
- **square-ui**: 3xx
- **mui**: 4xx
- **ant-design**: 5xx

```
docs/issues/
├── issues-admin-ui.md        # admin-ui ベースのIssue管理（0xx - 学習テスト用）
├── issues-next-shadcn.md     # Next Shadcn Dashboard ベースのIssue管理（1xx）
├── issues-horizon-ui.md      # Horizon UI ベースのIssue管理（2xx）
├── issues-square-ui.md       # Square UI ベースのIssue管理（3xx）
├── issues-mui.md             # Mantis ベースのIssue管理（4xx）
├── issues-ant-design.md      # Ant Design Pro ベースのIssue管理（5xx）
└── ui-evaluation.md          # 評価結果・比較ドキュメント
```

**ソースフォルダ構成**:
各UIベースのソースフォルダ構成は、各UIベース独自の構成に従います。  
統一されたpath規約は定めません。各UIベースのベストプラクティスを尊重します。

#### Phase 3: 評価・選定
以下の観点で各UIベースを評価：

| 評価軸 | shadcn/ui系 | Mantis (MUI) | AntD Pro |
|---|---|---|---|
| **UI/UX 品質** | モダンデザイン | 高密度表示、Material Design | 業務UI特化 |
| **開発効率** | 中〜高 | 中 | 高（ProTable等） |
| **保守性** | 高（シンプル） | 中 | 高（型安全） |
| **AI Agent対応** | 高 | 中 | 高 |
| **業務UI適性** | 中 | 高（一覧性） | 最高（管理画面特化） |
| **学習コスト** | 低〜中 | 中 | 中〜高 |

評価後、最適なUIベースを選定し正式採用

---

## 4. 決定理由 / Rationale

### 4.1 リスク分散と最適選択

5種類のUIテンプレートを並行評価することで、**実践的な検証**が可能となる。

- shadcn/ui系（3種）で軽量・モダン路線を検証
- Mantis（MUI）で高密度表示・業務UI実績を検証
- AntD Proで爆速実装・管理画面特化を検証
- 実際の業務画面を実装して使い勝手を実体験
- 最終的にプロジェクトに最適なUIベースを選択

### 4.2 各UIベースの特徴と役割

#### shadcn/ui系（3種）
- **共通**: モダンデザイン、カスタマイズ自由度、AI Agent対応
- **Horizon UI**: 商用品質、プロダクション実績
- **Square UI**: Dashboard特化、洗練UI
- **Next Shadcn Dashboard**: シンプル、学習コスト低

#### Mantis (Material-UI)
- **高密度表示**: 発送管理のような一覧性が求められる業務に最適
- **Material Design**: Googleのデザインシステム、多くの業務システムで採用実績
- **React Hook Form**: 柔軟なフォーム管理

#### Ant Design Pro
- **ProTable**: 検索・フィルタ・編集を含む管理画面を最小限のコードで実装
- **ProForm**: 爆速フォーム実装
- **業務UI特化**: 中国最大規模のエンタープライズUI実績

### 4.3 完全独立プロジェクト構成

各UIベースは **完全に独立したディレクトリ** で管理し、ビルド設定や依存関係の競合を回避。

---

## 5. 結果 / Consequences

### 5.1 ポジティブな影響

#### 短期的メリット
- UI/UX の一貫性が即座に改善
- 5種類の技術スタック比較により最適解を発見
- AntD ProのProTableによる爆速一覧画面実装

#### 中長期的メリット
- 保守コストの削減（単一ソース管理）
- 技術的負債の解消
- 業務UI適性の高いテンプレート選定

### 5.2 ネガティブな影響 / トレードオフ

#### リファクタリングコスト
- **影響範囲**: 5プロジェクト × 3画面
- **工数見積**: 各画面 0.5〜1日程度 × 5プロジェクト
- **リスク**: 評価期間の保守対象増加

#### 学習コスト
- shadcn/ui系、MUI、AntDの3系統の学習が必要
- ただし並行評価により最適解選定が可能

---

## 6. 実装計画

### 6.1 並行評価スコープ

| Phase | 対象 | Issue管理 | 優先度 |
|---|---|---|---|
| Phase 1 | Layout System (全5UIベース) | 各UIベースのIssueファイル | P0 |
| Phase 2-1 | ダッシュボード画面 (全5UIベース) | 各UIベースのIssueファイル | P1 |
| Phase 2-2 | 発送一覧画面 (全5UIベース) | 各UIベースのIssueファイル | P1 |
| Phase 2-3 | 発送詳細画面 (全5UIベース) | 各UIベースのIssueファイル | P1 |
| Phase 3 | 評価・選定 | 評価ドキュメント | P2 |
| Phase 4 | 既存メニュー削除・移行完了 | 別途Issue作成 | P3 |

#### Issueファイル構成

```
docs/issues/
├── issues-horizon-ui.md      # Horizon UI ベースのIssue管理
├── issues-square-ui.md       # Square UI ベースのIssue管理
├── issues-next-shadcn.md     # Next Shadcn Dashboard ベースのIssue管理
├── issues-mantis.md          # Mantis ベースのIssue管理 ← 新規追加
├── issues-antd-pro.md        # Ant Design Pro ベースのIssue管理 ← 新規追加
└── ui-evaluation.md          # 評価結果・比較ドキュメント
```

各Issueファイルの構造：
- 機能要件は共通（全UIベースで同一）
- UI実装詳細は各UIベースのスタイルに準拠
- カスタマイズ制約を各UIベース別に明記

### 6.2 後方互換性戦略

#### 並行稼働による段階的移行
- `apps/admin-ui` は一時的に保持（ロールバック用）
- **既存サイドバーメニューを保留**（効果確認のため並行稼働）
    - 既存メニュー → `apps/admin-ui` の従来画面へ遷移
    - 新規メニュー → 各UIベースの新画面へ遷移（5系統）
    - ユーザーは両画面を比較・検証可能
- API 層・ビジネスロジック層は **変更なし**（全UIベースで共有）

#### 評価・移行完了後
- 評価完了後、最適UIベースを正式版として切り替え
- **Phase 4: 既存メニュー削除Issue作成**
    - 既存メニューの段階的削除計画を策定
    - ユーザー通知・移行期間を設定
    - `apps/admin-ui` のアーカイブまたは削除
- 非採用UIベースは削除またはアーカイブ

---

## 7. 成功基準

### 7.1 定量的指標

- [ ] 全5UIベースで同一機能を実装完了
- [ ] ダークモード正常動作（全UIベース）
- [ ] 既存機能の動作保証（回帰テスト 100% パス）
- [ ] 開発効率比較データ取得（実装時間計測）

### 7.2 定性的指標

- [ ] UI デザインの一貫性（各UIベース内）
- [ ] AI Agent による実装指示の精度向上
- [ ] 開発者からのフィードバック（5段階評価で 4 以上）
- [ ] 業務UI適性の実践的評価

---

## 8. 参照

### 関連 ADR
- [ADR-001: UI フレームワーク選定](./ADR-001-ui-framework.md) - 現行ハイブリッド構成の経緯
- [ADR-003: UI アプリアーキテクチャ](./ADR-003-ui-architecture.md) - Feature-based 構成（維持）

### 技術リファレンス
- [Horizon UI Shadcn Boilerplate](https://horizon-ui.com/shadcn-ui)
- [shadcn/ui](https://ui.shadcn.com/)
- [Mantis React Admin Template](https://mantisdashboard.io/)
- [Ant Design Pro](https://pro.ant.design/)
---
