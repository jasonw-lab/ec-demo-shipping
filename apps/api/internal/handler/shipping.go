package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/service"
	"gorm.io/gorm"
)

// ShippingHandler handles HTTP requests for shipping operations
type ShippingHandler struct {
	service service.ShippingService
}

// NewShippingHandler creates a new ShippingHandler
func NewShippingHandler(service service.ShippingService) *ShippingHandler {
	return &ShippingHandler{service: service}
}

// SuccessResponse represents the standard success response format for Ant Design Pro
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}

// ErrorResponse represents the standard error response format for Ant Design Pro
type ErrorResponse struct {
	Success      bool   `json:"success"`
	ErrorCode    int    `json:"errorCode,omitempty"`
	ErrorMessage string `json:"errorMessage,omitempty"`
}

// ListResponse represents the response format for list endpoints
type ListResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Total   int64       `json:"total"`
	Page    int         `json:"page"`
	Size    int         `json:"size"`
}

// List handles GET /shippings
func (h *ShippingHandler) List(c *gin.Context) {
	// Parse query parameters
	filter := &repository.ShippingFilter{
		Status:  c.Query("status"),
		Carrier: c.Query("carrier"),
		Keyword: c.Query("keyword"),
		Page:    parseIntQuery(c, "page", 1),
		Size:    parseIntQuery(c, "size", 20),
	}

	// Get shippings from service
	shippings, total, err := h.service.ListShippings(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success:      false,
			ErrorCode:    500,
			ErrorMessage: "Failed to retrieve shippings",
		})
		return
	}

	// Return response
	c.JSON(http.StatusOK, ListResponse{
		Success: true,
		Data:    shippings,
		Total:   total,
		Page:    filter.Page,
		Size:    filter.Size,
	})
}

// parseIntQuery parses an integer query parameter with a default value
func parseIntQuery(c *gin.Context, key string, defaultValue int) int {
	valueStr := c.Query(key)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil || value <= 0 {
		return defaultValue
	}

	return value
}

// Get handles GET /shippings/:order_id
func (h *ShippingHandler) Get(c *gin.Context) {
	orderID := c.Param("order_id")

	// Get shipping from service
	shipping, err := h.service.GetByOrderID(orderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Success:      false,
				ErrorCode:    404,
				ErrorMessage: "Shipping not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success:      false,
			ErrorCode:    500,
			ErrorMessage: "Failed to retrieve shipping",
		})
		return
	}

	// Return shipping
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    shipping,
	})
}

// Update handles PUT /shippings/:order_id
func (h *ShippingHandler) Update(c *gin.Context) {
	orderID := c.Param("order_id")

	// Parse request body
	var req service.UpdateShippingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Success:      false,
			ErrorCode:    400,
			ErrorMessage: "invalid JSON format",
		})
		return
	}

	// Update shipping
	shipping, err := h.service.Update(orderID, &req)
	if err != nil {
		// Handle validation errors
		var validationErr *service.ErrValidation
		if errors.As(err, &validationErr) {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Success:      false,
				ErrorCode:    400,
				ErrorMessage: validationErr.Message,
			})
			return
		}

		// Handle conflict errors (optimistic locking)
		if errors.Is(err, service.ErrConflict) {
			c.JSON(http.StatusConflict, ErrorResponse{
				Success:      false,
				ErrorCode:    409,
				ErrorMessage: "データが更新されています。再読み込みしてください。",
			})
			return
		}

		// Handle not found errors
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Success:      false,
				ErrorCode:    404,
				ErrorMessage: "Shipping not found",
			})
			return
		}

		// Handle other errors
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success:      false,
			ErrorCode:    500,
			ErrorMessage: "Failed to update shipping",
		})
		return
	}

	// Return updated shipping
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    shipping,
	})
}

// Summary handles GET /shippings/summary
func (h *ShippingHandler) Summary(c *gin.Context) {
	// Get summary from service
	summary, err := h.service.GetSummary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success:      false,
			ErrorCode:    500,
			ErrorMessage: "Failed to retrieve summary",
		})
		return
	}

	// Return summary
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    summary,
	})
}

// Priority handles GET /shippings/priority
func (h *ShippingHandler) Priority(c *gin.Context) {
	// Parse limit parameter
	limit := parseIntQuery(c, "limit", 5)

	// Get priority shippings from service
	shippings, err := h.service.GetPriorityShippings(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Success:      false,
			ErrorCode:    500,
			ErrorMessage: "Failed to retrieve priority shippings",
		})
		return
	}

	// Return shippings
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    shippings,
	})
}
