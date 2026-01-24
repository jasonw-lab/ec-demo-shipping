-- Shipping Service Database Initialization Script
-- Version: 1.0.0

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS shipping
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shipping;

-- Create shippings table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for development/testing
INSERT INTO shippings (order_id, status, carrier, tracking_number, shipping_address, ready_at, shipped_at, version) VALUES
  ('ORD-001', 'CREATED', NULL, NULL, '〒150-0001 東京都渋谷区神宮前1-2-3 ABCビル 101', NULL, NULL, 1),
  ('ORD-002', 'READY', NULL, NULL, '〒160-0022 東京都新宿区新宿3-4-5 XYZマンション 202', NOW(), NULL, 1),
  ('ORD-003', 'READY', NULL, NULL, '〒530-0001 大阪府大阪市北区梅田1-1-1 グランドタワー 1501', NOW(), NULL, 1),
  ('ORD-004', 'SHIPPED', 'YAMATO', '123456789012', '〒460-0008 愛知県名古屋市中区栄2-3-4 セントラルビル 301', NOW(), NOW(), 2),
  ('ORD-005', 'SHIPPED', 'SAGAWA', '987654321098', '〒812-0011 福岡県福岡市博多区博多駅前1-2-3', NOW(), NOW(), 2),
  ('ORD-006', 'DELIVERED', 'JAPAN_POST', 'JP123456789', '〒980-0021 宮城県仙台市青葉区中央1-1-1', NOW(), NOW(), 3),
  ('ORD-007', 'RETURNED', 'YAMATO', '111222333444', '〒060-0001 北海道札幌市中央区北1条西2-3', NOW(), NOW(), 3);
