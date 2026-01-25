package kafka

import (
	"errors"
	"testing"
	"time"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

// MockShippingRepository is a mock implementation of ShippingRepository
type MockShippingRepository struct {
	shippings map[string]*domain.Shipping
	findErr   error
	createErr error
}

func NewMockShippingRepository() *MockShippingRepository {
	return &MockShippingRepository{
		shippings: make(map[string]*domain.Shipping),
	}
}

func (m *MockShippingRepository) FindByOrderID(orderID string) (*domain.Shipping, error) {
	if m.findErr != nil {
		return nil, m.findErr
	}
	if shipping, ok := m.shippings[orderID]; ok {
		return shipping, nil
	}
	return nil, gorm.ErrRecordNotFound
}

func (m *MockShippingRepository) Create(shipping *domain.Shipping) error {
	if m.createErr != nil {
		return m.createErr
	}
	m.shippings[shipping.OrderID] = shipping
	return nil
}

// Implement unused interface methods
func (m *MockShippingRepository) FindAll(filter *repository.ShippingFilter) ([]domain.Shipping, int64, error) {
	return nil, 0, nil
}
func (m *MockShippingRepository) Update(shipping *domain.Shipping) error {
	return nil
}
func (m *MockShippingRepository) GetSummary(start, end time.Time) (*repository.ShippingSummary, error) {
	return nil, nil
}

func TestHandleOrderPaid_NewOrder(t *testing.T) {
	repo := NewMockShippingRepository()
	handler := NewOrderEventHandler(repo)

	message := []byte(`{
		"event_type": "ORDER_PAID",
		"order_id": "ORD-001",
		"paid_at": "2024-01-15T10:00:00Z",
		"customer": {
			"name": "山田太郎",
			"phone": "090-1234-5678",
			"address": {
				"postal_code": "150-0001",
				"prefecture": "東京都",
				"city": "渋谷区",
				"street": "神宮前1-2-3",
				"building": "ABCビル 101"
			}
		},
		"items": []
	}`)

	err := handler.Handle(message)

	assert.NoError(t, err)
	assert.Len(t, repo.shippings, 1)
	assert.Equal(t, "ORD-001", repo.shippings["ORD-001"].OrderID)
	assert.Equal(t, domain.StatusCreated, repo.shippings["ORD-001"].Status)
	assert.Contains(t, repo.shippings["ORD-001"].ShippingAddress, "〒150-0001")
}

func TestHandleOrderPaid_Idempotent(t *testing.T) {
	repo := NewMockShippingRepository()
	// Pre-existing shipping
	repo.shippings["ORD-001"] = &domain.Shipping{
		OrderID: "ORD-001",
		Status:  domain.StatusCreated,
	}

	handler := NewOrderEventHandler(repo)

	message := []byte(`{
		"event_type": "ORDER_PAID",
		"order_id": "ORD-001",
		"customer": {
			"name": "山田太郎",
			"address": {"postal_code": "150-0001", "prefecture": "東京都", "city": "渋谷区", "street": "神宮前1-2-3"}
		}
	}`)

	err := handler.Handle(message)

	assert.NoError(t, err)
	// Should still be only 1 record (not duplicated)
	assert.Len(t, repo.shippings, 1)
}

func TestHandleOrderPaid_InvalidJSON(t *testing.T) {
	repo := NewMockShippingRepository()
	handler := NewOrderEventHandler(repo)

	message := []byte(`invalid json`)

	err := handler.Handle(message)

	assert.Error(t, err)
	assert.True(t, IsValidationError(err))
}

func TestHandleOrderPaid_MissingOrderID(t *testing.T) {
	repo := NewMockShippingRepository()
	handler := NewOrderEventHandler(repo)

	message := []byte(`{
		"event_type": "ORDER_PAID",
		"order_id": "",
		"customer": {
			"name": "山田太郎",
			"address": {"postal_code": "150-0001", "prefecture": "東京都", "city": "渋谷区", "street": "神宮前1-2-3"}
		}
	}`)

	err := handler.Handle(message)

	assert.Error(t, err)
	assert.True(t, IsValidationError(err))
}

func TestHandleOrderPaid_DBError(t *testing.T) {
	repo := NewMockShippingRepository()
	repo.createErr = errors.New("database error")
	handler := NewOrderEventHandler(repo)

	message := []byte(`{
		"event_type": "ORDER_PAID",
		"order_id": "ORD-001",
		"customer": {
			"name": "山田太郎",
			"address": {"postal_code": "150-0001", "prefecture": "東京都", "city": "渋谷区", "street": "神宮前1-2-3"}
		}
	}`)

	err := handler.Handle(message)

	assert.Error(t, err)
	assert.False(t, IsValidationError(err)) // Should be retryable
}

func TestHandleUnknownEvent(t *testing.T) {
	repo := NewMockShippingRepository()
	handler := NewOrderEventHandler(repo)

	message := []byte(`{
		"event_type": "UNKNOWN_EVENT",
		"order_id": "ORD-001"
	}`)

	err := handler.Handle(message)

	// Unknown events should be ignored (no error)
	assert.NoError(t, err)
	assert.Len(t, repo.shippings, 0)
}

func TestFormatAddress(t *testing.T) {
	addr := Address{
		PostalCode: "150-0001",
		Prefecture: "東京都",
		City:       "渋谷区",
		Street:     "神宮前1-2-3",
		Building:   "ABCビル 101",
	}

	formatted := addr.FormatAddress()

	assert.Contains(t, formatted, "〒150-0001")
	assert.Contains(t, formatted, "東京都渋谷区神宮前1-2-3")
	assert.Contains(t, formatted, "ABCビル 101")
}
