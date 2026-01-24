package repository

import (
	"strings"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"gorm.io/gorm"
)

// ShippingRepository handles database operations for Shipping
type ShippingRepository interface {
	FindAll(filter *ShippingFilter) ([]domain.Shipping, int64, error)
}

// ShippingFilter holds filter parameters for listing shippings
type ShippingFilter struct {
	Status  string
	Carrier string
	Keyword string
	Page    int
	Size    int
}

type shippingRepository struct {
	db *gorm.DB
}

// NewShippingRepository creates a new ShippingRepository
func NewShippingRepository(db *gorm.DB) ShippingRepository {
	return &shippingRepository{db: db}
}

// FindAll retrieves shippings with filtering and pagination
func (r *shippingRepository) FindAll(filter *ShippingFilter) ([]domain.Shipping, int64, error) {
	var shippings []domain.Shipping
	var total int64

	query := r.db.Model(&domain.Shipping{})

	// Apply filters
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}

	if filter.Carrier != "" {
		query = query.Where("carrier = ?", filter.Carrier)
	}

	if filter.Keyword != "" {
		// Case-insensitive partial match for order_id and tracking_number
		keyword := "%" + strings.ToLower(filter.Keyword) + "%"
		query = query.Where("LOWER(order_id) LIKE ? OR LOWER(tracking_number) LIKE ?", keyword, keyword)
	}

	// Count total records matching the filters
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (filter.Page - 1) * filter.Size
	query = query.Offset(offset).Limit(filter.Size)

	// Order by created_at DESC (newest first)
	query = query.Order("created_at DESC")

	// Execute query
	if err := query.Find(&shippings).Error; err != nil {
		return nil, 0, err
	}

	return shippings, total, nil
}
