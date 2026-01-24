package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/service"
	"gorm.io/gorm"
)

// SetupRouter creates and configures the Gin router
func SetupRouter(db *gorm.DB) *gin.Engine {
	router := gin.Default()

	// Health check endpoint
	healthHandler := NewHealthHandler()
	router.GET("/health", healthHandler.Check)

	// Initialize repository, service, and handler layers
	shippingRepo := repository.NewShippingRepository(db)
	shippingService := service.NewShippingService(shippingRepo)
	shippingHandler := NewShippingHandler(shippingService)

	// Shipping endpoints
	router.GET("/shippings", shippingHandler.List)

	// API v1 group (for future use)
	// v1 := router.Group("/api/v1")
	// {
	//     // Additional endpoints will be added here
	// }

	return router
}
