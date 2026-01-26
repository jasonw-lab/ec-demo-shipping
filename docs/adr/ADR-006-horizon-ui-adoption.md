# ADR-006: UI Template Strategy - 複数ベース並行評価アプローチ

**Status:** Proposed  
**Version:** 2.0.0  
**Last Updated:** 2026-01-26  
**Date:** 2026-01-26  
**Decision Makers:** Frontend Tech Lead  
**Context:** Shipping Service Admin UI リファクタリング - 複数UIテンプレート並行評価

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

### Option B: 複数UIテンプレート並行評価アプローチ **[採用]**

**3つの shadcn/ui ベーステンプレート**を並行で評価し、効果確認後に最適なものを選定する。

#### 評価対象UIベース

| UIベース | ディレクトリ | 公式URL | 特徴 |
|---|---|---|---|
| **Horizon UI** | `apps/admin-horizon-ui` | https://horizon-ui.com/shadcn-ui | 商用品質、30+コンポーネント、充実ドキュメント |
| **Square UI** | `apps/admin-square-ui` | https://github.com/ln-dev7/square-ui | モダンデザイン、Dashboard特化 |
| **Next Shadcn Dashboard** | `apps/admin-next-shadcn` | https://github.com/Kiranism/next-shadcn-dashboard-starter | シンプル構成、軽量 |

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

**デメリット**
- 並行開発のため初期コストが増加（ただし MVP 段階のため限定的）
- 3つのテンプレートの学習コストが一時的に発生
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

**複数UIテンプレート並行評価アプローチを採用**し、3つのUIベースを並行で開発・評価する。

### 3.1 並行評価の実施方針

#### 共通アーキテクチャレイヤー

| レイヤー | 技術 | 説明 |
|---|---|---|
| **ベーステンプレート** | 各UIベース固有 | Layout / Theme / Base Components（各UIベースのまま維持） |
| **UI コンポーネント** | shadcn/ui | 標準 UI 部品（Button, Input, Sheet, Table など） |
| **ビジネスロジック** | 共通 features/ 構造 | Feature-based Architecture (ADR-003) - 全UIベースで共有可能 |

#### 各UIベースの実装ディレクトリ

```
apps/
├── admin-horizon-ui/     # Horizon UI ベース

│
├── admin-square-ui/      # Square UI ベース

│
└── admin-next-shadcn/    # Next Shadcn Dashboard ベース

```

### 3.2 カスタマイズ原則（重要）

**各UIベースのスタイル・レイアウトシステムは原則変更しない**  
**各UIベース内での画面スタイル（テーマ色）の一貫性を保証する**

#### コンポーネント利用の優先順位
1. **各UIベースの既存コンポーネント・パーツを最大限利用**（最優先）
   - 各UIベースが提供する既存コンポーネントをそのまま使用
   - カスタマイズは最小限に留める
   - 既存のスタイル・構造を維持
2. **shadcn/ui標準コンポーネントを利用**（既存コンポーネントがない場合）
   - 各UIベースのテーマに準拠してインストール
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

### 3.3 並行評価戦略

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
- **発送一覧画面**
- **発送詳細画面**

Issue管理：
- 各UIベース用の個別Issueファイルで管理（例: `issues-horizon-ui.md`, `issues-square-ui.md`, `issues-next-shadcn.md`）
- 機能要件は共通、UI実装は各UIベースのスタイルに準拠

#### Phase 3: 評価・選定
以下の観点で各UIベースを評価：
- **UI/UX 品質**: デザイン一貫性、ダークモード対応、レスポンシブ
- **開発効率**: 実装速度、AI Agent 対応、ドキュメント充実度
- **保守性**: アップデート追従性、カスタマイズ容易性
- **パフォーマンス**: ページロード速度、バンドルサイズ

評価後、最適なUIベースを選定し正式採用

---

## 4. 決定理由 / Rationale

### 4.1 リスク分散と最適選択

複数のUIテンプレートを並行評価することで、**実践的な検証**が可能となる。

- 実際の業務画面を実装して使い勝手を検証
- 各UIベースの特徴・強み・弱みを実体験
- MVP段階での方向転換が容易（リスク低減）
- 最終的にプロジェクトに最適なUIベースを選択

### 4.2 各UIベースの特徴

