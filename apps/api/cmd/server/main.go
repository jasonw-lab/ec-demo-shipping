package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/config"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/handler"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/database"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/kafka"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/infra/repository"
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

	// Initialize repository for Kafka handler
	shippingRepo := repository.NewShippingRepository(db)

	// Start Kafka consumer if enabled
	var kafkaConsumer *kafka.Consumer
	if cfg.Kafka.Enabled {
		log.Printf("Kafka enabled, connecting to brokers: %v", cfg.Kafka.Brokers)

		orderEventHandler := kafka.NewOrderEventHandler(shippingRepo)
		kafkaConsumer, err = kafka.NewConsumer(&cfg.Kafka, orderEventHandler)
		if err != nil {
			log.Fatalf("Failed to create Kafka consumer: %v", err)
		}

		if err := kafkaConsumer.Start(); err != nil {
			log.Fatalf("Failed to start Kafka consumer: %v", err)
		}
	} else {
		log.Println("Kafka disabled, skipping consumer initialization")
	}

	// Setup router with config
	router := handler.SetupRouterWithConfig(db, cfg)

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down...")
		if kafkaConsumer != nil {
			if err := kafkaConsumer.Stop(); err != nil {
				log.Printf("Error stopping Kafka consumer: %v", err)
			}
		}
		os.Exit(0)
	}()

	// Start server
	if err := router.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
