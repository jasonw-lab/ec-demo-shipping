package auth

import (
	"github.com/golang-jwt/jwt/v5"
)

// TokenType represents the type of JWT token
type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

// Claims represents the custom JWT claims for the application
type Claims struct {
	jwt.RegisteredClaims
	UserID      uint64    `json:"user_id"`
	Username    string    `json:"username"`
	DisplayName string    `json:"display_name"`
	TenantID    string    `json:"tenant_id"`
	Roles       []string  `json:"roles"`
	Permissions []string  `json:"permissions"`
	TokenType   TokenType `json:"token_type"`
	FamilyID    string    `json:"family_id,omitempty"` // For refresh token rotation
}

// HasPermission checks if the claims contain a specific permission
func (c *Claims) HasPermission(permission string) bool {
	for _, p := range c.Permissions {
		if p == permission {
			return true
		}
	}
	return false
}

// HasRole checks if the claims contain a specific role
func (c *Claims) HasRole(role string) bool {
	for _, r := range c.Roles {
		if r == role {
			return true
		}
	}
	return false
}

// HasAnyPermission checks if the claims contain any of the specified permissions
func (c *Claims) HasAnyPermission(permissions ...string) bool {
	for _, p := range permissions {
		if c.HasPermission(p) {
			return true
		}
	}
	return false
}

// HasAllPermissions checks if the claims contain all of the specified permissions
func (c *Claims) HasAllPermissions(permissions ...string) bool {
	for _, p := range permissions {
		if !c.HasPermission(p) {
			return false
		}
	}
	return true
}

// UserInfo represents user information returned in login response
type UserInfo struct {
	ID          uint64   `json:"id"`
	Username    string   `json:"username"`
	DisplayName string   `json:"display_name"`
	Email       *string  `json:"email"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
}
