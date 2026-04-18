package config

import (
	"os"

	"github.com/joho/godotenv"
)

// loadDotEnv attempts to load env vars from a .env file.
// It is intentionally best-effort and does nothing if no file is found .
func loadDotEnv() {
	if path := os.Getenv("ENV_FILE"); path != "" {
		_ = godotenv.Load(path)
		return
	}

	if _, err := os.Stat(".env"); err == nil {
		_ = godotenv.Load(".env")
		return
	}

	// When running from repo root, `apps/api/.env` is the likely location.
	if _, err := os.Stat("apps/api/.env"); err == nil {
		_ = godotenv.Load("apps/api/.env")
		return
	}
}
