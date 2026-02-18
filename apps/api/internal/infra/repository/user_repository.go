package repository

import (
	"time"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"gorm.io/gorm"
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// FindByUsername finds a user by username with roles and permissions preloaded
func (r *UserRepository) FindByUsername(username string) (*domain.User, error) {
	var user domain.User
	err := r.db.
		Preload("Roles.Permissions").
		Where("username = ?", username).
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID finds a user by ID with roles and permissions preloaded
func (r *UserRepository) FindByID(id uint64) (*domain.User, error) {
	var user domain.User
	err := r.db.
		Preload("Roles.Permissions").
		Where("id = ?", id).
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateLastLoginAt updates the last login time for a user
func (r *UserRepository) UpdateLastLoginAt(userID uint64, loginTime time.Time) error {
	return r.db.Model(&domain.User{}).
		Where("id = ?", userID).
		Update("last_login_at", loginTime).Error
}

// Create creates a new user
func (r *UserRepository) Create(user *domain.User) error {
	return r.db.Create(user).Error
}

// Update updates a user
func (r *UserRepository) Update(user *domain.User) error {
	return r.db.Save(user).Error
}

// ExistsByUsername checks if a user with the given username exists
func (r *UserRepository) ExistsByUsername(username string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.User{}).
		Where("username = ?", username).
		Count(&count).Error
	return count > 0, err
}

// CountUsers counts all users
func (r *UserRepository) CountUsers() (int64, error) {
	var count int64
	err := r.db.Model(&domain.User{}).Count(&count).Error
	return count, err
}

// FindRoleByCode finds a role by code
func (r *UserRepository) FindRoleByCode(code string) (*domain.Role, error) {
	var role domain.Role
	err := r.db.
		Preload("Permissions").
		Where("code = ?", code).
		First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// AssignRoleToUser assigns a role to a user
func (r *UserRepository) AssignRoleToUser(userID uint64, roleID uint64) error {
	userRole := domain.UserRole{
		UserID: userID,
		RoleID: roleID,
	}
	return r.db.Create(&userRole).Error
}
