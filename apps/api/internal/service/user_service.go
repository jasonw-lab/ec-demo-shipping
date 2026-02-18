package service

import (
	"errors"
	"log"
	"regexp"
	"strings"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/domain"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrUsernameExists     = errors.New("username already exists")
	ErrUserNotFoundSvc    = errors.New("user not found")
	ErrInvalidRole        = errors.New("invalid role")
	ErrOptimisticLockSvc  = errors.New("data has been modified by another user")
	ErrSelfRoleChange     = errors.New("cannot change own role")
	ErrSelfDeactivate     = errors.New("cannot deactivate own account")
	ErrValidationFailed   = errors.New("validation failed")
	ErrInvalidUsername    = errors.New("username must be 3-50 characters and contain only alphanumeric, hyphen, underscore")
	ErrInvalidDisplayName = errors.New("display name must be 1-100 characters")
	ErrInvalidEmail       = errors.New("invalid email format or too long (max 255 characters)")
	ErrInvalidPassword    = errors.New("password must be at least 8 characters")
)

// UserService handles user management operations
type UserService struct {
	userRepo *repository.UserRepository
}

// NewUserService creates a new UserService
func NewUserService(userRepo *repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

// UserListRequest represents a user list request
type UserListRequest struct {
	Keyword  string
	Role     string
	IsActive *bool
	Page     int
	Size     int
}

// UserListResponse represents a paginated user list response
type UserListResponse struct {
	Users []UserDTO `json:"data"`
	Total int64     `json:"total"`
	Page  int       `json:"page"`
	Size  int       `json:"size"`
}

// UserDTO represents a user data transfer object
type UserDTO struct {
	ID          uint64    `json:"id"`
	Username    string    `json:"username"`
	DisplayName string    `json:"display_name"`
	Email       *string   `json:"email"`
	IsActive    bool      `json:"is_active"`
	Roles       []RoleDTO `json:"roles"`
	LastLoginAt *string   `json:"last_login_at"`
	CreatedAt   string    `json:"created_at"`
	Version     uint64    `json:"version"`
}

// RoleDTO represents a role data transfer object
type RoleDTO struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

// CreateUserRequest represents a user creation request
type CreateUserRequest struct {
	Username    string `json:"username" binding:"required"`
	DisplayName string `json:"display_name" binding:"required"`
	Email       string `json:"email"`
	Role        string `json:"role" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

// UpdateUserRequest represents a user update request
type UpdateUserRequest struct {
	DisplayName string `json:"display_name" binding:"required"`
	Email       string `json:"email"`
	Role        string `json:"role" binding:"required"`
	Version     uint64 `json:"version" binding:"required"`
}

// UpdateStatusRequest represents a user status update request
type UpdateStatusRequest struct {
	IsActive bool   `json:"is_active"`
	Version  uint64 `json:"version" binding:"required"`
}

// ResetPasswordRequest represents a password reset request
type ResetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required"`
}

// ListUsers returns a paginated list of users
func (s *UserService) ListUsers(req UserListRequest) (*UserListResponse, error) {
	// Set defaults
	if req.Page < 1 {
		req.Page = 1
	}
	if req.Size < 1 || req.Size > 100 {
		req.Size = 20
	}

	filter := repository.UserFilter{
		Keyword:  req.Keyword,
		Role:     req.Role,
		IsActive: req.IsActive,
	}

	users, total, err := s.userRepo.FindAll(filter, req.Page, req.Size)
	if err != nil {
		log.Printf("Failed to list users: %v", err)
		return nil, err
	}

	userDTOs := make([]UserDTO, len(users))
	for i, user := range users {
		userDTOs[i] = toUserDTO(&user)
	}

	return &UserListResponse{
		Users: userDTOs,
		Total: total,
		Page:  req.Page,
		Size:  req.Size,
	}, nil
}

// CreateUser creates a new user
func (s *UserService) CreateUser(req CreateUserRequest) (*UserDTO, error) {
	// Validate username
	if err := validateUsername(req.Username); err != nil {
		return nil, err
	}

	// Validate display name
	if err := validateDisplayName(req.DisplayName); err != nil {
		return nil, err
	}

	// Validate email (optional but must be valid if provided)
	if req.Email != "" {
		if err := validateEmail(req.Email); err != nil {
			return nil, err
		}
	}

	// Validate password
	if err := validatePassword(req.Password); err != nil {
		return nil, err
	}

	// Check if username already exists
	exists, err := s.userRepo.ExistsByUsername(req.Username)
	if err != nil {
		log.Printf("Failed to check username existence: %v", err)
		return nil, err
	}
	if exists {
		return nil, ErrUsernameExists
	}

	// Validate role
	role, err := s.userRepo.FindRoleByCode(req.Role)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidRole
		}
		log.Printf("Failed to find role: %v", err)
		return nil, err
	}

	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash password: %v", err)
		return nil, err
	}

	// Create user
	var email *string
	if req.Email != "" {
		email = &req.Email
	}

	user := &domain.User{
		Username:     req.Username,
		DisplayName:  req.DisplayName,
		Email:        email,
		PasswordHash: string(passwordHash),
		IsActive:     true,
		TenantID:     "default",
		Version:      1,
	}

	if err := s.userRepo.Create(user); err != nil {
		log.Printf("Failed to create user: %v", err)
		return nil, err
	}

	// Assign role
	if err := s.userRepo.AssignRoleToUser(user.ID, role.ID); err != nil {
		log.Printf("Failed to assign role to user: %v", err)
		return nil, err
	}

	// Reload user with roles
	user, err = s.userRepo.FindByID(user.ID)
	if err != nil {
		log.Printf("Failed to reload user: %v", err)
		return nil, err
	}

	log.Printf("User created: username=%s, id=%d, role=%s", user.Username, user.ID, req.Role)

	dto := toUserDTO(user)
	return &dto, nil
}

