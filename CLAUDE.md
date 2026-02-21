# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Shipping Service (発送管理サービス)** for ec-demo - a microservice handling physical logistics workflows (warehouse operations, carrier handoff, delivery tracking) separate from the order/payment domain.

**Architecture:**
- Frontend: Multiple admin UI implementations (Next.js based) for parallel evaluation
- Backend: Go API with Gin, GORM, MySQL, Kafka event consumption
- Event-driven: Kafka for async communication with Order Service (ec-demo)
- Patterns: Optimistic locking (version column), eventual consistency

## Build & Run Commands

### Backend (Go API)
```bash
cd apps/api
go build -o server ./cmd/server      # Build
go run ./cmd/server                   # Run
go test ./...                         # Run all tests
go test ./internal/handler/...        # Run specific package tests
go test -v ./internal/infra/repository/shipping_repository_test.go  # Single test file
```

### Frontend (admin-ui - Next.js + shadcn/ui)
```bash
cd apps/admin-ui
npm install
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Lint
```

### Frontend (admin-next-shadcn)
```bash
cd apps/admin-next-shadcn
npm install
npm run dev
npm run build
npm run lint        # biome lint
npm run check:fix   # biome check + fix
```

## Project Structure

```
apps/
├── api/                    # Go backend
│   ├── cmd/server/         # Application entrypoint
│   └── internal/
│       ├── config/         # Configuration loading
│       ├── domain/         # Domain models
│       ├── handler/        # HTTP handlers (Gin)
│       ├── infra/          # Infrastructure layer
│       │   ├── database/   # DB connection, migrations
│       │   ├── kafka/      # Kafka consumer, event handlers
│       │   └── repository/ # Data access (GORM)
│       └── service/        # Business logic
├── admin-ui/               # Primary UI (Next.js 14 + shadcn/ui + TanStack Table)
├── admin-next-shadcn/      # Alternative UI implementation (Issue 1xx)
├── admin-horizon-ui/       # Alternative UI (Issue 2xx)
├── admin-square-ui/        # Alternative UI (Issue 3xx)
├── admin-mui/              # MUI-based UI (Issue 4xx)
└── admin-antd-pro/         # Ant Design based UI (Issue 5xx)
docs/
├── adr/                    # Architecture Decision Records
├── design/                 # Requirements, screen specs, sequence diagrams
├── issues/                 # Issue tracking files
└── plan/                   # Implementation plans
```

## Key Design Patterns

- **Shipping Status Lifecycle:** CREATED → READY → SHIPPED → DELIVERED / RETURNED
- **Optimistic Locking:** All mutations use version column for conflict detection
- **API-UI Mapping:** See `docs/design/ui-api-interface-mapping.md`
- **Screen Specs:** `docs/design/SCR-*.md` files

## Issue Management Rules

**Issue numbering by UI:**
- admin-ui: 0xx (learning/test - not deliverable)
- next-shadcn: 1xx
- horizon-ui: 2xx
- square-ui: 3xx
- mui: 4xx
- ant-design: 5xx

**One issue = one UI change only.** If UI target is not specified, confirm before proceeding.
When creating a PR, include a closing keyword in the PR body to auto-close the corresponding GitHub issue after merge:
- `Closes #<issue-number>` (preferred)
- `Fixes #<issue-number>`
- `Resolves #<issue-number>`

### GitHub Issue タイトルフォーマット

```
[<app-name>] Issue <番号>: <画面/機能名>（<画面ID>）
```

**例:**
- `[admin-next-shadcn] Issue 107: ログイン画面（SCR-010）`
- `[admin-next-shadcn] Issue 109: ユーザー管理画面（SCR-030）`

`<app-name>` は `apps/` 配下のディレクトリ名に対応:
- `admin-next-shadcn`, `admin-horizon-ui`, `admin-square-ui`, `admin-mui`, `admin-antd-pro`

### GitHub Issue ラベルルール

| ラベル | 用途 |
|---|---|
| `auth` | 認証・認可機能 |
| `ui` | フロントエンド UI 実装 |
| `backend` | バックエンド実装 |
| `api` | API 実装 |
| `P0` | 最優先（他の実装の前提条件、またはブロッカーあり） |
| `P1` | 高優先（MVP スコープ） |
| `enhancement` | 新機能追加全般 |

**ラベル付与方針:**
- 機能ラベル（`auth`, `ui`, `backend` など）: 該当するものをすべて付与
- 優先度ラベル（`P0` / `P1`）: 必ず1つ付与
- `enhancement` は新機能 Issue に常時付与

## Branch & Commit Convention

```bash
# Branch naming
git checkout -b feature/issue-<number>-<description>

# Commit message format
feat(scope): description (issue-XXX)
fix(scope): description (issue-XXX)
refactor(scope): description (issue-XXX)
```

## Reference Documents

- Requirements: `docs/design/shipping-service-requirements.md`
- UI Design: `docs/design/ui-dashboard-design.md`
- ADRs: `docs/adr/ADR-*.md`
- Implementation Plan: `docs/plan/plan.md`
