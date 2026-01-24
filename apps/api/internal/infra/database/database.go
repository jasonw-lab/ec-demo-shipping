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

	err := db.AutoMigrate(
		&domain.Shipping{},
	)
	if err != nil {
		return err
	}

	log.Println("Database migrations completed successfully")
	return nil
}
