# ec-demo-shipping

Shipping Service (发货管理服务) for ec-demo.

## 概述 (Overview)

本仓库实现了一个**发货管理服务 (Shipping Management Service)**，与现有的 **ec-demo** 系统集成。
其核心目标是将物流业务（仓库作业、发货交接、配送追踪）作为一个独立的微服务进行建模，与订单和支付流程解耦。

本项目旨在提供一个**清晰、实用的参考实现**，展示以下内容：
- 微服务的职责分离
- 事件驱动的集成方式
- 面向运营人员的管理后台设计

## 背景与目的 (Background)

- 为现有的 **ec-demo** 平台扩展专门的发货领域
- 反映包含物理时间和外部物流商参与的真实物流工作流
- 作为**技术展示项目**，演示系统设计与实现能力

相关仓库:
- ec-demo: https://github.com/jasonw-lab/ec-demo

## 架构概览 (Architecture)

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

### 关键架构决策

- **发货与订单分离**
  - Order: 商业交易
  - Shipping: 物理物流过程
- **最终一致性 (Eventual Consistency)**
  - 基于 Kafka 的异步集成
  - 不使用分布式事务 (Seata / Saga)
- **乐观锁 (Optimistic Locking)**
  - 基于 Version 的并发控制
- **标准 Go 项目结构 (Standard Go Layout)**
  - 简单且符合 Go 惯例的结构

详细的决策记录在 `docs/` 下的 ADR 文档中。

## 技术栈 (Tech Stack)

### 后端 (Shipping Service)
- Go
- Gin (HTTP framework)
- GORM (ORM)
- Kafka (event consumption)
- MySQL / PostgreSQL (RDBMS)

### 前端 (Admin Dashboard)
- Next.js (App Router)
- shadcn/ui
- Tailwind CSS
- TanStack Table

## 功能特性 (Features)

- 通过订单事件自动创建发货单
- 发货状态生命周期管理
  - CREATED → READY → SHIPPED → DELIVERED / RETURNED
- 管理后台 (Dashboard)
  - 状态概览卡片
  - 搜索与筛选
  - 发货登记与更新
- 具备明确 UI 反馈的乐观锁机制
- 基于物流商的追踪链接生成

## 仓库结构 (Structure)

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

## 文档 (Documentation)

- 需求文档: `docs/requirements/`
- UI 设计: `docs/ui/`
- 架构决策 (ADR): `docs/adr/`

## 状态 (Status)

- 需求 (Requirements): ✅ 已定稿
- 架构 (Architecture): ✅ 已批准
- 实现 (Implementation): 🚧 进行中

## 说明 (Notes)

本项目优先考虑**清晰性、实用性和可维护性**，而非过度设计。
所有的设计选择都经过刻意权衡并进行了文档记录。
