package kafka

import (
	"encoding/json"
	"errors"
	"log"
	"strings"

	"github.com/go-sql-driver/mysql"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"gorm.io/gorm"
)

const (
	// MySQL error code for duplicate entry
	mysqlDuplicateEntryCode = 1062
)

// OrderEventHandler handles order events from Kafka
type OrderEventHandler struct {
	repo repository.ShippingRepository
}

// NewOrderEventHandler creates a new OrderEventHandler
func NewOrderEventHandler(repo repository.ShippingRepository) *OrderEventHandler {
	return &OrderEventHandler{repo: repo}
}

// Handle processes an order event message
func (h *OrderEventHandler) Handle(message []byte) error {
	// First, parse the base event to determine the type
	var baseEvent OrderEvent
	if err := json.Unmarshal(message, &baseEvent); err != nil {
		log.Printf("[ERROR] Failed to parse event: %v", err)
		return &ValidationError{Message: "invalid JSON format"}
	}

	switch baseEvent.EventType {
	case EventOrderPaid:
		return h.handleOrderPaid(message)
	case EventOrderCancelled:
		log.Printf("[INFO] ORDER_CANCELLED event received for %s (not implemented yet)", baseEvent.OrderID)
		return nil // Phase 2
	default:
		log.Printf("[WARN] Unknown event type: %s", baseEvent.EventType)
		return nil // Ignore unknown events
	}
}

// handleOrderPaid processes ORDER_PAID events
func (h *OrderEventHandler) handleOrderPaid(message []byte) error {
	var event OrderPaidEvent
	if err := json.Unmarshal(message, &event); err != nil {
		log.Printf("[ERROR] Failed to parse ORDER_PAID event: %v", err)
		return &ValidationError{Message: "invalid ORDER_PAID event format"}
	}

	// Validate required fields
	if event.OrderID == "" {
		return &ValidationError{Message: "order_id is required"}
	}

	// Idempotency check: see if shipping already exists
	existing, err := h.repo.FindByOrderID(event.OrderID)
	if err == nil && existing != nil {
		log.Printf("[INFO] Shipping already exists for order %s, skipping (idempotent)", event.OrderID)
		return nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		// Unexpected error - should retry
		log.Printf("[ERROR] Failed to check existing shipping for order %s: %v", event.OrderID, err)
		return err
	}

	// Create new shipping record
	shipping := &domain.Shipping{
		OrderID:         event.OrderID,
		Status:          domain.StatusCreated,
		ShippingAddress: event.Customer.Address.FormatAddress(),
		Version:         1,
	}

	if err := h.repo.Create(shipping); err != nil {
		// Handle duplicate-key error as idempotent success (race condition with concurrent events)
		if isDuplicateKeyError(err) {
			log.Printf("[INFO] Duplicate key for order %s, treating as idempotent success", event.OrderID)
			return nil
		}
		log.Printf("[ERROR] Failed to create shipping for order %s: %v", event.OrderID, err)
		return err
	}

	log.Printf("[INFO] Created shipping for order %s with status %s", event.OrderID, shipping.Status)
	return nil
}

// ValidationError represents a validation error that should not be retried
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// IsValidationError checks if an error is a validation error
func IsValidationError(err error) bool {
	var validationErr *ValidationError
	return errors.As(err, &validationErr)
}

// isDuplicateKeyError checks if an error is a MySQL duplicate key error
func isDuplicateKeyError(err error) bool {
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) {
		return mysqlErr.Number == mysqlDuplicateEntryCode
	}
	// Also check for GORM wrapped error message as fallback
	return strings.Contains(err.Error(), "Duplicate entry") ||
		strings.Contains(err.Error(), "UNIQUE constraint failed")
}
