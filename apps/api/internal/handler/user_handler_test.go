package handler

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"fmt"
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

// Test Setup

func setupUserTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

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

func setupUserTestData(t *testing.T, db *gorm.DB) {
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
		{ID: 4, Code: "service", Name: "Service Account"},
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

	// Create users
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	email1 := "admin@example.com"
	email2 := "operator@example.com"
	users := []domain.User{
		{ID: 1, Username: "admin", PasswordHash: string(hashedPassword), DisplayName: "Admin User", Email: &email1, IsActive: true, TenantID: "default", Version: 1},
		{ID: 2, Username: "operator", PasswordHash: string(hashedPassword), DisplayName: "Operator User", Email: &email2, IsActive: true, TenantID: "default", Version: 1},
		{ID: 3, Username: "viewer", PasswordHash: string(hashedPassword), DisplayName: "Viewer User", IsActive: true, TenantID: "default", Version: 1},
		{ID: 4, Username: "inactive", PasswordHash: string(hashedPassword), DisplayName: "Inactive User", IsActive: true, TenantID: "default", Version: 1},
		{ID: 5, Username: "service-account", PasswordHash: string(hashedPassword), DisplayName: "Service Account", IsActive: true, TenantID: "default", Version: 1},
	}
	for _, u := range users {
		require.NoError(t, db.Create(&u).Error)
	}

	require.NoError(t, db.Model(&domain.User{}).Where("id = ?", 4).Update("is_active", false).Error)

	// Assign roles to users
	require.NoError(t, db.Create(&domain.UserRole{UserID: 1, RoleID: 1}).Error) // admin -> admin role
	require.NoError(t, db.Create(&domain.UserRole{UserID: 2, RoleID: 2}).Error) // operator -> operator role
	require.NoError(t, db.Create(&domain.UserRole{UserID: 3, RoleID: 3}).Error) // viewer -> viewer role
	require.NoError(t, db.Create(&domain.UserRole{UserID: 4, RoleID: 3}).Error) // inactive -> viewer role
	require.NoError(t, db.Create(&domain.UserRole{UserID: 5, RoleID: 4}).Error) // service-account -> service role
}

func generateUserTestRSAKeys(t *testing.T) (*rsa.PrivateKey, *rsa.PublicKey) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	return privateKey, &privateKey.PublicKey
}

func setupUserRouter(t *testing.T, db *gorm.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)

	privateKey, publicKey := generateUserTestRSAKeys(t)

	userRepo := repository.NewUserRepository(db)

	jwtCfg := &config.JWTConfig{
		Issuer:               "test-issuer",
		Audience:             "test-audience",
		AccessTokenDuration:  15,
		RefreshTokenDuration: 7,
	}
	jwtService := service.NewJWTServiceWithKeys(privateKey, publicKey, jwtCfg)
	authService := service.NewAuthService(userRepo, jwtService)
	userService := service.NewUserService(userRepo)

	authHandler := NewAuthHandler(authService)
	userHandler := NewUserHandler(userService)

	router := gin.New()
	router.Use(CORSMiddleware())

	v1 := router.Group("/api/v1")
	{
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(authService))
		{
			users := protected.Group("/users")
			{
				users.GET("", middleware.RequirePermission("user:read"), userHandler.List)
				users.GET("/:id", middleware.RequirePermission("user:read"), userHandler.Get)
				users.POST("", middleware.RequirePermission("user:create"), userHandler.Create)
				users.PUT("/:id", middleware.RequirePermission("user:update"), userHandler.Update)
				users.PUT("/:id/status", middleware.RequirePermission("user:update"), userHandler.UpdateStatus)
				users.PUT("/:id/password", middleware.RequirePermission("user:update"), userHandler.ResetPassword)
			}
		}
	}

	return router
}

func loginUser(t *testing.T, router *gin.Engine, username, password string) string {
	loginReq := map[string]string{
		"username": username,
		"password": password,
	}
	body, _ := json.Marshal(loginReq)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	return response["access_token"].(string)
}

// Tests

