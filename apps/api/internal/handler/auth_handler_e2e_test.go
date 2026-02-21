package handler

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/config"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/middleware"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// E2E Test Setup

func setupE2ETestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrate all required tables
	err = db.AutoMigrate(
		&domain.User{},
		&domain.Role{},
		&domain.Permission{},
		&domain.UserRole{},
		&domain.RolePermission{},
		&domain.Shipping{},
	)
	require.NoError(t, err)

	return db
}

func setupE2ETestData(t *testing.T, db *gorm.DB) {
	// Create permissions
	permissions := []domain.Permission{
		{ID: 1, Code: "shipping:create", Name: "Create Shipping"},
		{ID: 2, Code: "shipping:read", Name: "Read Shipping"},
		{ID: 3, Code: "shipping:update", Name: "Update Shipping"},
		{ID: 4, Code: "shipping:delete", Name: "Delete Shipping"},
		{ID: 5, Code: "user:create", Name: "Create User"},
		{ID: 6, Code: "user:read", Name: "Read User"},
		{ID: 7, Code: "user:update", Name: "Update User"},
		{ID: 8, Code: "user:delete", Name: "Delete User"},
	}
	for _, p := range permissions {
		require.NoError(t, db.Create(&p).Error)
	}

	// Create roles
	roles := []domain.Role{
		{ID: 1, Code: "admin", Name: "Administrator"},
		{ID: 2, Code: "operator", Name: "Operator"},
		{ID: 3, Code: "viewer", Name: "Viewer"},
	}
	for _, r := range roles {
		require.NoError(t, db.Create(&r).Error)
	}

	// Assign permissions to roles
	// admin: all permissions
	for i := 1; i <= 8; i++ {
		require.NoError(t, db.Create(&domain.RolePermission{RoleID: 1, PermissionID: uint64(i)}).Error)
	}
	// operator: shipping:read, shipping:update
	require.NoError(t, db.Create(&domain.RolePermission{RoleID: 2, PermissionID: 2}).Error)
	require.NoError(t, db.Create(&domain.RolePermission{RoleID: 2, PermissionID: 3}).Error)
	// viewer: shipping:read
	require.NoError(t, db.Create(&domain.RolePermission{RoleID: 3, PermissionID: 2}).Error)

	// Create users with hashed passwords
	// All passwords are "password123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	users := []domain.User{
		{ID: 1, Username: "admin", PasswordHash: string(hashedPassword), DisplayName: "Admin User", IsActive: true, TenantID: "default"},
		{ID: 2, Username: "operator", PasswordHash: string(hashedPassword), DisplayName: "Operator User", IsActive: true, TenantID: "default"},
		{ID: 3, Username: "viewer", PasswordHash: string(hashedPassword), DisplayName: "Viewer User", IsActive: true, TenantID: "default"},
		{ID: 4, Username: "inactive", PasswordHash: string(hashedPassword), DisplayName: "Inactive User", IsActive: true, TenantID: "default"},
	}
	for _, u := range users {
		require.NoError(t, db.Create(&u).Error)
	}

	// Explicitly set inactive user's is_active to false (GORM doesn't save false as zero value)
	require.NoError(t, db.Model(&domain.User{}).Where("id = ?", 4).Update("is_active", false).Error)

	// Assign roles to users
	require.NoError(t, db.Create(&domain.UserRole{UserID: 1, RoleID: 1}).Error) // admin -> admin role
	require.NoError(t, db.Create(&domain.UserRole{UserID: 2, RoleID: 2}).Error) // operator -> operator role
	require.NoError(t, db.Create(&domain.UserRole{UserID: 3, RoleID: 3}).Error) // viewer -> viewer role
	require.NoError(t, db.Create(&domain.UserRole{UserID: 4, RoleID: 3}).Error) // inactive -> viewer role

	// Create some shipping data
	shippings := []domain.Shipping{
		{ID: 1, OrderID: "ORD-001", Status: "CREATED", ShippingAddress: "Tokyo, Japan"},
		{ID: 2, OrderID: "ORD-002", Status: "READY", ShippingAddress: "Osaka, Japan"},
		{ID: 3, OrderID: "ORD-003", Status: "SHIPPED", ShippingAddress: "Kyoto, Japan"},
	}
	for _, s := range shippings {
		require.NoError(t, db.Create(&s).Error)
	}
}

func generateE2ETestRSAKeys(t *testing.T) (*rsa.PrivateKey, *rsa.PublicKey) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	return privateKey, &privateKey.PublicKey
}

