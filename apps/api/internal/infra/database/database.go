package database

import (
	"log"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/config"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewDB creates a new database connection
func NewDB(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	db, err := gorm.Open(mysql.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	return db, nil
}

// Migrate runs database migrations
func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Check if shippings table already exists
	if db.Migrator().HasTable(&domain.Shipping{}) {
		log.Println("Shippings table already exists, skipping migration")
		return ensureShippingTimestampDefaults(db)
	}

	err := db.AutoMigrate(
		&domain.Shipping{},
	)
	if err != nil {
		return err
	}

	if err := ensureShippingTimestampDefaults(db); err != nil {
		return err
	}

	log.Println("Database migrations completed successfully")
	return nil
}

func ensureShippingTimestampDefaults(db *gorm.DB) error {
	log.Println("Ensuring shippings.created_at/updated_at defaults...")
	if err := db.Exec(`
		UPDATE shippings
		SET created_at = COALESCE(created_at, NOW(3)),
		    updated_at = COALESCE(updated_at, NOW(3))
		WHERE created_at IS NULL
		   OR updated_at IS NULL
		   OR created_at < '1000-01-01'
		   OR updated_at < '1000-01-01'
	`).Error; err != nil {
		return err
	}

	if err := db.Exec(`
		ALTER TABLE shippings
		MODIFY COLUMN created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
		MODIFY COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
	`).Error; err != nil {
		return err
	}

	return nil
}
