# ADR-003: Backend Framework / ORM 選定（Gin + GORM）

**Status:** Accepted  
**Date:** 2026-01-18  
**Decision Makers:** Tech Lead  
**Context:** Shipping Service Backend (Go)

---

## 1. 背景 / Context

Shipping Service は、EC システムにおける発送管理を担う  
**業務系マイクロサービス**として実装される。

要件として以下が求められる。

- REST API の明確な実装
- 学習コストが低く、実装スピードが速いこと
- MVP 段階での過剰設計を避けること
- 将来的な保守・拡張が容易であること

---

## 2. 検討した選択肢 / Options

### Option A: net/http + 自作 Middleware
- Go 標準に忠実
- 依存が最小限

**課題**
- Routing / Middleware / Error handling を自前で揃える必要がある
- MVP 段階では生産性が低い

---

### Option B: Echo + GORM
- 高機能な Web Framework
- Middleware が充実

**課題**
- 柔軟すぎて設計がブレやすい
- チーム標準としての採用事例がやや少ない

---

### Option C: **Gin + GORM（採用）**
- シンプルで実績が豊富
- REST API 実装に最適
- ORM との相性が良い

---

## 3. 決定 / Decision

### 採用技術
- **Web Framework:** Gin
- **ORM:** GORM

---

## 4. 決定理由 / Rationale

### 4.1 Gin 採用理由
- Routing / Middleware / Context 管理が直感的
- REST API サーバーとしての実績が非常に多い
- Standard Go Layout と自然に組み合わせられる

### 4.2 GORM 採用理由
- MVP 開発における実装スピードが速い
- version カラムによる楽観ロック実装が容易
- Struct 定義と DB スキーマの乖離が起きにくい

---

## 5. 結果 / Consequences

### ポジティブ
- 実装・レビュー・保守がしやすい
- 初学者にも読みやすいコード構造
- Claude CLI / AI Agent との相性が良い

### ネガティブ / トレードオフ
- GORM の自動挙動を理解しないと予期せぬ SQL が出る可能性
- 高度な SQL 最適化には Raw Query が必要

---

## 6. 関連ドキュメント
- shipping-service-requirements.md v0.2.2  
- ui-api-interface-mapping.md v0.2.0  

---

**ADR-003 は Backend Framework / ORM 選定に関する最終決定とする。**
