# Shipping Service Admin UI Dashboard 設計

**Version:** 0.3.0 (User Management Added)  
**Status:** Approved  
**Target:** Next.js (App Router) + shadcn/ui  

---

## 1. 目的

本ドキュメントは、発送管理システム（Shipping Service）の  
**管理画面（Admin UI）Dashboard の画面設計方針と構成**を定義する。

- **対象ユーザー:** 倉庫担当（Ops）、カスタマーサポート
- **主目的:** 発送業務の滞留を可視化し、最短導線で処理を完了させる
- **技術前提:**
  - Next.js (App Router)
  - shadcn/ui (Cards, Tables, Sheets, Forms)
  - 複数UIベース並行評価中（Horizon UI / Square UI / Next Shadcn Dashboard）
  - **色・配色は各UIベースのテーマに従う**（具体的な色指定なし）
  - Go Backend API（Shipping Service）

---

## 2. UI設計の基本方針

### 2.1 業務状態の可視化を最優先
- 売上分析・KPI・グラフは対象外とする。
- 「今、倉庫で作業が止まっている注文はどれか」を即座に把握できるUIとする。

### 2.2 ステータス駆動UI
- Shipping のステータス遷移（CREATED / READY / SHIPPED / RETURNED）をUIの中心に置く。
- 特に **READY（出荷準備中・Cut-off済み）** を最重要ステータスとして扱う。

### 2.3 整合性と排他制御UX
- 複数人での同時操作を想定する。
- 楽観ロック（Optimistic Lock）による競合発生時は、ユーザーに明確なフィードバックを行い、最新状態へ自動誘導する。

---

## 3. 画面構成概要

```text
Dashboard Layout
 ├─ Header (User Profile, Logout)
 ├─ Overview Cards (件数サマリ)
 └─ Shipping List Table (一覧・検索・フィルタ)
      └─ [Sheet/Drawer] Shipping Detail & Edit
```

---

## 4. Dashboard（Overview Cards）

### 4.1 目的
- 業務負荷・滞留ポイントの即時把握

### 4.2 表示内容
上部に以下のカードを配置し、クリックすると該当ステータスで一覧をフィルタする。

| タイトル | 値 | 説明 | 重要度 |
|---|---|---|---|
| 未着手 | CREATED 件数 | 自動生成直後 | 低 |
| 出荷作業待ち | READY 件数 | 倉庫作業が必要 | **高** |
| 本日出荷 | SHIPPED 件数 | 当日出荷完了 | 中 |
| 返送/トラブル | RETURNED 件数 | 要対応 | 中 |

---

## 5. Shipping List（メインテーブル）

### 5.1 Filter / Search Bar

| 項目 | UI | 内容 |
|---|---|---|
| Keyword | Input | 注文ID / 追跡番号（部分一致） |
| Status | Select | 全て / CREATED / READY / SHIPPED / RETURNED |
| Carrier | Select | 全て / Yamato / Sagawa / JapanPost |
| Actions | Button | Reset Filters |

- 初期表示は `READY` をデフォルトとする。

---

### 5.2 一覧テーブル定義

| Column | 内容 | UI 備考 |
|---|---|---|
| Order ID | 注文ID | Link（詳細Sheetを開く） |
| Status | ステータス | Badge（色分け） |
| Carrier | 配送業者 | アイコン + テキスト |
| Tracking | 追跡番号 | 等幅フォント + Copy ボタン |
| Updated | 更新日時 | Relative Time |
| Action | 操作 | Edit（Pencil Icon） |

#### ステータスバッジ配色
**各UIベースのテーマカラーに従う**（具体的な色指定なし）
- CREATED: デフォルト
- READY: Primary / 注意喚起色
- SHIPPED: 成功色
- RETURNED: 警告/エラー色

---

## 6. Shipping Detail & Edit（Sheet / Drawer）

一覧行クリック時、右側からスライドインする Sheet コンポーネントを使用する。

### 6.1 表示セクション（Read Only）
- Order ID
- ステータス
- 配送先住所（Snapshot）
- 更新日時

---

### 6.2 編集フォーム（ステータス別）

#### Case A: READY
- Action: 出荷完了登録
- Input:
  - Carrier（Select）
  - Tracking Number（Input）