// UpdateUser updates an existing user
func (s *UserService) UpdateUser(userID uint64, req UpdateUserRequest, currentUserID uint64) (*UserDTO, error) {
	// Validate display name
	if err := validateDisplayName(req.DisplayName); err != nil {
		return nil, err
	}

	// Validate email (optional but must be valid if provided)
	if req.Email != "" {
		if err := validateEmail(req.Email); err != nil {
			return nil, err
		}
	}

	// Find user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFoundSvc
		}
		log.Printf("Failed to find user: %v", err)
		return nil, err
	}

	// Check if user is trying to change their own role
	if userID == currentUserID && len(user.Roles) > 0 && user.Roles[0].Code != req.Role {
		return nil, ErrSelfRoleChange
	}

	// Validate new role
	role, err := s.userRepo.FindRoleByCode(req.Role)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidRole
		}
		log.Printf("Failed to find role: %v", err)
		return nil, err
	}

	// Update user fields
	user.DisplayName = req.DisplayName
	if req.Email != "" {
		user.Email = &req.Email
	} else {
		user.Email = nil
	}

	// Update with optimistic locking
	if err := s.userRepo.UpdateWithVersion(user, req.Version); err != nil {
		if errors.Is(err, repository.ErrOptimisticLock) {
			return nil, ErrOptimisticLockSvc
		}
		log.Printf("Failed to update user: %v", err)
		return nil, err
	}

	// Update role if changed
	currentRoleCode := ""
	if len(user.Roles) > 0 {
		currentRoleCode = user.Roles[0].Code
	}
	if currentRoleCode != req.Role {
		// Remove existing roles and assign new one
		if err := s.userRepo.RemoveAllUserRoles(user.ID); err != nil {
			log.Printf("Failed to remove user roles: %v", err)
			return nil, err
		}
		if err := s.userRepo.AssignRoleToUser(user.ID, role.ID); err != nil {
			log.Printf("Failed to assign new role: %v", err)
			return nil, err
		}
	}

	// Reload user with roles
	user, err = s.userRepo.FindByID(user.ID)
	if err != nil {
		log.Printf("Failed to reload user: %v", err)
		return nil, err
	}

	log.Printf("User updated: username=%s, id=%d", user.Username, user.ID)

	dto := toUserDTO(user)
	return &dto, nil
}

