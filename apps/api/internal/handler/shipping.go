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

// ListResponse represents the response format for list endpoints
type ListResponse struct {
	Data  interface{} `json:"data"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Size  int         `json:"size"`
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
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve shippings",
		})
		return
	}

	// Return response
	c.JSON(http.StatusOK, ListResponse{
		Data:  shippings,
		Total: total,
		Page:  filter.Page,
		Size:  filter.Size,
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
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Shipping not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve shipping",
		})
		return
	}

	// Return shipping
	c.JSON(http.StatusOK, shipping)
}

// Update handles PUT /shippings/:order_id
func (h *ShippingHandler) Update(c *gin.Context) {
	orderID := c.Param("order_id")

	// Parse request body
	var req service.UpdateShippingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "validation error",
			"errors": []gin.H{
				{"field": "body", "reason": "invalid JSON format"},
			},
		})
		return
	}

	// Update shipping
	shipping, err := h.service.Update(orderID, &req)
	if err != nil {
		// Handle validation errors
		var validationErr *service.ErrValidation
		if errors.As(err, &validationErr) {
			c.JSON(http.StatusBadRequest, validationErr)
			return
		}

		// Handle conflict errors (optimistic locking)
		if errors.Is(err, service.ErrConflict) {
			c.JSON(http.StatusConflict, gin.H{
				"error":   "conflict",
				"message": "データが更新されています。再読み込みしてください。",
			})
			return
		}

		// Handle not found errors
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Shipping not found",
			})
			return
		}

		// Handle other errors
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update shipping",
		})
		return
	}

	// Return updated shipping
	c.JSON(http.StatusOK, shipping)
}

// Summary handles GET /shippings/summary
func (h *ShippingHandler) Summary(c *gin.Context) {
	// Get summary from service
	summary, err := h.service.GetSummary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve summary",
		})
		return
	}

	// Return summary
	c.JSON(http.StatusOK, summary)
}

// Priority handles GET /shippings/priority
func (h *ShippingHandler) Priority(c *gin.Context) {
	// Parse limit parameter
	limit := parseIntQuery(c, "limit", 5)

	// Get priority shippings from service
	shippings, err := h.service.GetPriorityShippings(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve priority shippings",
		})
		return
	}

	// Return shippings array directly
	c.JSON(http.StatusOK, shippings)
}