- Validation:
  - Carrier ごとの追跡番号フォーマットチェック
  - エラー時は `FormMessage` で即時表示

#### Case B: SHIPPED / RETURNED
- Action: 情報修正
- Input:
  - Carrier
  - Tracking Number
- External Link:
  - 追跡番号から配送業者の追跡ページへのリンクを表示（別タブ）
  - URL構築は Frontend 側で行う（Backendは追跡番号のみ返す）

---

### 6.3 排他制御エラーハンドリング（必須）

フォーム送信時に Backend から `409 Conflict` が返却された場合：

1. Toast 表示  
   > 「データの競合が発生しました。他のユーザーが既に更新しています。」
2. Toast 内のアクションボタン「最新情報を読み込む」を提供
3. 最新データを自動再取得し、Sheet 内のフォームを再描画

---

## 7. ナビゲーション構成

```text
Sidebar
 ├─ Dashboard                    (SCR-001)
 ├─ Shipping                     (SCR-002)
 └─ [admin ロールのみ表示]
     └─ ユーザー管理 (Users)     (SCR-030)

Header (右上)
 ├─ ユーザー名 / アバター → クリックでプロフィール画面 (SCR-020) へ遷移
 └─ Logout ボタン → ログアウト処理 → ログイン画面 (SCR-010) へ遷移
```

- マスタ管理は MVP 対象外とする。
- ユーザー管理メニューは admin ロールの場合のみサイドバーに表示する。
- operator / viewer ロールの場合、サイドバーには Dashboard と Shipping のみ表示する。

---

## 8. MVPで実装しない項目

- グラフ・チャート
- 一括更新
- CSV Export
- 配送業者APIとのリアルタイム連携

---

## 9. 使用コンポーネント対応表

| 用途 | shadcn/ui |
|---|---|
| サマリ表示 | Card |
| ステータス | Badge |
| 一覧 | Table |
| 詳細 | Sheet / Drawer |
| 入力 | Form / Select / Input |
| 通知 | Toast |

---

## 10. UI/UX担当の視点からの改善提案（Refinement）

本章は、実装後の運用効率・認知負荷低減・心理的安全性を高めるための  
**UI/UX 担当視点での補強ポイント**を定義する。

### 10.1 認知負荷を下げる工夫（Visual Hierarchy）
- 配送業者は文字列のみでなく、簡易アイコン（例：トラック）で表現する（色は各UIベースのテーマに従う）。
- 追跡番号・注文IDなどの識別子は等幅フォント（`font-mono`）を使用する。

### 10.2 オペレーション効率を高めるマイクロインタラクション
- 注文ID・追跡番号に Copy-to-Clipboard ボタンを付与する。
- コピー成功時は短時間の Tooltip / Toast を表示する。
- Sheet 表示中は `Esc` キーで閉じる操作をサポートする。

### 10.3 達成感を与えるフィードバック
- READY 件数が 0 の場合、無機質な「No Data」ではなく  
  「全ての発送作業が完了しました」といったポジティブメッセージを表示する。

### 10.4 エラー時のリカバリー体験
- 409 Conflict 発生時は、エラー内容だけでなく  
  「次に取るべき行動（再読み込み）」をUI上で明示する。
- ユーザーに手動リロードを要求しない設計とする。

---

## 11. 発送詳細画面のデザイン設計思想

### 11.1 デザインの目的
発送詳細画面（Shipment Detail Sheet）は、オペレーターが発送情報を素早く確認し、適切なアクションを取るための重要なインターフェースである。以下の設計思想に基づいて実装する。

### 11.2 視覚的階層とレイアウト戦略

#### 11.2.1 ヘッダーデザイン
- **グラデーション背景**: ヘッダーに美しいグラデーション背景（`from-primary/10 via-primary/5 to-background`）を適用し、視覚的な奥行きを演出
- **ぼかし効果**: 装飾的な円形要素に `blur-3xl` / `blur-2xl` を適用し、柔らかく洗練された印象を与える
- **アイコンの強調**: パッケージアイコンを `rounded-xl` の背景とシャドウ（`shadow-lg shadow-primary/20`）で囲み、視覚的な焦点を作る
- **ステータスバッジ**: 右上に配置し、現在の状態を即座に認識できるようにする

