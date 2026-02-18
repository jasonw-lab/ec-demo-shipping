package service

import (
	"errors"
	"log"
	"time"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain/auth"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUserInactive       = errors.New("user account is inactive")
	ErrUserNotFound       = errors.New("user not found")
)

// AuthService handles authentication operations
type AuthService struct {
	userRepo   *repository.UserRepository
	jwtService *JWTService
}

// NewAuthService creates a new AuthService
func NewAuthService(userRepo *repository.UserRepository, jwtService *JWTService) *AuthService {
	return &AuthService{
		userRepo:   userRepo,
		jwtService: jwtService,
	}
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	AccessToken string         `json:"access_token"`
	TokenType   string         `json:"token_type"`
	ExpiresAt   time.Time      `json:"expires_at"`
	User        *auth.UserInfo `json:"user"`
}

// Login authenticates a user and returns tokens
func (s *AuthService) Login(req *LoginRequest) (*LoginResponse, string, error) {
	// Find user by username
	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil {
		log.Printf("Login failed: user not found: %s", req.Username)
		return nil, "", ErrInvalidCredentials
	}

	// Check if user is active
	if !user.IsActive {
		log.Printf("Login failed: user inactive: %s", req.Username)
		return nil, "", ErrUserInactive
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		log.Printf("Login failed: invalid password for user: %s", req.Username)
		return nil, "", ErrInvalidCredentials
	}

	// Generate token pair
	tokenPair, err := s.jwtService.GenerateTokenPair(user)
	if err != nil {
		log.Printf("Login failed: token generation error: %v", err)
		return nil, "", err
	}

	// Update last login time
	now := time.Now()
	if err := s.userRepo.UpdateLastLoginAt(user.ID, now); err != nil {
		log.Printf("Failed to update last login time for user: %s, error: %v", req.Username, err)
		// Don't fail login for this error
	}

	log.Printf("Login successful: user=%s, id=%d", req.Username, user.ID)

	return &LoginResponse{
		AccessToken: tokenPair.AccessToken,
		TokenType:   tokenPair.TokenType,
		ExpiresAt:   tokenPair.ExpiresAt,
		User: &auth.UserInfo{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			Email:       user.Email,
			Roles:       user.GetRoleCodes(),
			Permissions: user.GetPermissions(),
		},
	}, tokenPair.RefreshToken, nil
}

// RefreshResponse represents a refresh token response
type RefreshResponse struct {
	AccessToken string    `json:"access_token"`
	TokenType   string    `json:"token_type"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// RefreshToken refreshes the access token using a refresh token
func (s *AuthService) RefreshToken(refreshToken string) (*RefreshResponse, string, error) {
	// Validate refresh token
	claims, err := s.jwtService.ValidateRefreshToken(refreshToken)
	if err != nil {
		log.Printf("Refresh failed: invalid refresh token: %v", err)
		return nil, "", err
	}

	// Get user from database to ensure they still exist and are active
	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		log.Printf("Refresh failed: user not found: %d", claims.UserID)
		return nil, "", ErrUserNotFound
	}

	if !user.IsActive {
		log.Printf("Refresh failed: user inactive: %s", user.Username)
		return nil, "", ErrUserInactive
	}

	// Generate new token pair with the same family ID
	tokenPair, err := s.jwtService.RefreshTokenPair(user, claims.FamilyID)
	if err != nil {
		log.Printf("Refresh failed: token generation error: %v", err)
		return nil, "", err
	}

	log.Printf("Token refresh successful: user=%s, family=%s", user.Username, claims.FamilyID)

	return &RefreshResponse{
		AccessToken: tokenPair.AccessToken,
		TokenType:   tokenPair.TokenType,
		ExpiresAt:   tokenPair.ExpiresAt,
	}, tokenPair.RefreshToken, nil
}

// ValidateToken validates an access token and returns the claims
func (s *AuthService) ValidateToken(token string) (*auth.Claims, error) {
	return s.jwtService.ValidateAccessToken(token)
}

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}
