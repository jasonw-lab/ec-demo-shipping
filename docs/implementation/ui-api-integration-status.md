# UI-API Integration Implementation Status

**Date:** 2026-01-27
**Status:** ✅ Complete
**Target UI:** apps/admin-square-ui
**Backend:** apps/api

---

## Overview

All required API endpoints for UI-API integration are **already implemented** and tested in the backend. The implementation fully complies with the requirements defined in:

- `docs/design/shipping-service-requirements.md` (v0.2.2)
- `docs/design/ui-api-interface-mapping.md` (v0.2.0)
- `docs/design/ui-dashboard-design.md` (v0.2.2)

---

## Implemented API Endpoints

### 1. Dashboard Summary API ✅

**Endpoint:** `GET /shippings/summary`

**Purpose:** Retrieve status counts for dashboard cards in a single efficient query

**Implementation:**
- File: `apps/api/internal/handler/shipping.go:154-166`
- Service: `apps/api/internal/service/shipping_service.go:234-242`
- Repository: `apps/api/internal/infra/repository/shipping_repository.go:137-157`

**Response Format:**
```json
{
  "created": 12,
  "ready": 5,
  "shipped_today": 8,
  "returned": 1
}
```

**Features:**
- Single SQL query with conditional COUNT for efficiency
- JST timezone handling for `shipped_today` calculation
- Tested in `shipping_repository_test.go`

---

### 2. Shipping List API ✅

**Endpoint:** `GET /shippings`

**Purpose:** Retrieve paginated shipping list with filtering

**Implementation:**
- File: `apps/api/internal/handler/shipping.go:33-59`
- Service: `apps/api/internal/service/shipping_service.go:59-69`
- Repository: `apps/api/internal/infra/repository/shipping_repository.go:48-87`

**Query Parameters:**
- `status` - Filter by status (CREATED, READY, SHIPPED, RETURNED, CANCELLED)
- `carrier` - Filter by carrier (YAMATO, SAGAWA, JAPAN_POST)
- `keyword` - Case-insensitive partial match on order_id or tracking_number
- `page` - Page number (default: 1)
- `size` - Page size (default: 20)

