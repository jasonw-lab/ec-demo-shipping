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
