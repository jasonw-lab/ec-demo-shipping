package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/middleware"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/service"
)

// UserHandler handles user management HTTP requests
type UserHandler struct {
	userService *service.UserService
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// List returns a paginated list of users
// GET /api/v1/users
func (h *UserHandler) List(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	keyword := c.Query("keyword")
	role := c.Query("role")

	var isActive *bool
	if isActiveStr := c.Query("is_active"); isActiveStr != "" {
		parsed, err := strconv.ParseBool(isActiveStr)
		if err == nil {
			isActive = &parsed
		}
	}

	req := service.UserListRequest{
		Keyword:  keyword,
		Role:     role,
		IsActive: isActive,
		Page:     page,
		Size:     size,
	}

	result, err := h.userService.ListUsers(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"code":    "INTERNAL_ERROR",
			"message": "Failed to retrieve users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result.Users,
		"total":   result.Total,
		"page":    result.Page,
		"size":    result.Size,
	})
}

// Get returns a single user by ID
// GET /api/v1/users/:id
func (h *UserHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"code":    "INVALID_ID",
			"message": "Invalid user ID",
		})
		return
	}

	user, err := h.userService.GetUser(id)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFoundSvc) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"code":    "NOT_FOUND",
				"message": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"code":    "INTERNAL_ERROR",
			"message": "Failed to retrieve user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// Create creates a new user
// POST /api/v1/users
func (h *UserHandler) Create(c *gin.Context) {
	var req service.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"code":    "VALIDATION_ERROR",
			"message": "Invalid request body",
		})
		return
	}

	user, err := h.userService.CreateUser(req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUsernameExists):
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"code":    "USERNAME_EXISTS",
				"message": "This username is already in use",
			})
		case errors.Is(err, service.ErrInvalidRole):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "INVALID_ROLE",
				"message": "Invalid role specified",
			})
		case errors.Is(err, service.ErrInvalidUsername):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "VALIDATION_ERROR",
				"message": "Username must be 3-50 characters and contain only alphanumeric, hyphen, underscore",
			})
		case errors.Is(err, service.ErrInvalidDisplayName):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "VALIDATION_ERROR",
				"message": "Display name must be 1-100 characters",
			})
		case errors.Is(err, service.ErrInvalidEmail):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "VALIDATION_ERROR",
				"message": "Invalid email format or too long (max 255 characters)",
			})
		case errors.Is(err, service.ErrInvalidPassword):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "VALIDATION_ERROR",
				"message": "Password must be at least 8 characters",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create user",
			})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    user,
	})
}

// Update updates an existing user
// PUT /api/v1/users/:id
func (h *UserHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"code":    "INVALID_ID",
			"message": "Invalid user ID",
		})
		return
	}

	var req service.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"code":    "VALIDATION_ERROR",
			"message": "Invalid request body",
		})
		return
	}

	// Get current user ID from claims
	claims := middleware.GetClaims(c)
	currentUserID := claims.UserID

	user, err := h.userService.UpdateUser(id, req, currentUserID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUserNotFoundSvc):
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"code":    "NOT_FOUND",
				"message": "User not found",
			})
		case errors.Is(err, service.ErrOptimisticLockSvc):
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"code":    "CONFLICT",
				"message": "Data has been modified. Please reload and try again.",
			})
		case errors.Is(err, service.ErrSelfRoleChange):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "SELF_ROLE_CHANGE",
				"message": "Cannot change your own role",
			})
		case errors.Is(err, service.ErrInvalidRole):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "INVALID_ROLE",
				"message": "Invalid role specified",
			})
		case errors.Is(err, service.ErrInvalidDisplayName):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "VALIDATION_ERROR",
				"message": "Display name must be 1-100 characters",
			})
		case errors.Is(err, service.ErrInvalidEmail):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "VALIDATION_ERROR",
				"message": "Invalid email format or too long (max 255 characters)",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update user",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// UpdateStatus updates a user's active status
// PUT /api/v1/users/:id/status
func (h *UserHandler) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"code":    "INVALID_ID",
			"message": "Invalid user ID",
		})
		return
	}

	var req service.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"code":    "VALIDATION_ERROR",
			"message": "Invalid request body",
		})
		return
	}

	// Get current user ID from claims
	claims := middleware.GetClaims(c)
	currentUserID := claims.UserID

	user, err := h.userService.UpdateStatus(id, req, currentUserID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUserNotFoundSvc):
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"code":    "NOT_FOUND",
				"message": "User not found",
			})
		case errors.Is(err, service.ErrOptimisticLockSvc):
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"code":    "CONFLICT",
				"message": "Data has been modified. Please reload and try again.",
			})
		case errors.Is(err, service.ErrSelfDeactivate):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "SELF_DEACTIVATE",
				"message": "Cannot deactivate your own account",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update user status",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// ResetPassword resets a user's password
// PUT /api/v1/users/:id/password
func (h *UserHandler) ResetPassword(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"code":    "INVALID_ID",
			"message": "Invalid user ID",
		})
		return
	}

	var req service.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"code":    "VALIDATION_ERROR",
			"message": "Invalid request body",
		})
		return
	}

	err = h.userService.ResetPassword(id, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUserNotFoundSvc):
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"code":    "NOT_FOUND",
				"message": "User not found",
			})
		case errors.Is(err, service.ErrInvalidPassword):
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"code":    "VALIDATION_ERROR",
				"message": "Password must be at least 8 characters",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"code":    "INTERNAL_ERROR",
				"message": "Failed to reset password",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"message": "Password has been reset",
		},
	})
}
