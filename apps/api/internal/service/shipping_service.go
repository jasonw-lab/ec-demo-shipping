package service

import (
	"errors"
	"fmt"
	"regexp"
	"time"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
)

// ShippingService handles business logic for Shipping
type ShippingService interface {
	ListShippings(filter *repository.ShippingFilter) ([]domain.Shipping, int64, error)
	GetByOrderID(orderID string) (*domain.Shipping, error)
	Update(orderID string, req *UpdateShippingRequest) (*domain.Shipping, error)
	GetSummary() (*repository.ShippingSummary, error)
	GetPriorityShippings(limit int) ([]domain.Shipping, error)
}

// UpdateShippingRequest represents the request body for updating a shipping
type UpdateShippingRequest struct {
	Status         string  `json:"status"`
	Carrier        *string `json:"carrier"`
	TrackingNumber *string `json:"tracking_number"`
	Version        uint64  `json:"version"`
}

// ValidationError represents a validation error
type ValidationError struct {
	Field  string `json:"field"`
	Reason string `json:"reason"`
}

// ErrValidation represents validation errors
type ErrValidation struct {
	Message string            `json:"message"`
	Errors  []ValidationError `json:"errors"`
}

func (e *ErrValidation) Error() string {
	return e.Message
}

// ErrConflict represents a version conflict error
var ErrConflict = errors.New("version conflict")

type shippingService struct {
	repo repository.ShippingRepository
}

// NewShippingService creates a new ShippingService
func NewShippingService(repo repository.ShippingRepository) ShippingService {
	return &shippingService{repo: repo}
}

// ListShippings retrieves a list of shippings with filtering and pagination
func (s *shippingService) ListShippings(filter *repository.ShippingFilter) ([]domain.Shipping, int64, error) {
	// Set default pagination values if not provided
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Size <= 0 {
		filter.Size = 20
	}

	return s.repo.FindAll(filter)
}

// GetByOrderID retrieves a shipping by order ID
func (s *shippingService) GetByOrderID(orderID string) (*domain.Shipping, error) {
	return s.repo.FindByOrderID(orderID)
}

// Update updates a shipping with validation and optimistic locking
func (s *shippingService) Update(orderID string, req *UpdateShippingRequest) (*domain.Shipping, error) {
	// Get current shipping
	shipping, err := s.repo.FindByOrderID(orderID)
	if err != nil {
		return nil, err
	}

	// Check version for optimistic locking
	if shipping.Version != req.Version {
		return nil, ErrConflict
	}

	// Validate status transition
	if err := s.validateStatusTransition(shipping.Status, req.Status); err != nil {
		return nil, err
	}

	// Validate tracking number if carrier is provided
	if req.Carrier != nil && *req.Carrier != "" {
		if req.TrackingNumber == nil || *req.TrackingNumber == "" {
			return nil, &ErrValidation{
				Message: "validation error",
				Errors: []ValidationError{
					{Field: "tracking_number", Reason: "required when carrier is provided"},
				},
			}
		}
		if err := s.validateTrackingNumber(*req.Carrier, *req.TrackingNumber); err != nil {
			return nil, err
		}
	}

	// Update shipping fields
	now := time.Now()
	shipping.Status = req.Status
	shipping.Carrier = req.Carrier
	shipping.TrackingNumber = req.TrackingNumber

	// Set timestamp based on status
	switch req.Status {
	case domain.StatusReady:
		if shipping.ReadyAt == nil {
			shipping.ReadyAt = &now
		}
	case domain.StatusShipped:
		if shipping.ShippedAt == nil {
			shipping.ShippedAt = &now
		}
		// Validate carrier and tracking number for SHIPPED status
		if shipping.Carrier == nil || *shipping.Carrier == "" {
			return nil, &ErrValidation{
				Message: "validation error",
				Errors: []ValidationError{
					{Field: "carrier", Reason: "required for SHIPPED status"},
				},
			}
		}
		if shipping.TrackingNumber == nil || *shipping.TrackingNumber == "" {
			return nil, &ErrValidation{
				Message: "validation error",
				Errors: []ValidationError{
					{Field: "tracking_number", Reason: "required for SHIPPED status"},
				},
			}
		}
	case domain.StatusDelivered:
		if shipping.DeliveredAt == nil {
			shipping.DeliveredAt = &now
		}
	}

	// Update in repository
	if err := s.repo.Update(shipping); err != nil {
		return nil, err
	}

	// Fetch updated record to return latest data
	return s.repo.FindByOrderID(orderID)
}

// validateStatusTransition checks if the status transition is allowed
func (s *shippingService) validateStatusTransition(currentStatus, newStatus string) error {
	// No change is allowed
	if currentStatus == newStatus {
		return nil
	}

	// Define allowed transitions
	allowedTransitions := map[string][]string{
		domain.StatusCreated: {domain.StatusReady, domain.StatusCancelled},
		domain.StatusReady:   {domain.StatusShipped, domain.StatusCancelled},
		domain.StatusShipped: {domain.StatusDelivered, domain.StatusReturned},
	}

	// Check if transition is allowed
	allowed, exists := allowedTransitions[currentStatus]
	if !exists {
		return &ErrValidation{
			Message: "validation error",
			Errors: []ValidationError{
				{Field: "status", Reason: fmt.Sprintf("no transitions allowed from %s", currentStatus)},
			},
		}
	}

	for _, allowedStatus := range allowed {
		if newStatus == allowedStatus {
			return nil
		}
	}

	return &ErrValidation{
		Message: "validation error",
		Errors: []ValidationError{
			{Field: "status", Reason: fmt.Sprintf("transition from %s to %s is not allowed", currentStatus, newStatus)},
		},
	}
}

// validateTrackingNumber validates tracking number format based on carrier
func (s *shippingService) validateTrackingNumber(carrier, trackingNumber string) error {
	var pattern string
	var message string

	switch carrier {
	case domain.CarrierYamato:
		pattern = `^\d{12}$`
		message = "YAMATO tracking number must be 12 digits"
	case domain.CarrierSagawa:
		pattern = `^\d{12}$`
		message = "SAGAWA tracking number must be 12 digits"
	case domain.CarrierJapanPost:
		pattern = `^[A-Za-z0-9]{11,13}$`
		message = "JAPAN_POST tracking number must be 11-13 alphanumeric characters"
	default:
		// Unknown carrier, skip validation
		return nil
	}

	matched, err := regexp.MatchString(pattern, trackingNumber)
	if err != nil {
		return err
	}

	if !matched {
		return &ErrValidation{
			Message: "validation error",
			Errors: []ValidationError{
				{Field: "tracking_number", Reason: message},
			},
		}
	}

	return nil
}

// GetSummary retrieves dashboard summary with JST date boundary for shipped_today
func (s *shippingService) GetSummary() (*repository.ShippingSummary, error) {
	// Calculate JST today's start and end times
	jst := time.FixedZone("JST", 9*60*60)
	now := time.Now().In(jst)
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, jst)
	todayEnd := todayStart.AddDate(0, 0, 1)

	return s.repo.GetSummary(todayStart, todayEnd)
}

// GetPriorityShippings retrieves priority shipments requiring attention
func (s *shippingService) GetPriorityShippings(limit int) ([]domain.Shipping, error) {
	// Set default limit if not provided
	if limit <= 0 {
		limit = 5
	}

	return s.repo.FindPriority(limit)
}