#### Horizon UI
- **商用品質**: 30+コンポーネント、充実ドキュメント
- **プロダクション実績**: 複数SaaSで採用
- **AI Agent対応**: 明確な構造、実装精度高

#### Square UI
- **モダンデザイン**: 洗練されたダッシュボードUI
- **Dashboard特化**: KPI表示に最適化
- **軽量**: シンプルな構成

#### Next Shadcn Dashboard
- **シンプル**: 必要最小限の構成
- **学習コスト低**: 理解しやすい構造
- **カスタマイズ自由度**: 最小限の制約

### 4.3 開発効率と保守性

**各UIベース共通**のメリット：

- **shadcn/uiベース**: エコシステム活用可能
- **ダークモード対応**: 全UIベースで対応
- **レスポンシブデザイン**: Mobile-firstアプローチ
- **AI Agent対応**: 明確な構造による実装精度向上

### 4.4 既存アーキテクチャとの整合性

ADR-003（Feature-based Architecture）は維持され、変更は UI レイヤーのみ。

```
src/
├── app/                  # Next.js App Router (変更なし)
├── features/             # ビジネスロジック (変更なし - 全UIベースで共有)
│   └── shipping/
│       ├── components/   # ← 各UIベースで個別実装
│       └── api/          # (全UIベースで共有)
├── components/           # 共通コンポーネント
│   ├── ui/               # ← 各UIベース固有の shadcn/ui
│   └── layouts/          # ← 各UIベース固有の Layout System
└── lib/                  # (変更なし)
```

---

## 5. 結果 / Consequences

### 5.1 ポジティブな影響

#### 短期的メリット
- UI/UX の一貫性が即座に改善
- ダークモード対応の完全性
- 新規画面開発速度の向上（明確な UI パターン）

#### 中長期的メリット
- 保守コストの削減（単一ソース管理）
- 技術的負債の解消（ハイブリッド構成の複雑性排除）
- スケーラビリティ向上（他画面追加時の指針明確化）

### 5.2 ネガティブな影響 / トレードオフ

#### リファクタリングコスト
- **影響範囲**: 3画面（ダッシュボード、発送一覧、発送詳細）
- **工数見積**: 各画面 0.5〜1日程度（MVP段階のため比較的小規模）
- **リスク**: 既存機能の動作保証が必要（回帰テスト）

#### 学習コスト
- Horizon UI 固有の構造・命名規則の理解が必要
- ただし shadcn/ui ベースのため、既存知識の大部分は活用可能

#### カスタマイズ制約
- Horizon UI のデザインシステムからの大幅な逸脱は困難
- ただし業務用管理画面としては十分なカスタマイズ範囲

---

## 6. 実装計画

### 6.1 並行評価スコープ

| Phase | 対象 | Issue管理 | 優先度 |
|---|---|---|---|
| Phase 1 | Layout System (全UIベース) | 各UIベースのIssueファイル | P0 |
| Phase 2-1 | ダッシュボード画面 (全UIベース) | 各UIベースのIssueファイル | P1 |
| Phase 2-2 | 発送一覧画面 (全UIベース) | 各UIベースのIssueファイル | P1 |
| Phase 2-3 | 発送詳細画面 (全UIベース) | 各UIベースのIssueファイル | P1 |
| Phase 3 | 評価・選定 | 評価ドキュメント | P2 |
| Phase 4 | 既存メニュー削除・移行完了 | 別途Issue作成 | P3 |

#### Issueファイル構成