func TestUserHandler_List_Success(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	req, _ := http.NewRequest("GET", "/api/v1/users", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	assert.True(t, response["success"].(bool))
	data := response["data"].([]interface{})
	assert.Equal(t, 4, len(data)) // Excludes service account user
	assert.Equal(t, float64(4), response["total"])
}

func TestUserHandler_List_WithFilters(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	// Filter by role
	req, _ := http.NewRequest("GET", "/api/v1/users?role=admin", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	data := response["data"].([]interface{})
	assert.Equal(t, 1, len(data))

	// Filter by is_active
	req, _ = http.NewRequest("GET", "/api/v1/users?is_active=false", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	json.Unmarshal(w.Body.Bytes(), &response)
	data = response["data"].([]interface{})
	assert.Equal(t, 1, len(data))
}

func TestUserHandler_List_Forbidden(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	// Viewer doesn't have user:read permission
	accessToken := loginUser(t, router, "viewer", "password123")

	req, _ := http.NewRequest("GET", "/api/v1/users", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestUserHandler_Get_Success(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	req, _ := http.NewRequest("GET", "/api/v1/users/2", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.True(t, response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.Equal(t, "operator", data["username"])
	assert.Equal(t, "Operator User", data["display_name"])
}

func TestUserHandler_Get_NotFound(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	req, _ := http.NewRequest("GET", "/api/v1/users/999", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestUserHandler_Create_Success(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	createReq := map[string]string{
		"username":     "newuser",
		"display_name": "New User",
		"email":        "newuser@example.com",
		"role":         "viewer",
		"password":     "password123",
	}
	body, _ := json.Marshal(createReq)

	req, _ := http.NewRequest("POST", "/api/v1/users", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.True(t, response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.Equal(t, "newuser", data["username"])
	assert.Equal(t, "New User", data["display_name"])
	roles := data["roles"].([]interface{})
	assert.Equal(t, 1, len(roles))
}

func TestUserHandler_Create_UsernameExists(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	createReq := map[string]string{
		"username":     "admin", // Already exists
		"display_name": "Another Admin",
		"role":         "admin",
		"password":     "password123",
	}
	body, _ := json.Marshal(createReq)

	req, _ := http.NewRequest("POST", "/api/v1/users", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestUserHandler_Create_InvalidUsername(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	createReq := map[string]string{
		"username":     "ab", // Too short
		"display_name": "Short Username",
		"role":         "viewer",
		"password":     "password123",
	}
	body, _ := json.Marshal(createReq)

	req, _ := http.NewRequest("POST", "/api/v1/users", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUserHandler_Create_InvalidRole(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	createReq := map[string]string{
		"username":     "newuser",
		"display_name": "New User",
		"role":         "nonexistent",
		"password":     "password123",
	}
	body, _ := json.Marshal(createReq)

	req, _ := http.NewRequest("POST", "/api/v1/users", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUserHandler_Update_Success(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	updateReq := map[string]interface{}{
		"display_name": "Updated Operator",
		"email":        "updated@example.com",
		"role":         "operator",
		"version":      1,
	}
	body, _ := json.Marshal(updateReq)

	req, _ := http.NewRequest("PUT", "/api/v1/users/2", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	assert.True(t, response["success"].(bool))
	data := response["data"].(map[string]interface{})
	assert.Equal(t, "Updated Operator", data["display_name"])
	assert.Equal(t, float64(2), data["version"])
}

func TestUserHandler_Update_OptimisticLock(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	updateReq := map[string]interface{}{
		"display_name": "Updated Operator",
		"email":        "updated@example.com",
		"role":         "operator",
		"version":      999, // Wrong version
	}
	body, _ := json.Marshal(updateReq)

	req, _ := http.NewRequest("PUT", "/api/v1/users/2", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestUserHandler_Update_SelfRoleChange(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	// Admin (ID=1) trying to change their own role
	updateReq := map[string]interface{}{
		"display_name": "Admin User",
		"role":         "viewer", // Trying to change own role
		"version":      1,
	}
	body, _ := json.Marshal(updateReq)

	req, _ := http.NewRequest("PUT", "/api/v1/users/1", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "SELF_ROLE_CHANGE")
}

func TestUserHandler_UpdateStatus_Success(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	// Deactivate operator user
	updateReq := map[string]interface{}{
		"is_active": false,
		"version":   1,
	}
	body, _ := json.Marshal(updateReq)

	req, _ := http.NewRequest("PUT", "/api/v1/users/2/status", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	data := response["data"].(map[string]interface{})
	assert.Equal(t, false, data["is_active"])
}

func TestUserHandler_UpdateStatus_SelfDeactivate(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	// Admin (ID=1) trying to deactivate themselves
	updateReq := map[string]interface{}{
		"is_active": false,
		"version":   1,
	}
	body, _ := json.Marshal(updateReq)

	req, _ := http.NewRequest("PUT", "/api/v1/users/1/status", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "SELF_DEACTIVATE")
}

func TestUserHandler_ResetPassword_Success(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	resetReq := map[string]string{
		"new_password": "newpassword123",
	}
	body, _ := json.Marshal(resetReq)

	req, _ := http.NewRequest("PUT", "/api/v1/users/2/password", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify password was changed by logging in with new password
	loginReq := map[string]string{
		"username": "operator",
		"password": "newpassword123",
	}
	body, _ = json.Marshal(loginReq)
	req, _ = http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestUserHandler_ResetPassword_InvalidPassword(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	resetReq := map[string]string{
		"new_password": "short", // Too short
	}
	body, _ := json.Marshal(resetReq)

	req, _ := http.NewRequest("PUT", "/api/v1/users/2/password", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUserHandler_RoleChange_Success(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	// Change operator (ID=2) to admin role
	updateReq := map[string]interface{}{
		"display_name": "Promoted User",
		"role":         "admin",
		"version":      1,
	}
	body, _ := json.Marshal(updateReq)

	req, _ := http.NewRequest("PUT", "/api/v1/users/2", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	data := response["data"].(map[string]interface{})
	roles := data["roles"].([]interface{})
	assert.Equal(t, 1, len(roles))
	roleInfo := roles[0].(map[string]interface{})
	assert.Equal(t, "admin", roleInfo["code"])
}

func TestUserHandler_Pagination(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	// Page 1, size 2
	req, _ := http.NewRequest("GET", "/api/v1/users?page=1&size=2", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	data := response["data"].([]interface{})
	assert.Equal(t, 2, len(data))
	assert.Equal(t, float64(4), response["total"])
	assert.Equal(t, float64(1), response["page"])
	assert.Equal(t, float64(2), response["size"])

	// Page 2, size 2
	req, _ = http.NewRequest("GET", "/api/v1/users?page=2&size=2", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	json.Unmarshal(w.Body.Bytes(), &response)
	data = response["data"].([]interface{})
	assert.Equal(t, 2, len(data))
}

func TestUserHandler_KeywordSearch(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	// Search by display name
	req, _ := http.NewRequest("GET", "/api/v1/users?keyword=Admin", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	data := response["data"].([]interface{})
	assert.Equal(t, 1, len(data))

	// Search by email
	req, _ = http.NewRequest("GET", "/api/v1/users?keyword=operator@", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	json.Unmarshal(w.Body.Bytes(), &response)
	data = response["data"].([]interface{})
	assert.Equal(t, 1, len(data))
}

func TestUserHandler_ServiceAccountNotListed(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	req, _ := http.NewRequest("GET", "/api/v1/users", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	data := response["data"].([]interface{})
	for _, item := range data {
		user := item.(map[string]interface{})
		assert.NotEqual(t, "service-account", user["username"])
	}
}

func TestUserHandler_ValidationErrors(t *testing.T) {
	db := setupUserTestDB(t)
	setupUserTestData(t, db)
	router := setupUserRouter(t, db)

	accessToken := loginUser(t, router, "admin", "password123")

	testCases := []struct {
		name     string
		request  map[string]interface{}
		expected int
	}{
		{
			name: "Invalid email format",
			request: map[string]interface{}{
				"username":     "testuser",
				"display_name": "Test User",
				"email":        "invalid-email",
				"role":         "viewer",
				"password":     "password123",
			},
			expected: http.StatusBadRequest,
		},
		{
			name: "Empty display name",
			request: map[string]interface{}{
				"username":     "testuser",
				"display_name": "",
				"role":         "viewer",
				"password":     "password123",
			},
			expected: http.StatusBadRequest,
		},
		{
			name: "Short password",
			request: map[string]interface{}{
				"username":     "testuser",
				"display_name": "Test User",
				"role":         "viewer",
				"password":     "short",
			},
			expected: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			body, _ := json.Marshal(tc.request)
			req, _ := http.NewRequest("POST", "/api/v1/users", bytes.NewBuffer(body))
			req.Header.Set("Authorization", "Bearer "+accessToken)
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tc.expected, w.Code, fmt.Sprintf("Test case: %s", tc.name))
		})
	}
}
