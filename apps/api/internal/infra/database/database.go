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

	// Migrate auth tables first (users, roles, permissions must exist before shippings for FK integrity if needed)
	if err := migrateAuthTables(db); err != nil {
		return err
	}

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

// migrateAuthTables creates auth-related tables
func migrateAuthTables(db *gorm.DB) error {
	log.Println("Migrating auth tables...")

	// Migrate auth tables in order (base tables before junction tables)
	err := db.AutoMigrate(
		&domain.User{},
		&domain.Role{},
		&domain.Permission{},
		&domain.UserRole{},
		&domain.RolePermission{},
	)
	if err != nil {
		log.Printf("Failed to migrate auth tables: %v", err)
		return err
	}

	// Seed default roles and permissions if they don't exist
	if err := seedAuthData(db); err != nil {
		log.Printf("Failed to seed auth data: %v", err)
		return err
	}

	log.Println("Auth tables migration completed")
	return nil
}

// seedAuthData seeds default roles, permissions, and admin user
func seedAuthData(db *gorm.DB) error {
	// Check if roles already exist
	var roleCount int64
	if err := db.Model(&domain.Role{}).Count(&roleCount).Error; err != nil {
		return err
	}
	if roleCount > 0 {
		log.Println("Auth data already seeded, skipping")
		return nil
	}

	log.Println("Seeding default auth data...")

	// Seed permissions
	permissions := []domain.Permission{
		{Code: "shipping:read", Name: "View Shippings", Description: strPtr("View shipping information")},
		{Code: "shipping:create", Name: "Create Shipping", Description: strPtr("Create new shipping records")},
		{Code: "shipping:update", Name: "Update Shipping", Description: strPtr("Update shipping information")},
		{Code: "shipping:delete", Name: "Delete Shipping", Description: strPtr("Delete shipping records")},
		{Code: "user:read", Name: "View Users", Description: strPtr("View user information")},
		{Code: "user:create", Name: "Create User", Description: strPtr("Create new users")},
		{Code: "user:update", Name: "Update User", Description: strPtr("Update user information")},
		{Code: "user:delete", Name: "Delete User", Description: strPtr("Delete users")},
	}

	for _, perm := range permissions {
		if err := db.Create(&perm).Error; err != nil {
			return err
		}
	}

	// Seed roles
	roles := []domain.Role{
		{Code: "admin", Name: "Administrator", Description: strPtr("Full system access")},
		{Code: "operator", Name: "Operator", Description: strPtr("Manage shippings")},
		{Code: "viewer", Name: "Viewer", Description: strPtr("Read-only access")},
	}

	for _, role := range roles {
		if err := db.Create(&role).Error; err != nil {
			return err
		}
	}

	// Assign permissions to roles
	var adminRole domain.Role
	if err := db.Where("code = ?", "admin").First(&adminRole).Error; err != nil {
		return err
	}
	var allPermissions []domain.Permission
	if err := db.Find(&allPermissions).Error; err != nil {
		return err
	}
	// Admin gets all permissions
	if err := db.Model(&adminRole).Association("Permissions").Replace(allPermissions); err != nil {
		return err
	}

	var operatorRole domain.Role
	if err := db.Where("code = ?", "operator").First(&operatorRole).Error; err != nil {
		return err
	}
	var shippingPerms []domain.Permission
	if err := db.Where("code LIKE 'shipping:%'").Find(&shippingPerms).Error; err != nil {
		return err
	}
	// Operator gets all shipping permissions
	if err := db.Model(&operatorRole).Association("Permissions").Replace(shippingPerms); err != nil {
		return err
	}

	var viewerRole domain.Role
	if err := db.Where("code = ?", "viewer").First(&viewerRole).Error; err != nil {
		return err
	}
	var readPerms []domain.Permission
	if err := db.Where("code LIKE '%:read'").Find(&readPerms).Error; err != nil {
		return err
	}
	// Viewer gets read-only permissions
	if err := db.Model(&viewerRole).Association("Permissions").Replace(readPerms); err != nil {
		return err
	}

	// Create default admin user (password: admin123)
	// bcrypt hash of "admin123"
	adminUser := domain.User{
		Username:     "admin",
		PasswordHash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
		DisplayName:  "System Administrator",
		IsActive:     true,
		TenantID:     "default",
	}
	if err := db.Create(&adminUser).Error; err != nil {
		return err
	}

	// Assign admin role to admin user
	if err := db.Model(&adminUser).Association("Roles").Append(&adminRole); err != nil {
		return err
	}

	log.Println("Default auth data seeded: admin user (username: admin, password: admin123)")
	return nil
}

func strPtr(s string) *string {
	return &s
}

func ensureShippingTimestampDefaults(db *gorm.DB) error {
	log.Println("Ensuring shippings.created_at/updated_at defaults...")
	
	// Check database type
	dialector := db.Dialector.Name()
	
	// SQLite doesn't need these fixes - GORM handles timestamps automatically
	if dialector == "sqlite" {
		return nil
	}
	
	// MySQL-specific timestamp fixes
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
