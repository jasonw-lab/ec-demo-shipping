package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/service"
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
