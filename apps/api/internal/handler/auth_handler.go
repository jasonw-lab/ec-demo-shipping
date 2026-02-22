package handler

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/config"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain/auth"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/service"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService *service.AuthService
	jwtConfig   *config.JWTConfig
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(authService *service.AuthService, jwtConfig *config.JWTConfig) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		jwtConfig:   jwtConfig,
	}
}

// Login handles user login
// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "BAD_REQUEST",
			"message": "Invalid request body",
		})
		return
	}

	response, refreshToken, err := h.authService.Login(&req)
	if err != nil {
		switch err {
		case service.ErrInvalidCredentials:
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid username or password",
			})
		case service.ErrUserInactive:
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    "UNAUTHORIZED",
				"message": "User account is inactive",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "An error occurred during login",
			})
		}
		return
	}

	// Set refresh token as HttpOnly cookie
	h.setRefreshTokenCookie(c, refreshToken)

	c.JSON(http.StatusOK, response)
}

// Refresh handles token refresh
// POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	// Get refresh token from cookie
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    "UNAUTHORIZED",
			"message": "Refresh token not found",
		})
		return
	}

	response, newRefreshToken, err := h.authService.RefreshToken(refreshToken)
	if err != nil {
		switch err {
		case service.ErrTokenExpired:
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    "TOKEN_EXPIRED",
				"message": "Refresh token has expired",
			})
		case service.ErrUserInactive:
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    "UNAUTHORIZED",
				"message": "User account is inactive",
			})
		case service.ErrUserNotFound:
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    "UNAUTHORIZED",
				"message": "User not found",
			})
		default:
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid refresh token",
			})
		}
		return
	}

	// Set new refresh token as HttpOnly cookie
	h.setRefreshTokenCookie(c, newRefreshToken)

	c.JSON(http.StatusOK, response)
}

// Logout handles user logout
// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// Clear refresh token cookie
	h.clearRefreshTokenCookie(c)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// setRefreshTokenCookie sets the refresh token as an HttpOnly cookie
func (h *AuthHandler) setRefreshTokenCookie(c *gin.Context, refreshToken string) {
	// Determine if we're in development mode
	isDev := strings.ToLower(os.Getenv("GIN_MODE")) != "release"

	sameSite := http.SameSiteStrictMode
	secure := true

	if isDev {
		// Development mode: relax security for local testing
		sameSite = http.SameSiteLaxMode
		secure = false
	}

	// Derive Max-Age from JWT config (refresh token duration in days)
	maxAge := h.jwtConfig.RefreshTokenDuration * 24 * 60 * 60

	c.SetSameSite(sameSite)
	c.SetCookie(
		"refresh_token",
		refreshToken,
		maxAge,
		"/api/v1/auth",
		"",
		secure,
		true, // HttpOnly
	)
}

// clearRefreshTokenCookie clears the refresh token cookie
func (h *AuthHandler) clearRefreshTokenCookie(c *gin.Context) {
	isDev := strings.ToLower(os.Getenv("GIN_MODE")) != "release"

	sameSite := http.SameSiteStrictMode
	secure := true

	if isDev {
		sameSite = http.SameSiteLaxMode
		secure = false
	}

	c.SetSameSite(sameSite)
	c.SetCookie(
		"refresh_token",
		"",
		-1,
		"/api/v1/auth",
		"",
		secure,
		true,
	)
}

// Me returns the current user's information
// GET /api/v1/users/me
func (h *AuthHandler) Me(c *gin.Context) {
	// Get claims from context (set by auth middleware)
	claimsVal, exists := c.Get("claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    "UNAUTHORIZED",
			"message": "Authentication required",
		})
		return
	}

	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "INTERNAL_ERROR",
			"message": "Invalid claims",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           claims.UserID,
		"username":     claims.Username,
		"display_name": claims.DisplayName,
		"tenant_id":    claims.TenantID,
		"roles":        claims.Roles,
		"permissions":  claims.Permissions,
	})
}

// UpdateMeRequest represents the request to update profile
type UpdateMeRequest struct {
	DisplayName string `json:"display_name" binding:"required,max=100"`
	Email       string `json:"email" binding:"omitempty,email,max=255"`
	Version     int    `json:"version" binding:"required"`
}

// UpdateMe updates the current user's profile
// PUT /api/v1/users/me
func (h *AuthHandler) UpdateMe(c *gin.Context) {
	// Get claims from context
	claimsVal, exists := c.Get("claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    "UNAUTHORIZED",
			"message": "Authentication required",
		})
		return
	}

	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "INTERNAL_ERROR",
			"message": "Invalid claims",
		})
		return
	}

	var req UpdateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "BAD_REQUEST",
			"message": "Invalid request body",
		})
		return
	}

	// Update user profile
	user, err := h.authService.UpdateProfile(claims.UserID, req.DisplayName, req.Email, req.Version)
	if err != nil {
		switch err {
		case service.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{
				"code":    "NOT_FOUND",
				"message": "User not found",
			})
		case service.ErrVersionConflict:
			c.JSON(http.StatusConflict, gin.H{
				"code":    "CONFLICT",
				"message": "Data has been modified. Please reload.",
			})
		case service.ErrEmailDuplicate:
			c.JSON(http.StatusConflict, gin.H{
				"code":    "CONFLICT",
				"message": "Email already in use",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update profile",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// ChangePasswordRequest represents the request to change password
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// ChangePassword changes the current user's password
// PUT /api/v1/users/me/password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	// Get claims from context
	claimsVal, exists := c.Get("claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    "UNAUTHORIZED",
			"message": "Authentication required",
		})
		return
	}

	claims, ok := claimsVal.(*auth.Claims)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "INTERNAL_ERROR",
			"message": "Invalid claims",
		})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "BAD_REQUEST",
			"message": "Invalid request body",
		})
		return
	}

	// Change password
	err := h.authService.ChangePassword(claims.UserID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		switch err {
		case service.ErrInvalidCredentials:
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Current password is incorrect",
			})
		case service.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{
				"code":    "NOT_FOUND",
				"message": "User not found",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to change password",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"message": "Password changed successfully",
		},
	})
}
