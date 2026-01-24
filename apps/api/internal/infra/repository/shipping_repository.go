package repository

import (
	"strings"
	"time"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"gorm.io/gorm"
)

// ShippingSummary holds the aggregated counts for dashboard
type ShippingSummary struct {
	Created      int64 `json:"created"`
	Ready        int64 `json:"ready"`
	ShippedToday int64 `json:"shipped_today"`
	Returned     int64 `json:"returned"`
}

// ShippingRepository handles database operations for Shipping
type ShippingRepository interface {
	FindAll(filter *ShippingFilter) ([]domain.Shipping, int64, error)
	FindByOrderID(orderID string) (*domain.Shipping, error)
	Update(shipping *domain.Shipping) error
	GetSummary(todayStart, todayEnd time.Time) (*ShippingSummary, error)
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

// FindByOrderID retrieves a shipping by order ID
func (r *shippingRepository) FindByOrderID(orderID string) (*domain.Shipping, error) {
	var shipping domain.Shipping

	if err := r.db.Where("order_id = ?", orderID).First(&shipping).Error; err != nil {
		return nil, err
	}

	return &shipping, nil
}

// Update updates a shipping record with optimistic locking
func (r *shippingRepository) Update(shipping *domain.Shipping) error {
	// Use optimistic locking: update only if version matches
	result := r.db.Model(&domain.Shipping{}).
		Where("id = ? AND version = ?", shipping.ID, shipping.Version).
		Updates(map[string]interface{}{
			"status":          shipping.Status,
			"carrier":         shipping.Carrier,
			"tracking_number": shipping.TrackingNumber,
			"ready_at":        shipping.ReadyAt,
			"shipped_at":      shipping.ShippedAt,
			"delivered_at":    shipping.DeliveredAt,
			"version":         gorm.Expr("version + 1"),
			"updated_at":      gorm.Expr("NOW()"),
		})

	if result.Error != nil {
		return result.Error
	}

	// Check if any row was updated
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	// Increment version in the object
	shipping.Version++

	return nil
}

// GetSummary retrieves aggregated counts for dashboard with a single efficient query
func (r *shippingRepository) GetSummary(todayStart, todayEnd time.Time) (*ShippingSummary, error) {
	var summary ShippingSummary

	// Use a single query with conditional COUNT to aggregate all stats efficiently
	err := r.db.Model(&domain.Shipping{}).
		Select(`
			COUNT(CASE WHEN status = ? THEN 1 END) as created,
			COUNT(CASE WHEN status = ? THEN 1 END) as ready,
			COUNT(CASE WHEN status IN (?, ?) AND shipped_at >= ? AND shipped_at < ? THEN 1 END) as shipped_today,
			COUNT(CASE WHEN status = ? THEN 1 END) as returned
		`, domain.StatusCreated, domain.StatusReady,
			domain.StatusShipped, domain.StatusDelivered, todayStart, todayEnd,
			domain.StatusReturned).
		Scan(&summary).Error

	if err != nil {
		return nil, err
	}

	return &summary, nil
}
