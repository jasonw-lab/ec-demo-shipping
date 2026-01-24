package main

import (
	"log"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/config"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/handler"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/database"
)

func main() {
	// Load configuration
	cfg := config.Load()
	log.Printf("Starting server on port %s", cfg.Server.Port)

	// Connect to database
	db, err := database.NewDB(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Setup router
	router := handler.SetupRouter(db)

	// Start server
	if err := router.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