#### 11.2.2 カード型レイアウト
- **情報のグループ化**: 関連する情報をカードコンポーネントでグループ化し、視覚的な境界を明確にする
- **2カラムレイアウト**: 画面幅を効率的に活用し、スクロール量を削減（`lg:grid-cols-2`）
- **シャドウとボーダー**: `border-2` と `shadow-md` を組み合わせ、カードに奥行きと重要度を表現
- **ホバー効果**: `hover:shadow-lg` でインタラクティブ性を示唆

### 11.3 カラーシステムとステータス表現

#### 11.3.1 ステータス別グラデーション
各ステータスに専用のグラデーションカラーを定義し、視覚的な識別性を向上：

```typescript
const STATUS_GRADIENTS = {
  CREATED: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  READY: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  SHIPPED: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  DELIVERED: "from-green-500/10 to-green-500/5 border-green-500/20",
  RETURNED: "from-red-500/10 to-red-500/5 border-red-500/20",
  CANCELLED: "from-gray-500/10 to-gray-500/5 border-gray-500/20",
};
```

#### 11.3.2 アイコンカラー
ダークモード対応のアイコンカラーを定義：
- ライトモード: `text-{color}-600`
- ダークモード: `dark:text-{color}-400`

#### 11.3.3 ステータスカードの強調
- 大きなアイコン（`size-10`）を中央に配置
- 背景に `rounded-2xl` と `shadow-inner` を適用
- ステータス名を `text-2xl font-bold` で表示し、視認性を最大化

### 11.4 タイムラインの視覚デザイン

#### 11.4.1 グラデーション縦線
- `bg-gradient-to-b from-primary via-primary/50 to-muted` でタイムラインの流れを表現
- 過去から現在への時間の流れを視覚的に示す

#### 11.4.2 イベントノード
- **最新イベント**: `scale-110` で拡大し、`shadow-lg shadow-primary/30` で強調
- **過去イベント**: 通常サイズで表示し、ホバー時に `border-primary/50` で反応
- **アイコン統合**: 各ステータスに対応するアイコンをノード内に表示

#### 11.4.3 イベントカード
- `rounded-lg border bg-card` で統一感のあるデザイン
- ホバー時に `hover:shadow-md` でインタラクティブ性を示す
- 日時表示にカレンダーアイコンを追加し、視認性を向上

### 11.5 配送情報の視覚的強調

#### 11.5.1 追跡番号リンク
- **グラデーション背景**: `from-primary/5 to-primary/10` で特別な要素であることを示す
- **ボーダー**: `border-2 border-primary/20` で枠を強調
- **ホバーアニメーション**: 
  - `hover:border-primary/40` でボーダーを濃くする
  - `hover:shadow-md` でシャドウを追加
  - `group-hover:translate-x-0.5` で外部リンクアイコンを右に移動

#### 11.5.2 配送業者表示
- アイコン（`Box`）と組み合わせて表示
- `bg-muted/50` の背景で情報を区別

### 11.6 監査ログの視覚デザイン

#### 11.6.1 変更内容の表現
- **削除値**: `bg-destructive/10 px-1.5 py-0.5 text-destructive line-through` で赤系の背景とストライクスルー
- **新規値**: `bg-primary/10 px-1.5 py-0.5 text-primary font-medium` で青系の背景と太字
- **矢印アイコン**: `ArrowRight` で変更の方向性を明示

#### 11.6.2 ログカード
- `rounded-lg border bg-card` で統一
- ホバー時に `hover:shadow-md` で反応
- 時計アイコンとユーザーアイコンで情報の種類を視覚的に区別

### 11.7 アクションボタンのデザイン

#### 11.7.1 サイズと配置
- `size="lg"` で操作しやすいサイズを確保
- `flex-1` で均等な幅を保ち、視覚的なバランスを維持

#### 11.7.2 アイコン統合
- 各アクションに対応するアイコンを左側に配置（`mr-2 size-5`）
- アイコンでアクションの意味を直感的に伝える

#### 11.7.3 シャドウ効果
- プライマリアクションに `shadow-md` を追加し、重要度を強調

### 11.8 レスポンシブデザイン

