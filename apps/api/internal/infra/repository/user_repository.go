package repository

import (
	"errors"
	"time"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"gorm.io/gorm"
)

// ErrOptimisticLock is returned when optimistic locking fails
var ErrOptimisticLock = errors.New("optimistic lock conflict: record has been modified")

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

// FindByID finds a user by ID with roles and permissions　 preloaded
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

// UserFilter represents filter options for user queries
type UserFilter struct {
	Keyword  string
	Role     string
	IsActive *bool
}

// FindAll finds users with pagination and filters
func (r *UserRepository) FindAll(filter UserFilter, page, size int) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	query := r.db.Model(&domain.User{})

	// Exclude service role users
	query = query.Where("id NOT IN (SELECT user_id FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE code = 'service'))")

	// Apply keyword filter (display_name or email)
	if filter.Keyword != "" {
		keyword := "%" + filter.Keyword + "%"
		query = query.Where("display_name LIKE ? OR email LIKE ?", keyword, keyword)
	}

	// Apply role filter
	if filter.Role != "" {
		query = query.Where("id IN (SELECT user_id FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE code = ?))", filter.Role)
	}

	// Apply is_active filter
	if filter.IsActive != nil {
		query = query.Where("is_active = ?", *filter.IsActive)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results with roles preloaded
	offset := (page - 1) * size
	if err := query.
		Preload("Roles").
		Order("id ASC").
		Offset(offset).
		Limit(size).
		Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// UpdateWithVersion updates a user with optimistic locking
func (r *UserRepository) UpdateWithVersion(user *domain.User, expectedVersion uint64) error {
	result := r.db.Model(&domain.User{}).
		Where("id = ? AND version = ?", user.ID, expectedVersion).
		Updates(map[string]interface{}{
			"display_name": user.DisplayName,
			"email":        user.Email,
			"is_active":    user.IsActive,
			"version":      expectedVersion + 1,
			"updated_at":   time.Now(),
		})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrOptimisticLock
	}

	user.Version = expectedVersion + 1
	return nil
}

// UpdatePasswordHash updates a user's password hash
func (r *UserRepository) UpdatePasswordHash(userID uint64, passwordHash string) error {
	return r.db.Model(&domain.User{}).
		Where("id = ?", userID).
		Update("password_hash", passwordHash).Error
}

// RemoveAllUserRoles removes all roles from a user
func (r *UserRepository) RemoveAllUserRoles(userID uint64) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.UserRole{}).Error
}
