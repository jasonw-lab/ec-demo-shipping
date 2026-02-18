package service

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/config"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain/auth"
)

var (
	ErrInvalidToken     = errors.New("invalid token")
	ErrTokenExpired     = errors.New("token has expired")
	ErrInvalidTokenType = errors.New("invalid token type")
	ErrInvalidKey       = errors.New("invalid RSA key")
)

// JWTService handles JWT token operations using RS256 algorithm
type JWTService struct {
	privateKey           *rsa.PrivateKey
	publicKey            *rsa.PublicKey
	issuer               string
	audience             string
	accessTokenDuration  time.Duration
	refreshTokenDuration time.Duration
}

// NewJWTService creates a new JWTService with RSA keys
func NewJWTService(cfg *config.JWTConfig) *JWTService {
	var privateKey *rsa.PrivateKey
	var publicKey *rsa.PublicKey
	var err error

	// Load private key
	if cfg.PrivateKeyPath != "" {
		privateKey, err = loadPrivateKeyFromFile(cfg.PrivateKeyPath)
		if err != nil {
			panic("Failed to load private key from file: " + err.Error())
		}
	} else if cfg.PrivateKeyPEM != "" {
		privateKey, err = parsePrivateKey([]byte(cfg.PrivateKeyPEM))
		if err != nil {
			panic("Failed to parse private key PEM: " + err.Error())
		}
	}

	// Load public key
	if cfg.PublicKeyPath != "" {
		publicKey, err = loadPublicKeyFromFile(cfg.PublicKeyPath)
		if err != nil {
			panic("Failed to load public key from file: " + err.Error())
		}
	} else if cfg.PublicKeyPEM != "" {
		publicKey, err = parsePublicKey([]byte(cfg.PublicKeyPEM))
		if err != nil {
			panic("Failed to parse public key PEM: " + err.Error())
		}
	} else if privateKey != nil {
		// Derive public key from private key
		publicKey = &privateKey.PublicKey
	}

	if privateKey == nil || publicKey == nil {
		panic("JWT private key and public key must be configured")
	}

	return &JWTService{
		privateKey:           privateKey,
		publicKey:            publicKey,
		issuer:               cfg.Issuer,
		audience:             cfg.Audience,
		accessTokenDuration:  time.Duration(cfg.AccessTokenDuration) * time.Minute,
		refreshTokenDuration: time.Duration(cfg.RefreshTokenDuration) * 24 * time.Hour,
	}
}

// NewJWTServiceWithKeys creates a JWTService with provided RSA keys (for testing)
func NewJWTServiceWithKeys(privateKey *rsa.PrivateKey, publicKey *rsa.PublicKey, cfg *config.JWTConfig) *JWTService {
	return &JWTService{
		privateKey:           privateKey,
		publicKey:            publicKey,
		issuer:               cfg.Issuer,
		audience:             cfg.Audience,
		accessTokenDuration:  time.Duration(cfg.AccessTokenDuration) * time.Minute,
		refreshTokenDuration: time.Duration(cfg.RefreshTokenDuration) * 24 * time.Hour,
	}
}

func loadPrivateKeyFromFile(path string) (*rsa.PrivateKey, error) {
	keyData, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return parsePrivateKey(keyData)
}

func loadPublicKeyFromFile(path string) (*rsa.PublicKey, error) {
	keyData, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return parsePublicKey(keyData)
}

func parsePrivateKey(keyData []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(keyData)
	if block == nil {
		return nil, ErrInvalidKey
	}

	// Try PKCS#1 format first
	key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err == nil {
		return key, nil
	}

	// Try PKCS#8 format
	keyInterface, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}

	rsaKey, ok := keyInterface.(*rsa.PrivateKey)
	if !ok {
		return nil, ErrInvalidKey
	}
	return rsaKey, nil
}

func parsePublicKey(keyData []byte) (*rsa.PublicKey, error) {
	block, _ := pem.Decode(keyData)
	if block == nil {
		return nil, ErrInvalidKey
	}

	// Try PKIX format first
	keyInterface, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err == nil {
		rsaKey, ok := keyInterface.(*rsa.PublicKey)
		if ok {
			return rsaKey, nil
		}
	}

	// Try PKCS#1 format
	key, err := x509.ParsePKCS1PublicKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	return key, nil
}

// TokenPair represents an access token and refresh token pair
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	TokenType    string    `json:"token_type"`
}

// GenerateTokenPair generates both access and refresh tokens for a user
func (s *JWTService) GenerateTokenPair(user *domain.User) (*TokenPair, error) {
	familyID := uuid.New().String()
	return s.generateTokenPairWithFamily(user, familyID)
}

// RefreshTokenPair generates a new token pair using the family ID from the refresh token
func (s *JWTService) RefreshTokenPair(user *domain.User, familyID string) (*TokenPair, error) {
	return s.generateTokenPairWithFamily(user, familyID)
}

func (s *JWTService) generateTokenPairWithFamily(user *domain.User, familyID string) (*TokenPair, error) {
	now := time.Now()
	accessTokenExpiry := now.Add(s.accessTokenDuration)
	refreshTokenExpiry := now.Add(s.refreshTokenDuration)

	// Generate access token with RS256
	accessClaims := &auth.Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.New().String(),
			Issuer:    s.issuer,
			Audience:  jwt.ClaimStrings{s.audience},
			Subject:   user.Username,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(accessTokenExpiry),
		},
		UserID:      user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		TenantID:    user.TenantID,
		Roles:       user.GetRoleCodes(),
		Permissions: user.GetPermissions(),
		TokenType:   auth.AccessToken,
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodRS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(s.privateKey)
	if err != nil {
		return nil, err
	}

	// Generate refresh token with RS256
	refreshClaims := &auth.Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.New().String(),
			Issuer:    s.issuer,
			Audience:  jwt.ClaimStrings{s.audience},
			Subject:   user.Username,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(refreshTokenExpiry),
		},
		UserID:    user.ID,
		Username:  user.Username,
		TenantID:  user.TenantID,
		TokenType: auth.RefreshToken,
		FamilyID:  familyID,
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodRS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(s.privateKey)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessTokenString,
		RefreshToken: refreshTokenString,
		ExpiresAt:    accessTokenExpiry,
		TokenType:    "Bearer",
	}, nil
}

// ValidateAccessToken validates an access token and returns the claims
func (s *JWTService) ValidateAccessToken(tokenString string) (*auth.Claims, error) {
	claims, err := s.parseToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != auth.AccessToken {
		return nil, ErrInvalidTokenType
	}

	return claims, nil
}

// ValidateRefreshToken validates a refresh token and returns the claims
func (s *JWTService) ValidateRefreshToken(tokenString string) (*auth.Claims, error) {
	claims, err := s.parseToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != auth.RefreshToken {
		return nil, ErrInvalidTokenType
	}

	return claims, nil
}

func (s *JWTService) parseToken(tokenString string) (*auth.Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &auth.Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, ErrInvalidToken
		}
		return s.publicKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*auth.Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// GetPublicKey returns the public key (for JWKS endpoint)
func (s *JWTService) GetPublicKey() *rsa.PublicKey {
	return s.publicKey
}
