package handler

import (
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/service"
	"gorm.io/gorm"
)

// CORSMiddleware handles CORS headers
func CORSMiddleware() gin.HandlerFunc {
	allowedOrigins := corsAllowedOriginsFromEnv()
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			c.Next()
			return
		}

		parsedOrigin, err := url.Parse(origin)
		if err != nil || parsedOrigin.Scheme == "" || parsedOrigin.Host == "" {
			c.Next()
			return
		}

		originCanonical := parsedOrigin.Scheme + "://" + parsedOrigin.Host
		if corsIsAllowedOrigin(parsedOrigin, originCanonical, allowedOrigins) {
			c.Header("Access-Control-Allow-Origin", originCanonical)
			corsAddVaryHeader(c, "Origin")

			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD")

			if requestedHeaders := c.GetHeader("Access-Control-Request-Headers"); requestedHeaders != "" {
				c.Header("Access-Control-Allow-Headers", requestedHeaders)
				corsAddVaryHeader(c, "Access-Control-Request-Headers")
			} else {
				c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
			}

			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Max-Age", "43200") // 12 hours
		}

		// Handle preflight request
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func corsAllowedOriginsFromEnv() map[string]struct{} {
	allowed := make(map[string]struct{})
	raw := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS"))
	if raw == "" {
		return allowed
	}

	for _, entry := range strings.Split(raw, ",") {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}
		u, err := url.Parse(entry)
		if err != nil || u.Scheme == "" || u.Host == "" {
			continue
		}
		origin := u.Scheme + "://" + u.Host
		allowed[origin] = struct{}{}
	}

	return allowed
}

func corsIsAllowedOrigin(parsedOrigin *url.URL, originCanonical string, allowed map[string]struct{}) bool {
	host := strings.ToLower(parsedOrigin.Hostname())
	if host == "localhost" || host == "127.0.0.1" || host == "::1" {
		return true
	}
	_, ok := allowed[originCanonical]
	return ok
}

func corsAddVaryHeader(c *gin.Context, token string) {
	h := c.Writer.Header()
	existing := h.Get("Vary")
	if existing == "" {
		h.Set("Vary", token)
		return
	}

	for _, part := range strings.Split(existing, ",") {
		if strings.EqualFold(strings.TrimSpace(part), token) {
			return
		}
	}

	h.Set("Vary", existing+", "+token)
}

// SecurityHeadersMiddleware adds security-related HTTP headers
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")
		
		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")
		
		// Enable XSS protection (legacy browsers)
		c.Header("X-XSS-Protection", "1; mode=block")
		
		// Referrer policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Only enable HSTS in production
		if os.Getenv("ENV") == "production" {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		
		c.Next()
	}
}

// SetupRouter creates and configures the Gin router
func SetupRouter(db *gorm.DB) *gin.Engine {
	router := gin.Default()

	// Security headers middleware (applied first)
	router.Use(SecurityHeadersMiddleware())

	// CORS middleware
	router.Use(CORSMiddleware())

	// Health check endpoint
	healthHandler := NewHealthHandler()
	router.GET("/health", healthHandler.Check)

	// Initialize repository, service, and handler layers
	shippingRepo := repository.NewShippingRepository(db)
	shippingService := service.NewShippingService(shippingRepo)
	shippingHandler := NewShippingHandler(shippingService)

	// API v1 group
	v1 := router.Group("/api/v1")
	{
		// Shipping endpoints
		v1.GET("/shipments", shippingHandler.List)
		v1.GET("/shipments/summary", shippingHandler.Summary)   // Summary must be before :order_id
		v1.GET("/shipments/priority", shippingHandler.Priority) // Priority must be before :order_id
		v1.GET("/shipments/:order_id", shippingHandler.Get)
		v1.PUT("/shipments/:order_id", shippingHandler.Update)
	}

	// Legacy endpoints (for backward compatibility)
	router.GET("/shippings", shippingHandler.List)
	router.GET("/shippings/summary", shippingHandler.Summary)
	router.GET("/shippings/priority", shippingHandler.Priority)
	router.GET("/shippings/:order_id", shippingHandler.Get)
	router.PUT("/shippings/:order_id", shippingHandler.Update)

	return router
}
