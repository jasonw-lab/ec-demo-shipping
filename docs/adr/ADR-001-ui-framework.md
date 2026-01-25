# ADR-001: UI フレームワーク選定

**Status:** Accepted  
**Version:** 1.0.0
**Last Updated:** 2026-01-22  
**Date:** 2026-01-17  
**Decision Makers:** Tech Lead  
**Context:** Shipping Service Admin UI (Next.js)

---

## 1. 背景 / Context

Shipping Service の管理画面（Admin UI）は、以下の要件を満たす必要がある。

- 業務用途（倉庫担当・CS）に耐える **操作性と可読性**
- MVP 開発における **初期実装スピード**
- 将来的な画面追加・拡張への **拡張性**
- デザインよりも **業務フローと情報構造を優先**

そのため、UI を「一から作る」のではなく、  
**信頼できる UI テンプレート＋再利用可能なコンポーネント群**を組み合わせる方針とした。

---

## 2. 検討した選択肢 / Options

### Option A: arhamkhnz/next-shadcn-admin-dashboard のみを使用
- 管理画面の基本構造（Sidebar / Header / Layout）が揃っている
- 画面の骨格を短時間で構築できる

**課題**
- 業務要件に合わせた細かな UI 部品（Table, Form, Dialog 等）は不足
- 拡張時にカスタマイズコードが増えやすい

---

### Option B: shadcn/ui Official Blocks のみを使用
- 高品質な UI コンポーネント（Table, Form, Dialog 等）
- shadcn/ui エコシステムとの親和性が高い

**課題**
- 管理画面としての「全体構造（レイアウト）」は自前で設計する必要がある
- Sidebar / Header / Theme 管理を一から組むのは非効率

---

### Option C: **ハイブリッド構成（採用）**
- **arhamkhnz** を「管理画面の骨格」として使用
- **shadcn/ui Official Blocks** を「中身の部品」として組み込む

---

## 3. 決定 / Decision

### 採用方針（Hybrid）

| 役割 | 採用技術 | 説明 |
|---|---|---|
| **骨格（Layout）** | arhamkhnz/next-shadcn-admin-dashboard | Sidebar / Header / ページ枠 / テーマ |
| **部品（Components）** | shadcn/ui Official Blocks | KPIカード / Table / Form / Dialog 等 |

---

## 4. 決定理由 / Rationale

### 4.1 実務に近い分業構造を再現できる
- **Layout（外枠）** と **Component（中身）** を明確に分離
- 実際のプロダクト開発に近い UI 構成

### 4.2 MVP 開発スピードの最大化
- 管理画面の「土台」を考える時間を削減
- 業務ロジック・API 連携に集中できる

### 4.3 shadcn/ui エコシステムとの整合性
- FormMessage / Toast / Sheet などを自然に利用可能
- UI 設計書（ui-dashboard-design.md v0.2.2）との整合が高い

### 4.4 将来拡張への耐性
- Blocks 単位で UI を差し替え・追加可能
- 不要になった場合でも Layout / Component を個別に置き換えられる

---

## 5. 結果 / Consequences

### ポジティブ
- 管理画面を **短期間で実務レベルに到達**できる
- UI 設計と実装の乖離が起きにくい
- Claude CLI / Cursor Agent による実装指示が明確

### ネガティブ / トレードオフ
- テンプレート由来のコードを理解する初期コストがある
- デザインの完全自由度は下がる

---

## 6. 補足メモ

- KPI カード・一覧テーブル・詳細 Sheet は **shadcn Blocks を優先使用**
- レイアウト・ナビゲーション変更は **arhamkhnz 側で吸収**
- UI/UX の細かな改善は Blocks レベルで対応する

---

## 7. 関連ドキュメント

- ui-dashboard-design.md v0.2.2  
- ui-api-interface-mapping.md v0.2.0  
- shipping-service-requirements.md v0.2.2  

---

**ADR-001 は UI 技術選定に関する最終決定として固定する。**
