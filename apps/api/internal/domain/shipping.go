package domain

import (
	"time"

	"gorm.io/gorm"
)

// Status constants for shipping
const (
	StatusCreated   = "CREATED"
	StatusReady     = "READY"
	StatusShipped   = "SHIPPED"
	StatusDelivered = "DELIVERED"
	StatusReturned  = "RETURNED"
	StatusCancelled = "CANCELLED"
)

// Status codes for shipping
const (
	StatusCodeCreated   = 10
	StatusCodeReady     = 20
	StatusCodeShipped   = 30
	StatusCodeDelivered = 40
	StatusCodeReturned  = 90
	StatusCodeCancelled = 99
)

// Carrier constants
const (
	CarrierYamato    = "YAMATO"
	CarrierSagawa    = "SAGAWA"
	CarrierJapanPost = "JAPAN_POST"
)

// Shipping represents a shipping record
type Shipping struct {
	ID              uint64          `json:"id" gorm:"primaryKey"`
	OrderID         string          `json:"order_id" gorm:"uniqueIndex:idx_shippings_order_id;type:varchar(50);not null"`
	Status          string          `json:"status" gorm:"type:varchar(20);not null;default:CREATED"`
	Carrier         *string         `json:"carrier,omitempty" gorm:"type:varchar(50)"`
	TrackingNumber  *string         `json:"tracking_number,omitempty" gorm:"type:varchar(100)"`
	ShippingAddress string          `json:"shipping_address" gorm:"type:text"`
	ReadyAt         *time.Time      `json:"ready_at,omitempty"`
	ShippedAt       *time.Time      `json:"shipped_at,omitempty"`
	DeliveredAt     *time.Time      `json:"delivered_at,omitempty"`
	Version         uint64          `json:"version" gorm:"default:1"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
	DeletedAt       *gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// TableName returns the table name for Shipping
func (Shipping) TableName() string {
	return "shippings"
}
