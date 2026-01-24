package service

import (
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
)

// ShippingService handles business logic for Shipping
type ShippingService interface {
	ListShippings(filter *repository.ShippingFilter) ([]domain.Shipping, int64, error)
}

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
