# ec-demo-shipping

Shipping Service (発送管理サービス) for ec-demo.

## 概要

本リポジトリは、既存の **ec-demo** システムと連携する **発送管理サービス (Shipping Management Service)** を実装したものです。
注文や決済フローから切り離された、物理的な物流業務（倉庫作業、配送業者への引き渡し、配送追跡）を独立したマイクロサービスとしてモデリングしています。

本プロジェクトの目的は、以下を示す**明確で実践的なリファレンス実装**を提供することです。
- マイクロサービスの適切な責務分離
- イベント駆動によるシステム間連携
- 業務担当者向けの管理画面（Dashboard）設計

## 背景と目的

- 既存の **ec-demo** プラットフォームに、専用の Shipping ドメインを拡張する
- 物理的な時間経過や外部配送業者が関わる、リアルな物流ワークフローを反映させる
- システム設計および実装スキルを実証する**技術ポートフォリオ**として機能させる

関連リポジトリ:
- ec-demo: https://github.com/jasonw-lab/ec-demo

## アーキテクチャ概要

```
[ Admin UI (Next.js + shadcn/ui) ]
            |
            | REST API
            v
[ Shipping Service (Go / Gin) ]
            |
            | Kafka Events
            v
[ Order Service (ec-demo) ]
```

### 主なアーキテクチャ上の決定事項

- **Shipping と Order の分離**
  - Order: 商流（Commercial Transaction）
  - Shipping: 物流（Physical Logistics Process）
- **結果整合性 (Eventual Consistency)**
  - Kafka を用いた非同期連携
  - 分散トランザクション（Seata / Saga）は不使用
- **楽観的ロック (Optimistic Locking)**
  - Version カラムによる排他制御
- **標準的な Go プロジェクト構成 (Standard Go Project Layout)**
  - シンプルで Go 言語の慣習に沿った構造

詳細な設計判断は `docs/` 配下の ADR (Architecture Decision Records) に記載されています。

## 技術スタック

### Backend (Shipping Service)
- Go
- Gin (HTTP framework)
- GORM (ORM)
- Kafka (event consumption)
- MySQL / PostgreSQL (RDBMS)

### Frontend (Admin Dashboard)
- Next.js (App Router)
- shadcn/ui
- Tailwind CSS
- TanStack Table

## 機能

- 注文イベントに基づく発送データの自動作成
- 発送ステータスのライフサイクル管理
  - CREATED → READY → SHIPPED → DELIVERED / RETURNED
- 管理画面 (Admin Dashboard)
  - ステータス別サマリカード
  - 検索・フィルタリング
  - 発送実績登録・更新
- 明確な UI フィードバックを伴う楽観的ロック
- 配送業者ごとの追跡リンク生成

## ディレクトリ構成

```
.
├── apps/
│   └── admin-ui/        # Next.js Admin Dashboard
├── cmd/
│   └── shipping-api/    # Go application entrypoint
├── internal/
│   ├── handler/
│   ├── service/
│   ├── repository/
│   └── domain/
├── docs/
│   ├── adr/
│   ├── requirements/
│   └── ui/
└── README.md
```

## ドキュメント

- 要件定義: `docs/requirements/`
- UI 設計: `docs/ui/`
- アーキテクチャ決定 (ADR): `docs/adr/`

## ステータス

- 要件定義: ✅ 完了 (Finalized)
- アーキテクチャ: ✅ 承認済み (Approved)
- 実装: 🚧 進行中 (In Progress)

## ノート

本プロジェクトは、過剰なエンジニアリングよりも**明確さ、実用性、保守性**を優先しています。
設計上の選択は、トレードオフを明確にするために意図的に文書化されています。
