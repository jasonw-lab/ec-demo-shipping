package database

import (
	"testing"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestMigrate(t *testing.T) {
	// Create in-memory SQLite database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Run migration
	err = Migrate(db)
	require.NoError(t, err)

	// Verify tables were created
	assert.True(t, db.Migrator().HasTable(&domain.User{}))
	assert.True(t, db.Migrator().HasTable(&domain.Role{}))
	assert.True(t, db.Migrator().HasTable(&domain.Permission{}))
	assert.True(t, db.Migrator().HasTable(&domain.UserRole{}))
	assert.True(t, db.Migrator().HasTable(&domain.RolePermission{}))
	assert.True(t, db.Migrator().HasTable(&domain.Shipping{}))

	// Verify seed data was created
	var roleCount int64
	err = db.Model(&domain.Role{}).Count(&roleCount).Error
	require.NoError(t, err)
	assert.Equal(t, int64(3), roleCount, "Expected 3 roles (admin, operator, viewer)")

	var permCount int64
	err = db.Model(&domain.Permission{}).Count(&permCount).Error
	require.NoError(t, err)
	assert.Equal(t, int64(8), permCount, "Expected 8 permissions")

	var userCount int64
	err = db.Model(&domain.User{}).Count(&userCount).Error
	require.NoError(t, err)
	assert.Equal(t, int64(1), userCount, "Expected 1 admin user")

	// Verify admin user was created
	var adminUser domain.User
	err = db.Where("username = ?", "admin").First(&adminUser).Error
	require.NoError(t, err)
	assert.Equal(t, "admin", adminUser.Username)
	assert.Equal(t, "System Administrator", adminUser.DisplayName)
	assert.True(t, adminUser.IsActive)

	// Verify admin user has admin role
	err = db.Model(&adminUser).Association("Roles").Find(&adminUser.Roles)
	require.NoError(t, err)
	assert.Equal(t, 1, len(adminUser.Roles))
	assert.Equal(t, "admin", adminUser.Roles[0].Code)
}

func TestMigrate_Idempotent(t *testing.T) {
	// Create in-memory SQLite database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Run migration first time
	err = Migrate(db)
	require.NoError(t, err)

	// Run migration second time - should not error
	err = Migrate(db)
	require.NoError(t, err)

	// Verify data wasn't duplicated
	var roleCount int64
	err = db.Model(&domain.Role{}).Count(&roleCount).Error
	require.NoError(t, err)
	assert.Equal(t, int64(3), roleCount, "Expected still only 3 roles after second migration")

	var userCount int64
	err = db.Model(&domain.User{}).Count(&userCount).Error
	require.NoError(t, err)
	assert.Equal(t, int64(1), userCount, "Expected still only 1 user after second migration")
}