func setupE2ERouter(t *testing.T, db *gorm.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)

	privateKey, publicKey := generateE2ETestRSAKeys(t)

	// Initialize services
	userRepo := repository.NewUserRepository(db)
	shippingRepo := repository.NewShippingRepository(db)

	jwtCfg := &config.JWTConfig{
		Issuer:               "test-issuer",
		Audience:             "test-audience",
		AccessTokenDuration:  15,
		RefreshTokenDuration: 7,
	}
	jwtService := service.NewJWTServiceWithKeys(privateKey, publicKey, jwtCfg)
	authService := service.NewAuthService(userRepo, jwtService)
	shippingService := service.NewShippingService(shippingRepo)

	// Initialize handlers
	authHandler := NewAuthHandler(authService)
	shippingHandler := NewShippingHandler(shippingService)

	// Setup router
	router := gin.New()
	router.Use(CORSMiddleware())

	v1 := router.Group("/api/v1")
	{
		// Auth endpoints (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
		}

		// Protected endpoints
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(authService))
		{
			protected.GET("/users/me", authHandler.Me)

			shipments := protected.Group("/shipments")
			shipments.Use(middleware.RequirePermission("shipping:read"))
			{
				shipments.GET("", shippingHandler.List)
				shipments.GET("/summary", shippingHandler.Summary)
				shipments.GET("/:order_id", shippingHandler.Get)
			}

			protected.PUT("/shipments/:order_id", middleware.RequirePermission("shipping:update"), shippingHandler.Update)
		}
	}

	return router
}

// Helper to perform login and get access token
func performLogin(t *testing.T, router *gin.Engine, username, password string) (string, []*http.Cookie) {
	loginReq := map[string]string{
		"username": username,
		"password": password,
	}
	body, _ := json.Marshal(loginReq)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		return "", nil
	}

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	accessToken := response["access_token"].(string)

	return accessToken, w.Result().Cookies()
}

// E2E Tests

func TestE2E_Login_Success(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	loginReq := map[string]string{
		"username": "admin",
		"password": "password123",
	}
	body, _ := json.Marshal(loginReq)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// Check response fields
	assert.NotEmpty(t, response["access_token"])
	assert.Equal(t, "Bearer", response["token_type"])
	assert.NotNil(t, response["expires_at"])
	assert.NotNil(t, response["user"])

	// Check user info
	user := response["user"].(map[string]interface{})
	assert.Equal(t, "admin", user["username"])
	assert.Equal(t, "Admin User", user["display_name"])
	assert.Contains(t, user["roles"], "admin")
	assert.Contains(t, user["permissions"], "shipping:read")
	assert.Contains(t, user["permissions"], "shipping:update")

	// Check refresh token cookie
	cookies := w.Result().Cookies()
	var refreshCookie *http.Cookie
	for _, c := range cookies {
		if c.Name == "refresh_token" {
			refreshCookie = c
			break
		}
	}
	assert.NotNil(t, refreshCookie)
	assert.True(t, refreshCookie.HttpOnly)
}

func TestE2E_Login_InvalidCredentials(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	loginReq := map[string]string{
		"username": "admin",
		"password": "wrongpassword",
	}
	body, _ := json.Marshal(loginReq)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid username or password")
}

func TestE2E_Login_InactiveUser(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	loginReq := map[string]string{
		"username": "inactive",
		"password": "password123",
	}
	body, _ := json.Marshal(loginReq)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "inactive")
}

