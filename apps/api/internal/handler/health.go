package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthHandler handles health check requests
type HealthHandler struct{}

// NewHealthHandler creates a new HealthHandler
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status string `json:"status"`
}

// Check returns the health status of the service
// @Summary Health check
// @Description Returns the health status of the service
// @Tags health
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
func (h *HealthHandler) Check(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status: "ok",
	})
}