```
docs/issues/
├── issues-horizon-ui.md      # Horizon UI ベースのIssue管理
├── issues-square-ui.md       # Square UI ベースのIssue管理
├── issues-next-shadcn.md     # Next Shadcn Dashboard ベースのIssue管理
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
  - 新規メニュー → 各UIベースの新画面へ遷移
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

- [ ] 全画面でダークモード正常動作（視覚的テスト通過）
- [ ] 既存機能の動作保証（回帰テスト 100% パス）
- [ ] コンポーネント再利用率 70% 以上（重複コード削減）
- [ ] 新規画面追加時間 30% 削減（実装時間計測）

### 7.2 定性的指標

- [ ] UI デザインの一貫性（デザインレビュー合格）
- [ ] AI Agent による実装指示の精度向上（実装ミス削減）
- [ ] 開発者からのフィードバック良好（5段階評価で 4 以上）

---

## 8. 参照

### 関連 ADR
- [ADR-001: UI フレームワーク選定](./ADR-001-ui-framework.md) - 現行ハイブリッド構成の経緯
- [ADR-003: UI アプリアーキテクチャ](./ADR-003-ui-architecture.md) - Feature-based 構成（維持）

### 技術リファレンス
- [Horizon UI Shadcn Boilerplate](https://horizon-ui.com/shadcn-ui)
- [Horizon UI Documentation](https://horizon-ui.com/docs-boilerplate/shadcn-components)
- [shadcn/ui](https://ui.shadcn.com/)

### プロジェクト資料
- [ui-dashboard-design.md](../architecture/ui-dashboard-design.md) - UI設計（変更なし）
- [ui-api-interface-mapping.md](../architecture/ui-api-interface-mapping.md) - API連携（変更なし）

---

## 9. 補足メモ

### 9.1 Horizon UI の主要機能

- **30+ Dark/Light コンポーネント**: Button, Input, Card, Table, Sheet, Dialog, Toast など
- **レイアウトシステム**: Sidebar, Header, Footer の統合管理
- **テーマ管理**: next-themes による Light/Dark 切り替え
- **カラーシステム**: 統一されたテーマカラーパレット
  - `primary`: メインアクション（発送処理など）
  - `secondary`: サブアクション
  - `destructive`: 警告・削除（返送、キャンセルなど）
  - `muted`: 非アクティブ・補助情報
  - `accent`: 強調表示
  - Light/Dark Mode で自動的に適切な色に変換される
- **レスポンシブ対応**: Mobile-first デザイン
- **アクセシビリティ**: ARIA 属性完備

### 9.2 カスタマイズ方針（詳細）

#### 基本原則
**Horizon UI のソースコードをベースに開発し、レイアウト・テーマシステムは変更しない**  
**全体的な画面スタイル（テーマ色）の一貫性を保証する**

#### カスタマイズレベル（許容範囲）

**Level 1: 推奨（Horizon UI のテーマカラー内でカスタマイズ）**
- **個別コンポーネントの色**: Horizon UI 定義のテーマカラーのみ使用
  - ✅ 使用可能: `bg-primary`, `bg-secondary`, `bg-accent`, `bg-destructive`, `bg-muted`
  - ✅ 使用可能: `text-primary`, `text-foreground`, `text-muted-foreground`
  - ✅ 使用可能: `border-primary`, `border-destructive`, `border-muted`
  - ❌ 使用禁止: `bg-blue-600`, `text-red-500` など Tailwind 直接指定の色
- **バッジ・ラベルの色**: ステータスに応じて Horizon UI の variant を使用
- **アイコンの変更**: lucide-react 内での差し替え
- **テキスト内容**: 日本語化、業務用語
- **データ表示・フォーマット**: 日付、数値など

**Level 2: 注意が必要（影響範囲を確認）**
- コンテンツエリア内の要素配置
- 新規コンポーネントの追加（Horizon UI スタイルに準拠）
- Spacing 調整（`gap`, `padding` など）
- Font Size 調整（ただし Horizon UI の範囲内）

**Level 3: 原則禁止（事前承認必須）**
- ❌ Sidebar / Header の構造変更
- ❌ テーマシステムの変更（CSS Variables の上書き）
- ❌ レイアウトグリッドの変更
- ❌ Horizon UI コンポーネントのフォーク
- ❌ グローバル CSS の追加（`globals.css` への追記）

#### カスタマイズ実装方法

```tsx
// ✅ OK: Horizon UI のテーマカラーを使用（variant 指定）
<Button variant="default">  // primary カラー
  発送処理
</Button>
<Button variant="destructive">  // destructive カラー（警告・削除など）
  キャンセル
</Button>

// ✅ OK: Badge でステータス表示（Horizon UI の variant）
<Badge variant="default">CREATED</Badge>
<Badge variant="destructive">RETURNED</Badge>
<Badge variant="secondary">SHIPPED</Badge>

// ✅ OK: Horizon UI のテーマカラークラス使用
<Card className="border-destructive bg-destructive/10">  // 警告カード
  <CardContent className="text-destructive-foreground">
    返送が発生しています
  </CardContent>
