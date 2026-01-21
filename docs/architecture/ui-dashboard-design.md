# Shipping Service Admin UI Dashboard 設計

**Version:** 0.2.2 (Final + UX Refinements)  
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
- CREATED: Gray
- READY: Attention（Primary / Orange）
- SHIPPED: Green
- RETURNED: Red

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
 ├─ Dashboard
 └─ Shipping
```

- 設定画面・マスタ管理は MVP 対象外とする。

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
- 配送業者は文字列のみでなく、簡易アイコン（例：トラック）＋色で表現する。
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

## 11. 実装補足（AI Agent 向け）

- shadcn/ui の table / sheet / card / form / badge を利用する。
- API Client で `version` フィールドを必ず送信する。
- 一覧は TanStack Table を使用してもよい。
- 件数が少ない想定のため、クライアントサイドフィルタでも可。

---

本設計は、Shipping Service Backend 要件（v0.2.1）と完全に整合しており、  
**UI設計としての最終版（v0.2.2）**とする。