**Response Format:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "size": 20
}
```

**Features:**
- Case-insensitive keyword search
- Pagination with total count
- Ordered by created_at DESC
- Comprehensive test coverage

---

### 3. Shipping Detail API ✅

**Endpoint:** `GET /shippings/:order_id`

**Purpose:** Retrieve detailed shipping information for a specific order

**Implementation:**
- File: `apps/api/internal/handler/shipping.go:77-97`
- Service: `apps/api/internal/service/shipping_service.go:72-74`
- Repository: `apps/api/internal/infra/repository/shipping_repository.go:90-98`

**Response Format:**
```json
{
  "id": 1,
  "order_id": "ORD-001",
  "status": "READY",
  "carrier": "YAMATO",
  "tracking_number": "123456789012",
  "shipping_address": "東京都...",
  "ready_at": "2026-01-27T10:00:00Z",
  "shipped_at": null,
  "delivered_at": null,
  "version": 1,
  "created_at": "2026-01-27T09:00:00Z",
  "updated_at": "2026-01-27T10:00:00Z"
}
```

**Error Handling:**
- 404 Not Found - Shipping not found
- 500 Internal Server Error - Database error

---

### 4. Shipping Update API ✅

**Endpoint:** `PUT /shippings/:order_id`

**Purpose:** Update shipping information with optimistic locking

**Implementation:**
- File: `apps/api/internal/handler/shipping.go:100-151`
- Service: `apps/api/internal/service/shipping_service.go:77-155`
- Repository: `apps/api/internal/infra/repository/shipping_repository.go:106-134`

**Request Body:**
```json
{
  "status": "SHIPPED",
  "carrier": "YAMATO",
  "tracking_number": "123456789012",
  "version": 1
}
```

**Features:**
- **Optimistic Locking:** Version-based conflict detection
- **Status Transition Validation:** Enforces allowed state transitions
- **Tracking Number Validation:** Carrier-specific format validation
  - YAMATO: 12 digits
  - SAGAWA: 12 digits
  - JAPAN_POST: 11-13 alphanumeric
- **Automatic Timestamps:** Sets ready_at, shipped_at, delivered_at based on status

**Error Handling:**
- 400 Bad Request - Validation errors with field-level details
- 404 Not Found - Shipping not found
- 409 Conflict - Version mismatch (optimistic lock failure)
- 500 Internal Server Error - Database error

**409 Conflict Response:**
```json
{
  "error": "conflict",
  "message": "データが更新されています。再読み込みしてください。"
}
```

**400 Validation Error Response:**
```json
{
  "message": "validation error",
  "errors": [
    {
      "field": "tracking_number",
      "reason": "YAMATO tracking number must be 12 digits"
    }
  ]
}
```

---

### 5. Priority Shippings API ✅

**Endpoint:** `GET /shippings/priority`

**Purpose:** Retrieve priority shippings for dashboard alerts

**Implementation:**
- File: `apps/api/internal/handler/shipping.go:169-184`
- Service: `apps/api/internal/service/shipping_service.go:249-258`
- Repository: `apps/api/internal/infra/repository/shipping_repository.go:163-184`

**Query Parameters:**
- `limit` - Maximum number of results (default: 5)

**Priority Rules:**
1. RETURNED (all) - highest priority
2. CREATED (older than 24h) - stale unprocessed
3. READY (oldest first) - waiting for shipment

**Response Format:**
```json
[
  {
    "id": 1,
    "order_id": "ORD-001",
    "status": "RETURNED",
    ...
  }
]
```

---

## Data Model

### Shipping Entity

**File:** `apps/api/internal/domain/shipping.go`

```go
type Shipping struct {
    ID              uint64          `json:"id"`
    OrderID         string          `json:"order_id"`
    Status          string          `json:"status"`
    Carrier         *string         `json:"carrier"`
    TrackingNumber  *string         `json:"tracking_number"`
    ShippingAddress string          `json:"shipping_address"`
    ReadyAt         *time.Time      `json:"ready_at"`
    ShippedAt       *time.Time      `json:"shipped_at"`
    DeliveredAt     *time.Time      `json:"delivered_at"`
    Version         uint64          `json:"version"`
    CreatedAt       time.Time       `json:"created_at"`
    UpdatedAt       time.Time       `json:"updated_at"`
    DeletedAt       *gorm.DeletedAt `json:"deleted_at"`
}
```

### Status Constants

```go
const (
    StatusCreated   = "CREATED"    // 10
    StatusReady     = "READY"      // 20
    StatusShipped   = "SHIPPED"    // 30
    StatusDelivered = "DELIVERED"  // 40
    StatusReturned  = "RETURNED"   // 90
    StatusCancelled = "CANCELLED"  // 99
)
```

### Carrier Constants

```go
const (
    CarrierYamato    = "YAMATO"
    CarrierSagawa    = "SAGAWA"
    CarrierJapanPost = "JAPAN_POST"
)
```

---

## Status Transition Rules

### Allowed Transitions

```
CREATED → READY      (出荷指示)
CREATED → CANCELLED  (キャンセル)
READY → SHIPPED      (出荷完了)
READY → CANCELLED    (出荷前キャンセル)
SHIPPED → DELIVERED  (配送完了)
SHIPPED → RETURNED   (返送)
```

### Validation

**Implementation:** `apps/api/internal/service/shipping_service.go:158-194`

- Enforces allowed transitions only
- Returns validation error for invalid transitions
- No change is allowed (same status is OK)

---

## JSON Naming Convention

**Backend (Go):** snake_case

All JSON responses use snake_case as per Go json tags:
- `order_id`
- `tracking_number`
- `shipping_address`
- `ready_at`
- `shipped_at`
- `delivered_at`
- `created_at`
- `updated_at`

**Frontend (Next.js):** Can use camelCase internally with API client transformation

---

## CORS Configuration

**File:** `apps/api/internal/handler/router.go:15-105`

**Features:**
- Localhost origins automatically allowed (127.0.0.1, ::1, localhost)
- Additional origins via `CORS_ALLOWED_ORIGINS` environment variable
- Preflight request handling (OPTIONS)
- Credentials support
- Request headers echoing

**Environment Variable:**
```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## Test Coverage

### Repository Tests ✅

**File:** `apps/api/internal/infra/repository/shipping_repository_test.go`

- FindAll with no filters
- FindAll with status filter
- FindAll with carrier filter
- FindAll with keyword filter (order_id)
- FindAll with keyword filter (tracking_number)
- FindAll with multiple keyword matches
- FindAll with pagination
- FindAll with combined filters
- GetSummary with data
- GetSummary with empty database

### Kafka Event Handler Tests ✅