func TestE2E_Login_UserNotFound(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	loginReq := map[string]string{
		"username": "nonexistent",
		"password": "password123",
	}
	body, _ := json.Marshal(loginReq)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestE2E_Refresh_Success(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	// First login
	accessToken, cookies := performLogin(t, router, "admin", "password123")
	require.NotEmpty(t, accessToken)
	require.NotEmpty(t, cookies)

	// Find refresh token cookie
	var refreshCookie *http.Cookie
	for _, c := range cookies {
		if c.Name == "refresh_token" {
			refreshCookie = c
			break
		}
	}
	require.NotNil(t, refreshCookie)

	// Refresh token
	req, _ := http.NewRequest("POST", "/api/v1/auth/refresh", nil)
	req.AddCookie(refreshCookie)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// Check new access token
	newAccessToken := response["access_token"].(string)
	assert.NotEmpty(t, newAccessToken)
	assert.NotEqual(t, accessToken, newAccessToken)
	assert.Equal(t, "Bearer", response["token_type"])
}

func TestE2E_Refresh_NoRefreshToken(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	req, _ := http.NewRequest("POST", "/api/v1/auth/refresh", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Refresh token not found")
}

func TestE2E_Logout_Success(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	// First login
	_, cookies := performLogin(t, router, "admin", "password123")
	require.NotEmpty(t, cookies)

	// Logout
	req, _ := http.NewRequest("POST", "/api/v1/auth/logout", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "Logged out successfully")

	// Check that refresh token cookie is cleared
	responseCookies := w.Result().Cookies()
	for _, c := range responseCookies {
		if c.Name == "refresh_token" {
			assert.Equal(t, "", c.Value)
			assert.True(t, c.MaxAge < 0)
		}
	}
}

func TestE2E_Me_Success(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	accessToken, _ := performLogin(t, router, "admin", "password123")
	require.NotEmpty(t, accessToken)

	req, _ := http.NewRequest("GET", "/api/v1/users/me", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.Equal(t, "admin", response["username"])
	assert.Equal(t, "Admin User", response["display_name"])
	assert.Contains(t, response["roles"], "admin")
}

func TestE2E_Me_Unauthorized(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	req, _ := http.NewRequest("GET", "/api/v1/users/me", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestE2E_ProtectedEndpoint_WithPermission(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	// Login as operator (has shipping:read permission)
	accessToken, _ := performLogin(t, router, "operator", "password123")
	require.NotEmpty(t, accessToken)

	// Access shipments list
	req, _ := http.NewRequest("GET", "/api/v1/shipments", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestE2E_ProtectedEndpoint_WithoutPermission(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	// Login as viewer (only has shipping:read, not shipping:update)
	accessToken, _ := performLogin(t, router, "viewer", "password123")
	require.NotEmpty(t, accessToken)

	// Try to update shipment (requires shipping:update)
	updateReq := map[string]string{
		"status": "READY",
	}
	body, _ := json.Marshal(updateReq)

	req, _ := http.NewRequest("PUT", "/api/v1/shipments/ORD-001", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "FORBIDDEN")
}

func TestE2E_ProtectedEndpoint_Unauthorized(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	// Access without token
	req, _ := http.NewRequest("GET", "/api/v1/shipments", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Equal(t, "Bearer", w.Header().Get("WWW-Authenticate"))
}

func TestE2E_ProtectedEndpoint_InvalidToken(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	// Access with invalid token
	req, _ := http.NewRequest("GET", "/api/v1/shipments", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestE2E_AdminCanAccessAllShippingEndpoints(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	accessToken, _ := performLogin(t, router, "admin", "password123")
	require.NotEmpty(t, accessToken)

	// Test GET /shipments
	req, _ := http.NewRequest("GET", "/api/v1/shipments", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Test GET /shipments/summary
	req, _ = http.NewRequest("GET", "/api/v1/shipments/summary", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Test GET /shipments/:order_id
	req, _ = http.NewRequest("GET", "/api/v1/shipments/ORD-001", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestE2E_ViewerCanOnlyReadShipments(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	accessToken, _ := performLogin(t, router, "viewer", "password123")
	require.NotEmpty(t, accessToken)

	// Test GET /shipments - should succeed
	req, _ := http.NewRequest("GET", "/api/v1/shipments", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Test PUT /shipments/:order_id - should fail with 403
	updateReq := map[string]interface{}{
		"status":  "READY",
		"version": 1,
	}
	body, _ := json.Marshal(updateReq)
	req, _ = http.NewRequest("PUT", "/api/v1/shipments/ORD-001", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestE2E_OperatorCanUpdateShipments(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	accessToken, _ := performLogin(t, router, "operator", "password123")
	require.NotEmpty(t, accessToken)

	// Test PUT /shipments/:order_id - should succeed
	updateReq := map[string]interface{}{
		"status":  "READY",
		"version": 1,
	}
	body, _ := json.Marshal(updateReq)
	req, _ := http.NewRequest("PUT", "/api/v1/shipments/ORD-001", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestE2E_TokenContainsCorrectClaims(t *testing.T) {
	db := setupE2ETestDB(t)
	setupE2ETestData(t, db)
	router := setupE2ERouter(t, db)

	accessToken, _ := performLogin(t, router, "operator", "password123")
	require.NotEmpty(t, accessToken)

	// Use the token to access /users/me and verify claims
	req, _ := http.NewRequest("GET", "/api/v1/users/me", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// Verify operator has correct roles and permissions
	assert.Equal(t, "operator", response["username"])
	assert.Equal(t, "Operator User", response["display_name"])
	roles := response["roles"].([]interface{})
	assert.Contains(t, roles, "operator")
	permissions := response["permissions"].([]interface{})
	assert.Contains(t, permissions, "shipping:read")
	assert.Contains(t, permissions, "shipping:update")
}