#### 11.8.1 画面幅の最適化
- `sm:max-w-4xl` で十分な作業スペースを確保
- モバイルでは `w-full` でフルスクリーン表示

#### 11.8.2 グリッドレイアウト
- `lg:grid-cols-2` で大画面では2カラム
- 小画面では自動的に1カラムに折り返し

### 11.9 マイクロインタラクション

#### 11.9.1 トランジション
- `transition-all` / `transition-shadow` / `transition-transform` で滑らかなアニメーション
- ホバー、フォーカス時の視覚的フィードバック

#### 11.9.2 グループホバー
- `group` クラスを使用し、親要素のホバー時に子要素も反応
- 追跡番号リンクの外部リンクアイコンなどに適用

### 11.10 アクセシビリティとユーザビリティ

#### 11.10.1 アイコンの意味付け
- すべての重要な情報にアイコンを付与し、視覚的な手がかりを提供
- テキストとアイコンを組み合わせ、理解しやすさを向上

#### 11.10.2 空状態のデザイン
- データがない場合は `border-2 border-dashed` で空状態を明示
- 大きなアイコン（`size-8`）と説明文で状況を伝える

#### 11.10.3 カラーコントラスト
- `text-muted-foreground` でラベルと値を区別
- 重要な情報は `font-semibold` / `font-bold` で強調

### 11.11 デザインシステムの一貫性

#### 11.11.1 スペーシング
- `space-y-6` / `space-y-4` / `space-y-3` で一貫したリズムを作る
- `p-6` / `p-4` / `p-3` でカード内の余白を統一

#### 11.11.2 角丸
- `rounded-xl` / `rounded-lg` / `rounded-md` で階層に応じた角丸を使用
- 大きな要素ほど大きな角丸を適用

#### 11.11.3 フォントサイズ
- タイトル: `text-2xl` / `text-lg`
- 本文: `text-sm` / `text-base`
- 補足情報: `text-xs`

---

## 12. UIベース別スタイルガイドライン

### 12.1 Square UI スタイル一貫性

Square UI (`apps/admin-square-ui`) 実装時の統一ルール：

#### カードコンポーネント
```tsx
// 標準カード
<div className="rounded-xl border border-border bg-card p-4">

// 強調カード（ステータス表示など）
<div className="rounded-xl border-2 p-6">
```

#### テーブルコンテナ
```tsx
<div className="rounded-xl border border-border bg-card">
  <div className="border-b border-border p-4">{/* ヘッダー */}</div>
  <div className="overflow-hidden">{/* テーブル */}</div>
  <div className="border-t border-border p-4">{/* フッター */}</div>
</div>
```

#### ボタンサイズ
- フィルタ・アクション: `size="sm"` + `h-7`
- 主要アクション: デフォルトサイズ or `size="lg"`

#### アイコンサイズ
- メニュー・ボタン内: `size-4` / `size-3.5`
- カード内装飾: `size-8` / `size-16`

#### 色の使用
- **推奨**: `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted/50`
- **ステータス色**: 各ステータスに応じた semantic color を使用可
  - 成功: `text-green-600`, `text-emerald-600`
  - 警告: `text-red-600`, `text-amber-600`
  - 情報: `text-blue-600`
- **禁止**: 新規のハードコード色追加（テーマ一貫性維持のため）

---

## 13. 実装補足（AI Agent 向け）

- shadcn/ui の table / sheet / card / form / badge を利用する。
- API Client で `version` フィールドを必ず送信する。
- 一覧は TanStack Table を使用してもよい。
- 件数が少ない想定（1000件未満）のため、クライアントサイドフィルタでも可。
- それ以上になる場合は Server Side Pagination に切り替える。

---

## 14. 変更履歴

| Version | 日付 | 変更内容 |
|---------|------|----------|
| 0.2.2 | — | Final + UX Refinements |
| 0.3.0 | 2026-02-16 | Section 7: ナビゲーション構成にユーザー管理（admin専用）・プロフィール・ログアウト遷移を追加。SCR-010/020/030 画面設計書との整合 |

本設計は、Shipping Service Backend 要件（v0.4.0）と完全に整合しており、  
**UI設計としての最新版（v0.3.0）**とする。
