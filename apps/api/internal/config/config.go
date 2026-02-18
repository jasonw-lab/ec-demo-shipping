package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Kafka    KafkaConfig
	JWT      JWTConfig
}

// JWTConfig holds JWT-related configuration
type JWTConfig struct {
	PrivateKeyPath       string // Path to RSA private key PEM file
	PublicKeyPath        string // Path to RSA public key PEM file
	PrivateKeyPEM        string // RSA private key PEM (inline, for testing)
	PublicKeyPEM         string // RSA public key PEM (inline, for testing)
	Issuer               string
	Audience             string
	AccessTokenDuration  int // minutes
	RefreshTokenDuration int // days
}

// KafkaConfig holds Kafka-related configuration
type KafkaConfig struct {
	Brokers       []string
	ConsumerGroup string
	OrderTopic    string
	DLQTopic      string
	Enabled       bool
}

// ServerConfig holds server-related configuration
type ServerConfig struct {
	Port string
}

// DatabaseConfig holds database-related configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

// Load loads configuration from environment variables with defaults
func Load() *Config {
	loadDotEnv()
	return &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASSWORD", "password"),
			DBName:   getEnv("DB_NAME", "shipping"),
		},
		Kafka: KafkaConfig{
			Brokers:       getEnvAsSlice("KAFKA_BROKERS", []string{"localhost:9092"}),
			ConsumerGroup: getEnv("KAFKA_CONSUMER_GROUP", "shipping-service"),
			OrderTopic:    getEnv("KAFKA_ORDER_TOPIC", "order-events"),
			DLQTopic:      getEnv("KAFKA_DLQ_TOPIC", "shipping-service-dlq"),
			Enabled:       getEnvAsBool("KAFKA_ENABLED", false),
		},
		JWT: JWTConfig{
			PrivateKeyPath:       getEnv("JWT_PRIVATE_KEY_PATH", ""),
			PublicKeyPath:        getEnv("JWT_PUBLIC_KEY_PATH", ""),
			PrivateKeyPEM:        getEnv("JWT_PRIVATE_KEY_PEM", ""),
			PublicKeyPEM:         getEnv("JWT_PUBLIC_KEY_PEM", ""),
			Issuer:               getEnv("JWT_ISSUER", "shipping-service"),
			Audience:             getEnv("JWT_AUDIENCE", "shipping-service"),
			AccessTokenDuration:  getEnvAsInt("JWT_ACCESS_TOKEN_DURATION", 15),
			RefreshTokenDuration: getEnvAsInt("JWT_REFRESH_TOKEN_DURATION", 7),
		},
	}
}

// getEnvAsSlice returns the value of an environment variable as a string slice
func getEnvAsSlice(key string, defaultValue []string) []string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return splitAndTrim(value, ",")
	}
	return defaultValue
}

// getEnvAsBool returns the value of an environment variable as a bool
func getEnvAsBool(key string, defaultValue bool) bool {
	if value, exists := os.LookupEnv(key); exists {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

// splitAndTrim splits a string by separator and trims whitespace
func splitAndTrim(s, sep string) []string {
	parts := make([]string, 0)
	for _, part := range strings.Split(s, sep) {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			parts = append(parts, trimmed)
		}
	}
	return parts
}

// DSN returns the database connection string
func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.User,
		c.Password,
		c.Host,
		c.Port,
		c.DBName,
	)
}

// getEnv returns the value of an environment variable or a default value
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// getEnvAsInt returns the value of an environment variable as int or a default value
func getEnvAsInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
