package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

func main() {
	if path := os.Getenv("ENV_FILE"); path != "" {
		_ = godotenv.Load(path)
	} else {
		_ = godotenv.Load(".env")
		_ = godotenv.Load("apps/api/.env")
	}

	host := getEnv("DB_HOST", "192.168.1.199")
	port := getEnv("DB_PORT", "3307")
	user := getEnv("DB_USER", "root")
	password := getEnv("DB_PASSWORD", "123456")
	dbName := getEnv("DB_NAME", "shipping")

	// Connect without database first
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/", user, password, host, port)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to MySQL server")

	// Create database
	_, err = db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci", dbName))
	if err != nil {
		log.Fatalf("Failed to create database: %v", err)
	}
	log.Printf("Database '%s' created or already exists", dbName)

	// Use the database
	_, err = db.Exec(fmt.Sprintf("USE %s", dbName))
	if err != nil {
		log.Fatalf("Failed to use database: %v", err)
	}

	// Create shippings table
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS shippings (
		id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
		order_id VARCHAR(50) NOT NULL,
		status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
		carrier VARCHAR(50) NULL,
		tracking_number VARCHAR(100) NULL,
		shipping_address TEXT NULL,
		ready_at DATETIME(3) NULL,
		shipped_at DATETIME(3) NULL,
		delivered_at DATETIME(3) NULL,
		version BIGINT UNSIGNED NOT NULL DEFAULT 1,
		created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
		updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
		deleted_at DATETIME(3) NULL,
		PRIMARY KEY (id),
		UNIQUE INDEX idx_shippings_order_id (order_id),
		INDEX idx_shippings_status (status),
		INDEX idx_shippings_deleted_at (deleted_at)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`

	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}
	log.Println("Table 'shippings' created or already exists")

	// Check if sample data exists
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM shippings").Scan(&count)
	if err != nil {
		log.Fatalf("Failed to count records: %v", err)
	}

	if count == 0 {
		// Insert sample data
		sampleData := []struct {
			orderID         string
			status          string
			carrier         *string
			trackingNumber  *string
			shippingAddress string
			hasReadyAt      bool
			hasShippedAt    bool
			version         int
		}{
			{"ORD-001", "CREATED", nil, nil, "〒150-0001 東京都渋谷区神宮前1-2-3 ABCビル 101", false, false, 1},
			{"ORD-002", "READY", nil, nil, "〒160-0022 東京都新宿区新宿3-4-5 XYZマンション 202", true, false, 1},
			{"ORD-003", "READY", nil, nil, "〒530-0001 大阪府大阪市北区梅田1-1-1 グランドタワー 1501", true, false, 1},
			{"ORD-004", "SHIPPED", strPtr("YAMATO"), strPtr("123456789012"), "〒460-0008 愛知県名古屋市中区栄2-3-4 セントラルビル 301", true, true, 2},
			{"ORD-005", "SHIPPED", strPtr("SAGAWA"), strPtr("987654321098"), "〒812-0011 福岡県福岡市博多区博多駅前1-2-3", true, true, 2},
			{"ORD-006", "DELIVERED", strPtr("JAPAN_POST"), strPtr("JP123456789"), "〒980-0021 宮城県仙台市青葉区中央1-1-1", true, true, 3},
			{"ORD-007", "RETURNED", strPtr("YAMATO"), strPtr("111222333444"), "〒060-0001 北海道札幌市中央区北1条西2-3", true, true, 3},
		}

		for _, data := range sampleData {
			query := "INSERT INTO shippings (order_id, status, carrier, tracking_number, shipping_address, ready_at, shipped_at, version) VALUES (?, ?, ?, ?, ?, "
			if data.hasReadyAt {
				query += "NOW(), "
			} else {
				query += "NULL, "
			}
			if data.hasShippedAt {
				query += "NOW(), "
			} else {
				query += "NULL, "
			}
			query += "?)"

			_, err = db.Exec(query, data.orderID, data.status, data.carrier, data.trackingNumber, data.shippingAddress, data.version)
			if err != nil {
				log.Printf("Failed to insert sample data for %s: %v", data.orderID, err)
			}
		}
		log.Println("Sample data inserted")
	} else {
		log.Printf("Sample data already exists (%d records)", count)
	}

	log.Println("Database initialization completed successfully!")
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func strPtr(s string) *string {
	return &s
}
