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
