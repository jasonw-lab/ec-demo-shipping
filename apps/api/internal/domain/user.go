package domain

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID           uint64          `json:"id" gorm:"primaryKey"`
	Username     string          `json:"username" gorm:"uniqueIndex;type:varchar(50);not null"`
	PasswordHash string          `json:"-" gorm:"type:varchar(255);not null"`
	DisplayName  string          `json:"display_name" gorm:"type:varchar(100);not null"`
	Email        *string         `json:"email" gorm:"type:varchar(255)"`
	IsActive     bool            `json:"is_active" gorm:"not null;default:true"`
	TenantID     string          `json:"tenant_id" gorm:"type:varchar(50);not null;default:'default'"`
	LastLoginAt  *time.Time      `json:"last_login_at"`
	Version      uint64          `json:"version" gorm:"default:1"`
	CreatedAt    time.Time       `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time       `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt    *gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	Roles        []Role          `json:"roles" gorm:"many2many:user_roles;"`
}

// TableName returns the table name for User
func (User) TableName() string {
	return "users"
}

// GetPermissions returns all permissions for the user based on their roles
func (u *User) GetPermissions() []string {
	permMap := make(map[string]struct{})
	for _, role := range u.Roles {
		for _, perm := range role.Permissions {
			permMap[perm.Code] = struct{}{}
		}
	}
	permissions := make([]string, 0, len(permMap))
	for code := range permMap {
		permissions = append(permissions, code)
	}
	return permissions
}

// GetRoleCodes returns the role codes for the user
func (u *User) GetRoleCodes() []string {
	codes := make([]string, len(u.Roles))
	for i, role := range u.Roles {
		codes[i] = role.Code
	}
	return codes
}

// Role represents a role in the RBAC system
type Role struct {
	ID          uint64       `json:"id" gorm:"primaryKey"`
	Code        string       `json:"code" gorm:"uniqueIndex;type:varchar(30);not null"`
	Name        string       `json:"name" gorm:"type:varchar(100);not null"`
	Description *string      `json:"description" gorm:"type:varchar(255)"`
	CreatedAt   time.Time    `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time    `json:"updated_at" gorm:"autoUpdateTime"`
	Permissions []Permission `json:"permissions" gorm:"many2many:role_permissions;"`
}

// TableName returns the table name for Role
func (Role) TableName() string {
	return "roles"
}

// Permission represents a permission in the RBAC system
type Permission struct {
	ID          uint64    `json:"id" gorm:"primaryKey"`
	Code        string    `json:"code" gorm:"uniqueIndex;type:varchar(50);not null"`
	Name        string    `json:"name" gorm:"type:varchar(100);not null"`
	Description *string   `json:"description" gorm:"type:varchar(255)"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName returns the table name for Permission
func (Permission) TableName() string {
	return "permissions"
}

// UserRole represents the many-to-many relationship between users and roles
type UserRole struct {
	UserID    uint64    `gorm:"primaryKey"`
	RoleID    uint64    `gorm:"primaryKey"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

// TableName returns the table name for UserRole
func (UserRole) TableName() string {
	return "user_roles"
}

// RolePermission represents the many-to-many relationship between roles and permissions
type RolePermission struct {
	RoleID       uint64    `gorm:"primaryKey"`
	PermissionID uint64    `gorm:"primaryKey"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
}

// TableName returns the table name for RolePermission
func (RolePermission) TableName() string {
	return "role_permissions"
}