// UpdateStatus updates a user's active status
func (s *UserService) UpdateStatus(userID uint64, req UpdateStatusRequest, currentUserID uint64) (*UserDTO, error) {
	// Prevent self-deactivation
	if userID == currentUserID && !req.IsActive {
		return nil, ErrSelfDeactivate
	}

	// Find user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFoundSvc
		}
		log.Printf("Failed to find user: %v", err)
		return nil, err
	}

	// Update status
	user.IsActive = req.IsActive

	// Update with optimistic locking
	if err := s.userRepo.UpdateWithVersion(user, req.Version); err != nil {
		if errors.Is(err, repository.ErrOptimisticLock) {
			return nil, ErrOptimisticLockSvc
		}
		log.Printf("Failed to update user status: %v", err)
		return nil, err
	}

	log.Printf("User status updated: username=%s, id=%d, is_active=%v", user.Username, user.ID, user.IsActive)

	dto := toUserDTO(user)
	return &dto, nil
}

// ResetPassword resets a user's password
func (s *UserService) ResetPassword(userID uint64, req ResetPasswordRequest) error {
	// Validate password
	if err := validatePassword(req.NewPassword); err != nil {
		return err
	}

	// Find user
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFoundSvc
		}
		log.Printf("Failed to find user: %v", err)
		return err
	}

	// Hash new password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash password: %v", err)
		return err
	}

	// Update password
	if err := s.userRepo.UpdatePasswordHash(user.ID, string(passwordHash)); err != nil {
		log.Printf("Failed to update password: %v", err)
		return err
	}

	log.Printf("Password reset: username=%s, id=%d", user.Username, user.ID)

	return nil
}

// GetUser returns a user by ID
func (s *UserService) GetUser(userID uint64) (*UserDTO, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFoundSvc
		}
		log.Printf("Failed to find user: %v", err)
		return nil, err
	}

	dto := toUserDTO(user)
	return &dto, nil
}

// toUserDTO converts a domain.User to UserDTO
func toUserDTO(user *domain.User) UserDTO {
	roles := make([]RoleDTO, len(user.Roles))
	for i, role := range user.Roles {
		roles[i] = RoleDTO{
			Code: role.Code,
			Name: role.Name,
		}
	}

	var lastLoginAt *string
	if user.LastLoginAt != nil {
		formatted := user.LastLoginAt.Format("2006-01-02T15:04:05Z")
		lastLoginAt = &formatted
	}

	return UserDTO{
		ID:          user.ID,
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Email:       user.Email,
		IsActive:    user.IsActive,
		Roles:       roles,
		LastLoginAt: lastLoginAt,
		CreatedAt:   user.CreatedAt.Format("2006-01-02T15:04:05Z"),
		Version:     user.Version,
	}
}

// Validation functions
var usernameRegex = regexp.MustCompile(`^[a-zA-Z0-9_-]{3,50}$`)
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func validateUsername(username string) error {
	if !usernameRegex.MatchString(username) {
		return ErrInvalidUsername
	}
	return nil
}

func validateDisplayName(displayName string) error {
	displayName = strings.TrimSpace(displayName)
	if len(displayName) < 1 || len(displayName) > 100 {
		return ErrInvalidDisplayName
	}
	return nil
}

func validateEmail(email string) error {
	if len(email) > 255 {
		return ErrInvalidEmail
	}
	if !emailRegex.MatchString(email) {
		return ErrInvalidEmail
	}
	return nil
}

func validatePassword(password string) error {
	if len(password) < 8 {
		return ErrInvalidPassword
	}
	return nil
}
