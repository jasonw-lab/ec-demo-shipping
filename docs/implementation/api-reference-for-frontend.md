# Shipping Service API Reference for Frontend

**Version:** 1.0.0
**Base URL:** `http://localhost:8080` (development)
**Target UI:** apps/admin-square-ui

---

## Quick Start

### API Client Setup

```typescript
// lib/api/shipping-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const shippingApi = {
  // Dashboard summary
  getSummary: () => fetch(`${API_BASE_URL}/shippings/summary`),

  // List with filters
  getList: (params: {
    status?: string;
    carrier?: string;
    keyword?: string;
    page?: number;
    size?: number;
  }) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null)
    );
    return fetch(`${API_BASE_URL}/shippings?${query}`);
  },

  // Get detail
  getDetail: (orderId: string) =>
    fetch(`${API_BASE_URL}/shippings/${orderId}`),

  // Update
  update: (orderId: string, data: UpdateShippingRequest) =>
    fetch(`${API_BASE_URL}/shippings/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Priority shippings
  getPriority: (limit = 5) =>
    fetch(`${API_BASE_URL}/shippings/priority?limit=${limit}`),
};
```

---

## Endpoints

### 1. Dashboard Summary

**GET** `/shippings/summary`

**Purpose:** Get status counts for dashboard cards

**Response 200:**
```json
{
  "created": 12,
  "ready": 5,
  "shipped_today": 8,
  "returned": 1
}
```

**Usage:**
```typescript
const summary = await shippingApi.getSummary().then(r => r.json());
// Display in dashboard cards
```

---

### 2. List Shippings

**GET** `/shippings`

**Query Parameters:**
- `status` (optional): CREATED | READY | SHIPPED | DELIVERED | RETURNED | CANCELLED
- `carrier` (optional): YAMATO | SAGAWA | JAPAN_POST
- `keyword` (optional): Search in order_id or tracking_number (case-insensitive)
- `page` (optional): Page number (default: 1)
- `size` (optional): Page size (default: 20)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "order_id": "ORD-001",
      "status": "READY",
      "carrier": "YAMATO",
      "tracking_number": "123456789012",
      "shipping_address": "東京都渋谷区...",
      "ready_at": "2026-01-27T10:00:00Z",
      "shipped_at": null,
      "delivered_at": null,
      "version": 1,
      "created_at": "2026-01-27T09:00:00Z",
      "updated_at": "2026-01-27T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 20
}
```

**Usage:**
```typescript
const { data, total, page, size } = await shippingApi.getList({
  status: 'READY',
  page: 1,
  size: 20,
}).then(r => r.json());
```

---

### 3. Get Shipping Detail

**GET** `/shippings/:order_id`

**Path Parameters:**
- `order_id`: Order ID (e.g., "ORD-001")

**Response 200:**
```json
{
  "id": 1,
  "order_id": "ORD-001",
  "status": "READY",
  "carrier": "YAMATO",
  "tracking_number": "123456789012",
  "shipping_address": "東京都渋谷区神南1-1-1\n山田太郎様\n〒150-0041",
  "ready_at": "2026-01-27T10:00:00Z",
  "shipped_at": null,
  "delivered_at": null,
  "version": 1,
  "created_at": "2026-01-27T09:00:00Z",
  "updated_at": "2026-01-27T10:00:00Z"
}
```

**Response 404:**
```json
{
  "error": "Shipping not found"
}
```

**Usage:**
```typescript
try {
  const shipping = await shippingApi.getDetail('ORD-001').then(r => {
    if (!r.ok) throw new Error('Not found');
    return r.json();
  });
} catch (error) {
  // Handle not found
}
```

---

### 4. Update Shipping

**PUT** `/shippings/:order_id`

**Path Parameters:**
- `order_id`: Order ID (e.g., "ORD-001")

**Request Body:**
```json
{
  "status": "SHIPPED",
  "carrier": "YAMATO",
  "tracking_number": "123456789012",
  "version": 1
}
```

**TypeScript Interface:**
```typescript
interface UpdateShippingRequest {
  status: string;
  carrier?: string | null;
  tracking_number?: string | null;
  version: number; // Required for optimistic locking
}
```

**Response 200:** (Updated shipping object)
```json
{
  "id": 1,
  "order_id": "ORD-001",
  "status": "SHIPPED",
  "carrier": "YAMATO",
  "tracking_number": "123456789012",
  "shipping_address": "東京都渋谷区...",
  "ready_at": "2026-01-27T10:00:00Z",
  "shipped_at": "2026-01-27T11:00:00Z",
  "delivered_at": null,
  "version": 2,
  "created_at": "2026-01-27T09:00:00Z",
  "updated_at": "2026-01-27T11:00:00Z"
}
```

**Response 400:** (Validation Error)
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

**Response 409:** (Conflict - Optimistic Lock Failure)
```json
{
  "error": "conflict",
  "message": "データが更新されています。再読み込みしてください。"
}
```

**Response 404:**
```json
{
  "error": "Shipping not found"
}
```