</Card>

// ❌ NG: Tailwind の色を直接指定（テーマ色の一貫性が崩れる）
<Button className="bg-blue-600 hover:bg-blue-700">  // 独自色は禁止
  発送処理
</Button>
<Card className="border-red-300 bg-red-50">  // 独自色は禁止
  警告メッセージ
</Card>

// ✅ OK: Horizon UI コンポーネントをそのまま使用
import { Card } from '@/components/ui/card';
<Card>...</Card>

// ⚠️ 注意: コンテンツ配置（Horizon UI のグリッドシステム内で）
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Horizon UI の推奨パターンに従う */}
</div>

// ❌ NG: レイアウトシステムの変更
// Sidebar の width 変更、Header の高さ変更などは禁止

// ❌ NG: CSS Variables の上書き
// :root { --primary: #0000ff; }  // テーマカラーの変更は禁止
```

#### 問題解決のアプローチ

1. **まず Horizon UI の範囲内で解決を試みる**
   - Horizon UI のドキュメントを参照
   - 既存のコンポーネントバリエーションを確認

2. **それでも解決できない場合**
   - 変更理由を文書化
   - 代替案を3つ検討
   - Tech Lead に相談

3. **承認後の実装**
   - 変更内容を ADR に追記
   - 影響範囲を Issue に明記
   - レビュー時に重点チェック

### 9.3 リスク軽減策

- **段階的移行**: 画面単位での段階的リファクタリング（ビッグバン移行回避）
- **並行稼働**: 既存 `apps/admin-ui` を一時的に保持（ロールバック可能）
- **自動テスト整備**: E2E テストによる機能保証
- **AI Agent サポート**: Issue 013〜016 で詳細な実装指示を提供

---

**本 ADR は、Shipping Service UI の長期的な保守性と開発効率を重視した決定である。**

---

## レビュー記録

20260126 120000 Copilot(GPT-5.2) 指摘：Phase 2 の Issue 番号が [docs/issues/issues-horizon-ui.md](../issues/issues-horizon-ui.md) と不整合だったため、Issue 014〜016 に修正し整合を取りました。
20260126 120000 Copilot(GPT-5.2) 指摘：6.1 の表（Phase 2-1〜2-3）の Issue 番号も同様に不整合だったため、Issue 014〜016 に修正しました。
20260126 120000 Copilot(GPT-5.2) 指摘：9.3 の AI Agent サポート範囲が Issue 013〜015 になっていたため、Issue 013〜016 に修正しました。
20260126 120000 Copilot(GPT-5.2) 指摘：テーマ色一貫性の観点で、Tailwind の色直指定（例: `bg-blue-600`）は原則禁止として整理されています。実装では `variant` / `bg-primary` 等の Horizon UI テーマカラーのみ使用を徹底してください。
20260126 120000 Copilot(GPT-5.2) 質問：将来「ブランドカラー」など Horizon UI 既定パレット外の色が必要になった場合、(A) 原則禁止のまま運用で吸収、(B) “追加のセマンティックトークン” を承認制で導入、どちらの方針にしますか？（現状は (A) 前提の記述です）
20260126 123500 Copilot(GPT-5.2) 指摘：本ADRは UI基盤の決定として十分ですが、移行 Issue 側で “機能仕様の参照” が薄いと、移行中に仕様ブレが起きます。作成者は [docs/issues/issues-horizon-ui.md](../issues/issues-horizon-ui.md) の各 Issue に「どの既存Issue/要件/エンドポイント定義を維持するか」を追記してください（本ADR本文の変更ではなく、Issue側で補完推奨）。
20260126 123500 Copilot(GPT-5.2) 指摘：テーマ色一貫性のルールは良いです。運用の破綻ポイントは “例外” なので、例外が起きうる条件（法令・アクセシビリティ・ブランド）と承認フローを最小限でも明文化すると安全です。
20260126 123500 Copilot(GPT-5.2) 質問：移行完了後の「正式版切替」条件（どのテストが通れば `apps/admin-horizon-ui` を primary にするか）が機能面の意思決定として重要です。E2E の最小カバレッジ（Dashboard/一覧/詳細の主要フロー）を先に決めますか？
