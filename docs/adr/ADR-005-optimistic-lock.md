# ADR-005: 排他制御（Optimistic Lock 採用理由）

**Status:** Accepted  
**Date:** 2026-01-19  
**Decision Makers:** Tech Lead  
**Context:** Shipping Service 同時更新制御

---

## 1. 背景 / Context

Shipping Service の管理画面は  
複数の Ops / CS 担当者が同時に操作する可能性がある。

特に READY / SHIPPED の更新操作では  
**同時更新によるデータ競合**を防ぐ必要がある。

---

## 2. 検討した選択肢 / Options

### Option A: 悲観ロック（DB Lock）
- 強力な排他制御

**課題**
- パフォーマンス低下
- デッドロックのリスク
- 業務 UI との相性が悪い

---

### Option B: **楽観ロック（Optimistic Lock, 採用）**
- version カラムによる更新制御
- UI と連携した排他制御が可能

---

## 3. 決定 / Decision

- Shipping テーブルに `version` カラムを持たせる
- 更新時に version を必須送信
- 不一致時は `409 Conflict` を返却する

---

## 4. 決定理由 / Rationale

- 同時更新は「稀」であるという前提が成立する
- UI 側で競合を明示的にハンドリングできる
- 業務フローを止めずに整合性を保てる

---

## 5. 結果 / Consequences

### ポジティブ
- DB ロックに依存しないスケーラブルな設計
- UX と一体化した排他制御が可能
- 実務システムで採用実績が多い

### ネガティブ / トレードオフ
- 競合発生時の UX 設計が必須
- UI 実装がやや複雑になる

---

## 6. 関連ドキュメント
- ui-dashboard-design.md v0.2.2  
- ui-api-interface-mapping.md v0.2.0  

---

**ADR-005 は 排他制御方式に関する最終決定とする。**