**Usage:**
```typescript
try {
  const updated = await shippingApi.update('ORD-001', {
    status: 'SHIPPED',
    carrier: 'YAMATO',
    tracking_number: '123456789012',
    version: currentVersion,
  }).then(async (r) => {
    if (r.status === 409) {
      // Conflict - show reload toast
      toast({
        title: "データの競合",
        description: "他のユーザーが既に更新しています。",
        action: <Button onClick={reload}>最新情報を読み込む</Button>,
      });
      throw new Error('Conflict');
    }
    if (r.status === 400) {
      // Validation error
      const error = await r.json();
      // Display field-level errors
      throw error;
    }
    if (!r.ok) throw new Error('Update failed');
    return r.json();
  });
} catch (error) {
  // Handle errors
}
```

---

### 5. Priority Shippings

**GET** `/shippings/priority`

**Query Parameters:**
- `limit` (optional): Maximum results (default: 5)

**Purpose:** Get priority shippings for dashboard alerts

**Priority Rules:**
1. RETURNED (all) - highest priority
2. CREATED (older than 24h) - stale unprocessed
3. READY (oldest first) - waiting for shipment

**Response 200:**
```json
[
  {
    "id": 1,
    "order_id": "ORD-001",
    "status": "RETURNED",
    "carrier": "YAMATO",
    "tracking_number": "123456789012",
    "shipping_address": "東京都...",
    "ready_at": "2026-01-26T10:00:00Z",
    "shipped_at": "2026-01-26T15:00:00Z",
    "delivered_at": null,
    "version": 3,
    "created_at": "2026-01-26T09:00:00Z",
    "updated_at": "2026-01-27T10:00:00Z"
  }
]
```

**Usage:**
```typescript
const priorityShippings = await shippingApi.getPriority(5).then(r => r.json());
// Display in dashboard alert section
```

---

## Data Types

### Shipping Object

```typescript
interface Shipping {
  id: number;
  order_id: string;
  status: ShippingStatus;
  carrier: Carrier | null;
  tracking_number: string | null;
  shipping_address: string;
  ready_at: string | null;      // ISO 8601 datetime
  shipped_at: string | null;    // ISO 8601 datetime
  delivered_at: string | null;  // ISO 8601 datetime
  version: number;              // For optimistic locking
  created_at: string;           // ISO 8601 datetime
  updated_at: string;           // ISO 8601 datetime
}
```

### Enums

```typescript
type ShippingStatus =
  | 'CREATED'    // 10
  | 'READY'      // 20
  | 'SHIPPED'    // 30
  | 'DELIVERED'  // 40
  | 'RETURNED'   // 90
  | 'CANCELLED'; // 99

type Carrier =
  | 'YAMATO'
  | 'SAGAWA'
  | 'JAPAN_POST';
```

### Status Transitions

```typescript
const ALLOWED_TRANSITIONS: Record<ShippingStatus, ShippingStatus[]> = {
  CREATED: ['READY', 'CANCELLED'],
  READY: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
};
```

### Tracking Number Validation

```typescript
const TRACKING_PATTERNS: Record<Carrier, RegExp> = {
  YAMATO: /^\d{12}$/,           // 12 digits
  SAGAWA: /^\d{12}$/,           // 12 digits
  JAPAN_POST: /^[A-Za-z0-9]{11,13}$/, // 11-13 alphanumeric
};
```

---

## Error Handling

### Error Response Types

```typescript
// 400 Validation Error
interface ValidationError {
  message: 'validation error';
  errors: Array<{
    field: string;
    reason: string;
  }>;
}

// 409 Conflict
interface ConflictError {
  error: 'conflict';
  message: string;
}

// 404 Not Found
interface NotFoundError {
  error: string;
}

// 500 Server Error
interface ServerError {
  error: string;
}
```

### Error Handling Pattern

```typescript
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json();
  }

  switch (response.status) {
    case 400: {
      const error: ValidationError = await response.json();
      // Display field-level errors in form
      throw error;
    }
    case 404: {
      const error: NotFoundError = await response.json();
      // Close sheet or show not found message
      throw error;
    }
    case 409: {
      const error: ConflictError = await response.json();
      // Show toast with reload button
      toast({
        title: 'データの競合',
        description: error.message,
        action: <Button onClick={reload}>最新情報を読み込む</Button>,
      });
      throw error;
    }
    case 500: {
      const error: ServerError = await response.json();
      // Show generic error toast
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: 'サーバーエラーが発生しました。',
      });
      throw error;
    }
    default:
      throw new Error(`Unexpected status: ${response.status}`);
  }
}
```

---

## Optimistic Locking Pattern

### Why Optimistic Locking?

Multiple users may edit the same shipping simultaneously. Optimistic locking prevents lost updates.

### Implementation

1. **Read:** Get current shipping with version
2. **Edit:** User modifies data
3. **Update:** Send update request with original version
4. **Conflict Detection:** Backend checks if version matches
5. **Handle Conflict:** If version mismatch (409), reload and retry

