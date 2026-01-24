package handler

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRouter creates and configures the Gin router
func SetupRouter(db *gorm.DB) *gin.Engine {
	router := gin.Default()

	// Health check endpoint
	healthHandler := NewHealthHandler()
	router.GET("/health", healthHandler.Check)

	// API v1 group (for future use)
	// v1 := router.Group("/api/v1")
	// {
	//     // Shipping endpoints will be added here
	// }

	return router
}
