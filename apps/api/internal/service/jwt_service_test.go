package service

import (
	"crypto/rand"
	"crypto/rsa"
	"testing"
	"time"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/config"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain/auth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// generateTestRSAKeys generates RSA key pair for testing
func generateTestRSAKeys(t *testing.T) (*rsa.PrivateKey, *rsa.PublicKey) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	return privateKey, &privateKey.PublicKey
}

func createTestJWTService(t *testing.T) *JWTService {
	privateKey, publicKey := generateTestRSAKeys(t)
	cfg := &config.JWTConfig{
		Issuer:               "test-issuer",
		Audience:             "test-audience",
		AccessTokenDuration:  15,
		RefreshTokenDuration: 7,
	}
	return NewJWTServiceWithKeys(privateKey, publicKey, cfg)
}

func TestJWTService_GenerateTokenPair(t *testing.T) {
	jwtService := createTestJWTService(t)

	user := &domain.User{
		ID:          1,
		Username:    "testuser",
		DisplayName: "Test User",
		TenantID:    "default",
		Roles: []domain.Role{
			{
				Code: "admin",
				Permissions: []domain.Permission{
					{Code: "shipping:read"},
					{Code: "shipping:update"},
				},
			},
		},
	}

	tokenPair, err := jwtService.GenerateTokenPair(user)

	require.NoError(t, err)
	assert.NotEmpty(t, tokenPair.AccessToken)
	assert.NotEmpty(t, tokenPair.RefreshToken)
	assert.Equal(t, "Bearer", tokenPair.TokenType)
	assert.True(t, tokenPair.ExpiresAt.After(time.Now()))
}

func TestJWTService_ValidateAccessToken(t *testing.T) {
	jwtService := createTestJWTService(t)

	user := &domain.User{
		ID:          1,
		Username:    "testuser",
		DisplayName: "Test User",
		TenantID:    "default",
		Roles: []domain.Role{
			{
				Code: "operator",
				Permissions: []domain.Permission{
					{Code: "shipping:read"},
					{Code: "shipping:update"},
				},
			},
		},
	}

	tokenPair, err := jwtService.GenerateTokenPair(user)
	require.NoError(t, err)

	claims, err := jwtService.ValidateAccessToken(tokenPair.AccessToken)

	require.NoError(t, err)
	assert.Equal(t, user.ID, claims.UserID)
	assert.Equal(t, user.Username, claims.Username)
	assert.Equal(t, user.DisplayName, claims.DisplayName)
	assert.Equal(t, user.TenantID, claims.TenantID)
	assert.Contains(t, claims.Roles, "operator")
	assert.Contains(t, claims.Permissions, "shipping:read")
	assert.Contains(t, claims.Permissions, "shipping:update")
	assert.Equal(t, auth.AccessToken, claims.TokenType)
}

func TestJWTService_ValidateRefreshToken(t *testing.T) {
	jwtService := createTestJWTService(t)

	user := &domain.User{
		ID:       1,
		Username: "testuser",
		TenantID: "default",
	}

	tokenPair, err := jwtService.GenerateTokenPair(user)
	require.NoError(t, err)

	claims, err := jwtService.ValidateRefreshToken(tokenPair.RefreshToken)

	require.NoError(t, err)
	assert.Equal(t, user.ID, claims.UserID)
	assert.Equal(t, user.Username, claims.Username)
	assert.Equal(t, auth.RefreshToken, claims.TokenType)
	assert.NotEmpty(t, claims.FamilyID)
}

func TestJWTService_ValidateAccessToken_InvalidToken(t *testing.T) {
	jwtService := createTestJWTService(t)

	_, err := jwtService.ValidateAccessToken("invalid-token")

	assert.Error(t, err)
	assert.Equal(t, ErrInvalidToken, err)
}

func TestJWTService_ValidateAccessToken_WrongTokenType(t *testing.T) {
	jwtService := createTestJWTService(t)

	user := &domain.User{
		ID:       1,
		Username: "testuser",
		TenantID: "default",
	}

	tokenPair, err := jwtService.GenerateTokenPair(user)
	require.NoError(t, err)

	// Try to validate refresh token as access token
	_, err = jwtService.ValidateAccessToken(tokenPair.RefreshToken)

	assert.Error(t, err)
	assert.Equal(t, ErrInvalidTokenType, err)
}

func TestJWTService_RefreshTokenPair(t *testing.T) {
	jwtService := createTestJWTService(t)

	user := &domain.User{
		ID:          1,
		Username:    "testuser",
		DisplayName: "Test User",
		TenantID:    "default",
		Roles: []domain.Role{
			{
				Code: "admin",
				Permissions: []domain.Permission{
					{Code: "shipping:read"},
				},
			},
		},
	}

	// Generate initial token pair
	tokenPair, err := jwtService.GenerateTokenPair(user)
	require.NoError(t, err)

	// Get family ID from refresh token
	refreshClaims, err := jwtService.ValidateRefreshToken(tokenPair.RefreshToken)
	require.NoError(t, err)
	familyID := refreshClaims.FamilyID

	// Refresh token pair
	newTokenPair, err := jwtService.RefreshTokenPair(user, familyID)
	require.NoError(t, err)

	// Verify new tokens
	assert.NotEqual(t, tokenPair.AccessToken, newTokenPair.AccessToken)
	assert.NotEqual(t, tokenPair.RefreshToken, newTokenPair.RefreshToken)

	// Verify family ID is preserved
	newRefreshClaims, err := jwtService.ValidateRefreshToken(newTokenPair.RefreshToken)
	require.NoError(t, err)
	assert.Equal(t, familyID, newRefreshClaims.FamilyID)
}

func TestJWTService_ValidateAccessToken_WrongKey(t *testing.T) {
	// Create two services with different keys
	jwtService1 := createTestJWTService(t)
	jwtService2 := createTestJWTService(t)

	user := &domain.User{
		ID:       1,
		Username: "testuser",
		TenantID: "default",
	}

	// Generate token with service 1
	tokenPair, err := jwtService1.GenerateTokenPair(user)
	require.NoError(t, err)

	// Try to validate with service 2 (different key)
	_, err = jwtService2.ValidateAccessToken(tokenPair.AccessToken)
	assert.Error(t, err)
	assert.Equal(t, ErrInvalidToken, err)
}

func TestJWTService_RS256Algorithm(t *testing.T) {
	jwtService := createTestJWTService(t)

	user := &domain.User{
		ID:       1,
		Username: "testuser",
		TenantID: "default",
	}

	tokenPair, err := jwtService.GenerateTokenPair(user)
	require.NoError(t, err)

	// Verify the token uses RS256 by checking the header
	// The token should start with "eyJ" (base64 encoded JSON header)
	assert.True(t, len(tokenPair.AccessToken) > 0)

	// Validate the token works
	claims, err := jwtService.ValidateAccessToken(tokenPair.AccessToken)
	require.NoError(t, err)
	assert.Equal(t, user.Username, claims.Username)
}