### Example

```typescript
function ShippingEditForm({ orderId }: { orderId: string }) {
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load shipping
  useEffect(() => {
    loadShipping();
  }, [orderId]);

  async function loadShipping() {
    const data = await shippingApi.getDetail(orderId).then(r => r.json());
    setShipping(data);
  }

  async function handleSubmit(formData: UpdateShippingRequest) {
    if (!shipping) return;

    setIsSubmitting(true);
    try {
      const updated = await shippingApi.update(orderId, {
        ...formData,
        version: shipping.version, // Include current version
      }).then(async (r) => {
        if (r.status === 409) {
          // Conflict - reload and notify user
          toast({
            title: 'データの競合',
            description: '他のユーザーが既に更新しています。',
            action: (
              <Button onClick={loadShipping}>
                最新情報を読み込む
              </Button>
            ),
          });
          throw new Error('Conflict');
        }
        if (!r.ok) throw new Error('Update failed');
        return r.json();
      });

      // Update local state with new version
      setShipping(updated);
      toast({ title: '更新しました' });
    } catch (error) {
      // Error already handled
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

## Tracking Number External Links

### URL Construction (Frontend)

```typescript
function getTrackingUrl(carrier: Carrier, trackingNumber: string): string {
  const urls: Record<Carrier, string> = {
    YAMATO: `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number=${trackingNumber}`,
    SAGAWA: `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${trackingNumber}`,
    JAPAN_POST: `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${trackingNumber}`,
  };
  return urls[carrier];
}

// Usage
<a
  href={getTrackingUrl(shipping.carrier, shipping.tracking_number)}
  target="_blank"
  rel="noopener noreferrer"
>
  {shipping.tracking_number}
</a>
```

---

## CORS Configuration

### Development

Localhost origins are automatically allowed:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`

### Production

Set environment variable:
```bash
CORS_ALLOWED_ORIGINS=https://admin.example.com,https://admin-staging.example.com
```

---

## Testing

### Manual Testing with curl

```bash
# Get summary
curl http://localhost:8080/shippings/summary

# List shippings
curl "http://localhost:8080/shippings?status=READY&page=1&size=10"

# Get detail
curl http://localhost:8080/shippings/ORD-001

# Update shipping
curl -X PUT http://localhost:8080/shippings/ORD-001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SHIPPED",
    "carrier": "YAMATO",
    "tracking_number": "123456789012",
    "version": 1
  }'

# Priority shippings
curl "http://localhost:8080/shippings/priority?limit=5"
```

---

## Best Practices

### 1. Always Include Version in Updates

```typescript
// ✅ Good
await shippingApi.update(orderId, {
  status: 'SHIPPED',
  carrier: 'YAMATO',
  tracking_number: '123456789012',
  version: currentShipping.version, // Always include
});

// ❌ Bad
await shippingApi.update(orderId, {
  status: 'SHIPPED',
  carrier: 'YAMATO',
  tracking_number: '123456789012',
  // Missing version - will fail
});
```

### 2. Handle 409 Conflicts Gracefully

```typescript
// ✅ Good - Provide reload action
if (response.status === 409) {
  toast({
    title: 'データの競合',
    description: '他のユーザーが既に更新しています。',
    action: <Button onClick={reload}>最新情報を読み込む</Button>,
  });
}

// ❌ Bad - Just show error
if (response.status === 409) {
  alert('Conflict error');
}
```

### 3. Validate Before Sending

```typescript
// ✅ Good - Client-side validation
function validateTrackingNumber(carrier: Carrier, number: string): boolean {
  const patterns = {
    YAMATO: /^\d{12}$/,
    SAGAWA: /^\d{12}$/,
    JAPAN_POST: /^[A-Za-z0-9]{11,13}$/,
  };
  return patterns[carrier].test(number);
}

// Validate before API call
if (!validateTrackingNumber(carrier, trackingNumber)) {
  setError('Invalid tracking number format');
  return;
}
```

### 4. Use Dashboard Summary API

```typescript
// ✅ Good - Single API call
const summary = await shippingApi.getSummary().then(r => r.json());

// ❌ Bad - Multiple API calls
const created = await shippingApi.getList({ status: 'CREATED' });
const ready = await shippingApi.getList({ status: 'READY' });
const shipped = await shippingApi.getList({ status: 'SHIPPED' });
const returned = await shippingApi.getList({ status: 'RETURNED' });
```

---

## Environment Variables

```bash
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:8080

# .env (Backend)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=shipping_db
```

---

## Support

For backend issues or questions:
- Check implementation: `apps/api/internal/handler/shipping.go`
- Check tests: `apps/api/internal/infra/repository/shipping_repository_test.go`
- Review requirements: `docs/design/shipping-service-requirements.md`
- Review API mapping: `docs/design/ui-api-interface-mapping.md`

---

**API Version:** 1.0.0
**Last Updated:** 2026-01-27
**Status:** ✅ Production Ready
