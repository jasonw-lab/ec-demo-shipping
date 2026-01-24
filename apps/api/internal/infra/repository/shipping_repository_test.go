package repository

import (
	"testing"
	"time"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}

	err = db.AutoMigrate(&domain.Shipping{})
	if err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}

	return db
}

func seedTestData(t *testing.T, db *gorm.DB) {
	yamato := domain.CarrierYamato
	sagawa := domain.CarrierSagawa
	tracking1 := "YMT-12345"
	tracking2 := "SGW-67890"

	shippings := []domain.Shipping{
		{
			OrderID:         "ORD-001",
			Status:          domain.StatusCreated,
			ShippingAddress: "Tokyo, Japan",
			CreatedAt:       time.Now().Add(-3 * time.Hour),
			UpdatedAt:       time.Now().Add(-3 * time.Hour),
		},
		{
			OrderID:         "ORD-002",
			Status:          domain.StatusReady,
			Carrier:         &yamato,
			TrackingNumber:  &tracking1,
			ShippingAddress: "Osaka, Japan",
			CreatedAt:       time.Now().Add(-2 * time.Hour),
			UpdatedAt:       time.Now().Add(-2 * time.Hour),
		},
		{
			OrderID:         "ORD-003",
			Status:          domain.StatusShipped,
			Carrier:         &sagawa,
			TrackingNumber:  &tracking2,
			ShippingAddress: "Kyoto, Japan",
			CreatedAt:       time.Now().Add(-1 * time.Hour),
			UpdatedAt:       time.Now().Add(-1 * time.Hour),
		},
	}

	for _, shipping := range shippings {
		if err := db.Create(&shipping).Error; err != nil {
			t.Fatalf("Failed to seed data: %v", err)
		}
	}
}

func TestShippingRepository_FindAll_NoFilters(t *testing.T) {
	db := setupTestDB(t)
	seedTestData(t, db)
	repo := NewShippingRepository(db)

	filter := &ShippingFilter{
		Page: 1,
		Size: 20,
	}

	shippings, total, err := repo.FindAll(filter)

	assert.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, shippings, 3)
	// Should be ordered by created_at DESC (newest first)
	assert.Equal(t, "ORD-003", shippings[0].OrderID)
	assert.Equal(t, "ORD-002", shippings[1].OrderID)
	assert.Equal(t, "ORD-001", shippings[2].OrderID)
}

func TestShippingRepository_FindAll_FilterByStatus(t *testing.T) {
	db := setupTestDB(t)
	seedTestData(t, db)
	repo := NewShippingRepository(db)

	filter := &ShippingFilter{
		Status: domain.StatusReady,
		Page:   1,
		Size:   20,
	}

	shippings, total, err := repo.FindAll(filter)

	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, shippings, 1)
	assert.Equal(t, "ORD-002", shippings[0].OrderID)
	assert.Equal(t, domain.StatusReady, shippings[0].Status)
}

func TestShippingRepository_FindAll_FilterByCarrier(t *testing.T) {
	db := setupTestDB(t)
	seedTestData(t, db)
	repo := NewShippingRepository(db)

	filter := &ShippingFilter{
		Carrier: domain.CarrierYamato,
		Page:    1,
		Size:    20,
	}

	shippings, total, err := repo.FindAll(filter)

	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, shippings, 1)
	assert.Equal(t, "ORD-002", shippings[0].OrderID)
}

func TestShippingRepository_FindAll_FilterByKeyword_OrderID(t *testing.T) {
	db := setupTestDB(t)
	seedTestData(t, db)
	repo := NewShippingRepository(db)

	filter := &ShippingFilter{
		Keyword: "ord-002", // Case insensitive
		Page:    1,
		Size:    20,
	}

	shippings, total, err := repo.FindAll(filter)

	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, shippings, 1)
	assert.Equal(t, "ORD-002", shippings[0].OrderID)
}

func TestShippingRepository_FindAll_FilterByKeyword_TrackingNumber(t *testing.T) {
	db := setupTestDB(t)
	seedTestData(t, db)
	repo := NewShippingRepository(db)

	filter := &ShippingFilter{
		Keyword: "YMT", // Partial match
		Page:    1,
		Size:    20,
	}

	shippings, total, err := repo.FindAll(filter)

	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, shippings, 1)
	assert.Equal(t, "ORD-002", shippings[0].OrderID)
}

func TestShippingRepository_FindAll_FilterByKeyword_MultipleMatches(t *testing.T) {
	db := setupTestDB(t)
	seedTestData(t, db)
	repo := NewShippingRepository(db)

	filter := &ShippingFilter{
		Keyword: "ORD", // Should match all order IDs
		Page:    1,
		Size:    20,
	}

	shippings, total, err := repo.FindAll(filter)

	assert.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, shippings, 3)
}

func TestShippingRepository_FindAll_Pagination(t *testing.T) {
	db := setupTestDB(t)
	seedTestData(t, db)
	repo := NewShippingRepository(db)

	// Page 1 with size 2
	filter := &ShippingFilter{
		Page: 1,
		Size: 2,
	}

	shippings, total, err := repo.FindAll(filter)

	assert.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, shippings, 2)
	assert.Equal(t, "ORD-003", shippings[0].OrderID)
	assert.Equal(t, "ORD-002", shippings[1].OrderID)

	// Page 2 with size 2
	filter.Page = 2
	shippings, total, err = repo.FindAll(filter)

	assert.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, shippings, 1)
	assert.Equal(t, "ORD-001", shippings[0].OrderID)
}

func TestShippingRepository_FindAll_CombinedFilters(t *testing.T) {
	db := setupTestDB(t)
	seedTestData(t, db)
	repo := NewShippingRepository(db)

	filter := &ShippingFilter{
		Status:  domain.StatusShipped,
		Carrier: domain.CarrierSagawa,
		Page:    1,
		Size:    20,
	}

	shippings, total, err := repo.FindAll(filter)

	assert.NoError(t, err)
	assert.Equal(t, int64(1), total)
	assert.Len(t, shippings, 1)
	assert.Equal(t, "ORD-003", shippings[0].OrderID)
}
