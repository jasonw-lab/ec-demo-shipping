package middleware

import (
	"crypto/rand"
	"crypto/rsa"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/config"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain/auth"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Auto migrate
	err = db.AutoMigrate(&domain.User{}, &domain.Role{}, &domain.Permission{})
	if err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}

	return db
}

func generateTestRSAKeys(t *testing.T) (*rsa.PrivateKey, *rsa.PublicKey) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	return privateKey, &privateKey.PublicKey
}

func setupTestAuthService(t *testing.T, db *gorm.DB) *service.AuthService {
	privateKey, publicKey := generateTestRSAKeys(t)
	cfg := &config.JWTConfig{
		Issuer:               "test-issuer",
		Audience:             "test-audience",
		AccessTokenDuration:  15,
		RefreshTokenDuration: 7,
	}
	jwtService := service.NewJWTServiceWithKeys(privateKey, publicKey, cfg)
	userRepo := repository.NewUserRepository(db)
	return service.NewAuthService(userRepo, jwtService)
}

func TestAuthMiddleware_NoAuthHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	authService := setupTestAuthService(t, db)

	router := gin.New()
	router.Use(AuthMiddleware(authService))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "UNAUTHORIZED")
	assert.Equal(t, "Bearer", w.Header().Get("WWW-Authenticate"))
}

func TestAuthMiddleware_InvalidAuthHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	authService := setupTestAuthService(t, db)

	router := gin.New()
	router.Use(AuthMiddleware(authService))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Basic invalidtoken")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "UNAUTHORIZED")
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := setupTestDB(t)
	authService := setupTestAuthService(t, db)

	router := gin.New()
	router.Use(AuthMiddleware(authService))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer invalidtoken")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "UNAUTHORIZED")
}

func TestRequirePermission_WithPermission(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		// Mock claims with permission
		claims := &auth.Claims{
			Permissions: []string{"shipping:read", "shipping:update"},
		}
		c.Set("claims", claims)
		c.Next()
	})
	router.Use(RequirePermission("shipping:read"))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRequirePermission_WithoutPermission(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		// Mock claims without required permission
		claims := &auth.Claims{
			Permissions: []string{"shipping:read"},
		}
		c.Set("claims", claims)
		c.Next()
	})
	router.Use(RequirePermission("shipping:update"))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "FORBIDDEN")
}

func TestRequireRole_WithRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		claims := &auth.Claims{
			Roles: []string{"admin", "operator"},
		}
		c.Set("claims", claims)
		c.Next()
	})
	router.Use(RequireRole("admin"))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRequireRole_WithoutRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(func(c *gin.Context) {
		claims := &auth.Claims{
			Roles: []string{"viewer"},
		}
		c.Set("claims", claims)
		c.Next()
	})
	router.Use(RequireRole("admin"))
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "FORBIDDEN")
}

func TestGetClaims(t *testing.T) {
	gin.SetMode(gin.TestMode)

	expectedClaims := &auth.Claims{
		UserID:   1,
		Username: "testuser",
		Roles:    []string{"admin"},
	}

	var actualClaims *auth.Claims

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("claims", expectedClaims)
		c.Next()
	})
	router.GET("/test", func(c *gin.Context) {
		actualClaims = GetClaims(c)
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.NotNil(t, actualClaims)
	assert.Equal(t, expectedClaims.UserID, actualClaims.UserID)
	assert.Equal(t, expectedClaims.Username, actualClaims.Username)
}

func TestGetClaims_NoClaims(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var actualClaims *auth.Claims

	router := gin.New()
	router.GET("/test", func(c *gin.Context) {
		actualClaims = GetClaims(c)
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Nil(t, actualClaims)
}
