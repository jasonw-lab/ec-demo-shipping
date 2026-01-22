# ADR-004: 非同期連携（Kafka + Eventual Consistency）

**Status:** Accepted  
**Version:** 1.0.0
**Last Updated:** 2026-01-22  
**Date:** 2026-01-19  
**Decision Makers:** Tech Lead  
**Context:** Shipping Service ↔ Order Service 連携

---

## 1. 背景 / Context

Shipping Service は、注文・決済とは異なり  
**物理的な作業時間を伴う業務（倉庫作業・配送）**を扱う。

そのため、厳密な同期トランザクションよりも  
業務リアリティに即した連携方式が求められる。

---

## 2. 検討した選択肢 / Options

### Option A: 同期 API + 分散トランザクション
- 即時整合性（Strong Consistency）

**課題**
- 実装・運用コストが高い
- 障害時の影響範囲が大きい

---

### Option B: Saga / TCC
- マイクロサービスとしては正統派

**課題**
- Shipping の業務粒度に対して過剰設計
- 個人開発 / MVP ではコスト過多

---

### Option C: **Kafka + Eventual Consistency（採用）**
- 非同期イベントによる疎結合
- 業務実態に合致

---

## 3. 決定 / Decision

- Order Service → Shipping Service は **Kafka イベント**で連携
- データ整合性は **結果整合性（Eventual Consistency）** を採用
- Shipping Service 側では冪等処理を必須とする

---

## 4. 決定理由 / Rationale

- 発送業務は「即時性」より「確実性」が重要
- 一時的な不整合は業務上問題にならない
- システムの耐障害性・拡張性が向上する

---

## 5. 結果 / Consequences

### ポジティブ
- サービス間の依存度が低下
- 障害影響範囲を局所化できる
- 将来的なサービス追加が容易

### ネガティブ / トレードオフ
- 一時的なデータ不整合が発生し得る
- 運用側で状態遷移の理解が必要

---

## 6. 関連ドキュメント
- shipping-service-requirements.md v0.2.2  
- ADR-005: Optimistic Lock 採用理由  

---

**ADR-004 は 非同期連携方式に関する最終決定とする。**
