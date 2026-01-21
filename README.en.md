# ec-demo-shipping

Shipping Service (発送管理サービス) for ec-demo.

## Overview

This repository implements a **Shipping Management Service** that integrates with the existing **ec-demo** system.
It focuses on modeling real-world logistics operations (warehouse work, shipment handoff, delivery tracking) as a
separate microservice, decoupled from order and payment flows.

The goal is to provide a **clear, practical reference implementation** of:
- Microservice responsibility separation
- Event-driven integration
- Admin dashboard design for operational users

## Background & Purpose

- Extend the existing **ec-demo** platform with a dedicated Shipping domain
- Reflect real logistics workflows that involve physical time and external carriers
- Serve as a **technical portfolio project** demonstrating system design and implementation skills

Related repository:
- ec-demo: https://github.com/jasonw-lab/ec-demo

## Architecture Overview

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

### Key Architectural Decisions

- **Shipping separated from Order**
  - Order: commercial transaction
  - Shipping: physical logistics process
- **Eventual Consistency**
  - Kafka-based asynchronous integration
  - No distributed transaction (Seata / Saga not used)
- **Optimistic Locking**
  - Version-based concurrency control
- **Standard Go Project Layout**
  - Simple and idiomatic structure

Detailed decisions are documented in ADRs under `docs/`.

## Tech Stack

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

## Features

- Shipping record creation via Order events
- Shipping status lifecycle management
  - CREATED → READY → SHIPPED → DELIVERED / RETURNED
- Admin dashboard
  - Status summary cards
  - Search & filter
  - Shipment registration and update
- Optimistic locking with clear UI feedback
- Carrier-based tracking link generation

## Repository Structure

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

## Documentation

- Requirements: `docs/requirements/`
- UI Design: `docs/ui/`
- Architecture Decisions (ADR): `docs/adr/`

## Status

- Requirements: ✅ Finalized
- Architecture: ✅ Approved
- Implementation: 🚧 In Progress

## Notes

This project prioritizes **clarity, pragmatism, and maintainability** over over-engineering.
Design choices are intentionally documented to make trade-offs explicit.