**File:** `apps/api/internal/infra/kafka/order_event_handler_test.go`

- HandleOrderPaid for new order
- HandleOrderPaid idempotent behavior
- HandleOrderPaid with invalid JSON
- HandleOrderPaid with missing order_id
- HandleOrderPaid with database error
- HandleOrderPaid with duplicate key (idempotent)
- HandleUnknownEvent
- FormatAddress

### CORS Tests ✅

**File:** `apps/api/internal/handler/router_cors_test.go`

- Allows localhost origin and echoes requested headers
- Does not set CORS headers for disallowed origin

**All tests pass:** ✅

---

## Architecture Compliance

### Standard Go Layout ✅

```
apps/api/
├── cmd/
│   ├── server/          # Main application entry point
│   └── dbinit/          # Database initialization
├── internal/
│   ├── domain/          # Domain entities
│   ├── handler/         # HTTP handlers (Gin)
│   ├── service/         # Business logic
│   ├── infra/
│   │   ├── repository/  # Data access layer (GORM)
│   │   ├── database/    # Database connection
│   │   └── kafka/       # Event handling
│   └── config/          # Configuration
```

### Technology Stack ✅

- **Web Framework:** Gin
- **ORM:** GORM
- **Database:** PostgreSQL (via GORM)
- **Event Streaming:** Kafka (consumer)

### Design Patterns ✅

- Repository Pattern
- Service Layer Pattern
- Dependency Injection
- Optimistic Locking

---

## UI Integration Checklist

### For apps/admin-square-ui

#### Dashboard Page
- [ ] Call `GET /shippings/summary` on page load
- [ ] Display 4 cards: Created, Ready, Shipped Today, Returned
- [ ] Click card to filter list by status

#### Shipping List Page
- [ ] Call `GET /shippings` with filters
- [ ] Implement status filter dropdown
- [ ] Implement carrier filter dropdown
- [ ] Implement keyword search (order_id, tracking_number)
- [ ] Implement pagination
- [ ] Display table with columns: Order ID, Status, Carrier, Tracking, Updated, Action

#### Shipping Detail Sheet
- [ ] Call `GET /shippings/:order_id` when row clicked
- [ ] Display read-only fields: Order ID, Status, Address, Timestamps
- [ ] Display edit form based on status
- [ ] For READY: Show carrier select + tracking number input
- [ ] For SHIPPED/RETURNED: Show carrier + tracking with external link

#### Update Shipping
- [ ] Call `PUT /shippings/:order_id` with version
- [ ] Handle 400 validation errors (display field-level errors)
- [ ] Handle 409 conflict (show toast + reload button)
- [ ] Handle 404 not found (close sheet)
- [ ] Handle 500 server error (show error toast)

#### Error Handling
- [ ] 409 Conflict: Toast with "データが更新されています。再読み込みしてください。"
- [ ] 400 Validation: Display field-level errors in form
- [ ] 404 Not Found: Close sheet or show "not found" message
- [ ] 500 Server Error: Show generic error toast

---

## API Endpoint Summary

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | /shippings/summary | Dashboard counts | ✅ |
| GET | /shippings | List with filters | ✅ |
| GET | /shippings/:order_id | Detail view | ✅ |
| PUT | /shippings/:order_id | Update with lock | ✅ |
| GET | /shippings/priority | Priority alerts | ✅ |
| GET | /health | Health check | ✅ |

---

## Next Steps

### Backend
- ✅ All API endpoints implemented
- ✅ All tests passing
- ✅ Build successful
- ✅ Documentation complete

### Frontend (apps/admin-square-ui)
- Implement API client layer
- Implement dashboard page with summary API
- Implement shipping list page with filters
- Implement shipping detail sheet
- Implement update form with optimistic locking
- Implement error handling (409, 400, 404, 500)
- Add loading states and error boundaries

---

## References

- Requirements: `docs/design/shipping-service-requirements.md` (v0.2.2)
- UI Design: `docs/design/ui-dashboard-design.md` (v0.2.2)
- API Mapping: `docs/design/ui-api-interface-mapping.md` (v0.2.0)
- ADR Backend: `docs/adr/ADR-002-backend-framework-gin-gorm.md`
- ADR UI Strategy: `docs/adr/ADR-006-multi-ui-template.md`

---

**Implementation Status:** ✅ Backend Complete
**Test Status:** ✅ All Tests Passing
**Build Status:** ✅ Successful
**Ready for Frontend Integration:** ✅ Yes
