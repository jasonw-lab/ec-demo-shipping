# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shipping Service (発送管理サービス) - A microservice handling physical logistics (warehouse operations, carrier handoff, delivery tracking) for the ec-demo e-commerce platform. This is separate from order/payment flows.

## Build and Development Commands

### Frontend (Admin UI - Next.js)
```bash
cd apps/admin-ui
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run linter
```

### Backend (Shipping API - Go)
```bash
cd apps/api
go mod tidy          # Install dependencies
go run cmd/server/main.go  # Run server
go test ./...        # Run all tests
go test ./internal/service/...  # Run specific package tests
```

## Architecture

```
[ Admin UI (Next.js + shadcn/ui) ]
            |
            | REST API
            v
[ Shipping Service (Go / Gin + GORM) ]
            |
            | Kafka Events
            v
[ Order Service (ec-demo) ]
```

### Key Architectural Decisions (ADRs)

- **ADR-001**: UI uses hybrid approach - arhamkhnz/next-shadcn-admin-dashboard for layout/skeleton + shadcn/ui Official Blocks for components
- **ADR-002**: Backend uses Gin (HTTP framework) + GORM (ORM)
- **ADR-003**: Frontend follows Feature-based architecture (Bulletproof React style) - see structure below
- **ADR-004**: Kafka + Eventual Consistency for Order↔Shipping integration (not distributed transactions)
- **ADR-005**: Optimistic Locking with `version` column - returns `409 Conflict` on mismatch

### Frontend Structure (Feature-based / Bulletproof React)

```
apps/admin-ui/src/
├── app/                  # Next.js App Router - routing/layout only, no business logic
│   └── (dashboard)/shipments/page.tsx  # Server Component entry
├── features/             # Business logic & domain UI
│   └── shipping/
│       ├── components/   # Domain-specific UI
│       ├── api/          # Data fetching (hooks, server actions)
│       ├── types/        # Domain types
│       └── index.ts      # Public API (only exports used by other features)
├── components/           # Shared domain-agnostic components
│   ├── ui/               # shadcn/ui components
│   └── layouts/          # Sidebar, Header
└── lib/                  # Utilities
```

**Feature encapsulation rule**: Import from `features/<domain>/index.ts` only - no deep imports into internal files.

### Backend Structure (Standard Go Layout)

```
apps/api/
├── cmd/server/           # Application entrypoint
└── internal/
    ├── domain/           # Domain models
    ├── handler/          # HTTP handlers (Gin)
    ├── service/          # Business logic
    └── infra/            # Repository, Kafka, external integrations
```

### Shipping Status Lifecycle

`CREATED → READY → SHIPPED → DELIVERED / RETURNED`

## Tech Stack

- **Backend**: Go 1.21+, Gin, GORM, Kafka, MySQL/PostgreSQL
- **Frontend**: Next.js (App Router), shadcn/ui, Tailwind CSS, TanStack Table

## Claude CLI Issue対応フロー

### 1. ブランチ作成
```bash
git checkout feature/init-app-base
git checkout -b feature/issue-<番号>-<概要>
```

### 2. 実装
- Issue ファイル (`docs/issues/issue-XXX-*.md`) を確認
- 1 Issue = 1 ブランチで対応
- コミットメッセージに Issue 番号を含める

### 3. テスト・ビルド確認
```bash
# Backend
cd apps/api && go test ./... && go build ./...

# Frontend
cd apps/admin-ui && npm run build
```

### 3.5. 動作確認（ユーザー目視）
- **テスト・ビルド完了後、一旦停止する**
- ユーザーが目視で動作確認を行う
- **直接コミットは行わない** - ユーザーの確認・承認を待つ

### 4. コミット・プッシュ
```bash
git add <files>
git commit -m "feat(scope): description (issue-XXX)"
git push -u origin feature/issue-XXX-description
```

### 5. PR作成（Claude CLI で実行）
```bash
gh pr create --title "feat(scope): description (issue-XXX)" \
  --body "## Summary\n- ...\n\n## Test plan\n- [ ] ..." \
  --base feature/init-app-base
```

### 6. PR承認・マージ（GitHub Web UI で実施）
- Claude CLI では PR 作成まで
- 承認・マージは GitHub Web UI で手動実施

### Rate Limit 対策
- 不要な API 呼び出しを減らす
- 複数コマンドは並列実行でまとめる

