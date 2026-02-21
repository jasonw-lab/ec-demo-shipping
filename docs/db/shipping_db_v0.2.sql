-- ============================================================
-- Shipping Service Database Schema
-- Version: 0.2.0
-- Date: 2026-02-16
-- Description: shippings + 認証・認可テーブル (ADR-008 Phase 1)
-- ============================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS shipping
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shipping;

-- ============================================================
-- 1. Shipping Domain
-- ============================================================

-- 発送管理テーブル
CREATE TABLE IF NOT EXISTS shippings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id VARCHAR(50) NOT NULL COMMENT '注文ID（Order Service 由来）',
  status VARCHAR(20) NOT NULL DEFAULT 'CREATED' COMMENT 'CREATED|READY|SHIPPED|DELIVERED|RETURNED|CANCELLED',
  carrier VARCHAR(50) NULL COMMENT '配送業者 (YAMATO|SAGAWA|JAPAN_POST)',
  tracking_number VARCHAR(100) NULL COMMENT '追跡番号',
  shipping_address TEXT NULL COMMENT '配送先住所（Order からスナップショット）',
  ready_at DATETIME(3) NULL COMMENT '出荷指示日時',
  shipped_at DATETIME(3) NULL COMMENT '出荷完了日時',
  delivered_at DATETIME(3) NULL COMMENT '配送完了日時',
  version BIGINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '楽観ロック用バージョン',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL COMMENT '論理削除',
  PRIMARY KEY (id),
  UNIQUE INDEX idx_shippings_order_id (order_id),
  INDEX idx_shippings_status (status),
  INDEX idx_shippings_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='発送管理';

-- ============================================================
-- 2. Authentication & Authorization (ADR-008 Phase 1)
--    RBAC: users → user_roles → roles → role_permissions → permissions
--    Refresh Token: Redis管理 (DBには保持しない)
-- ============================================================

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL COMMENT 'ログインID',
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt ハッシュ',
  display_name VARCHAR(100) NOT NULL COMMENT '表示名',
  email VARCHAR(255) NULL COMMENT 'メールアドレス',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '有効フラグ (1=有効, 0=無効)',
  tenant_id VARCHAR(50) NOT NULL DEFAULT 'default' COMMENT 'テナントID (Phase 1: シングルテナント)',
  last_login_at DATETIME(3) NULL COMMENT '最終ログイン日時',
  version BIGINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '楽観ロック用バージョン',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL COMMENT '論理削除',
  PRIMARY KEY (id),
  UNIQUE INDEX idx_users_username (username),
  INDEX idx_users_tenant_id (tenant_id),
  INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ユーザー（認証）';

-- ロールテーブル
CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL COMMENT 'ロールコード (admin|operator|viewer|service)',
  name VARCHAR(100) NOT NULL COMMENT 'ロール名（表示用）',
  description VARCHAR(255) NULL COMMENT '説明',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE INDEX idx_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ロール定義';

-- パーミッションテーブル
CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL COMMENT 'パーミッションコード (例: shipping:read)',
  name VARCHAR(100) NOT NULL COMMENT 'パーミッション名（表示用）',
  description VARCHAR(255) NULL COMMENT '説明',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE INDEX idx_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='パーミッション定義';

-- ロール ↔ パーミッション 中間テーブル
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ロール・パーミッション紐付け';

-- ユーザー ↔ ロール 中間テーブル
CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ユーザー・ロール紐付け';

-- 認証監査ログテーブル (ADR-008 Section 5.8)
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(30) NOT NULL COMMENT 'LOGIN_SUCCESS|LOGIN_FAILURE|TOKEN_REFRESH|TOKEN_REVOKE|ACCESS_DENIED|KEY_ROTATION',
  user_id BIGINT UNSIGNED NULL COMMENT 'ユーザーID（不明の場合 NULL）',
  username VARCHAR(50) NULL COMMENT 'ログイン試行時のユーザー名',
  ip_address VARCHAR(45) NULL COMMENT 'クライアントIPアドレス (IPv6対応)',
  user_agent VARCHAR(500) NULL COMMENT 'User-Agent ヘッダ',
  request_path VARCHAR(255) NULL COMMENT 'リクエストパス',
  detail JSON NULL COMMENT '追加情報（JSON）',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_auth_audit_event_type (event_type),
  INDEX idx_auth_audit_user_id (user_id),
  INDEX idx_auth_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='認証・認可監査ログ';

-- ============================================================
-- 3. Redis Key Design (参考: DBには格納しない)
-- ============================================================
-- token:blacklist:{jti}                    → value: "1"                TTL: remaining_exp (max 15m)
-- token:refresh:{user_id}:{family_id}      → value: refresh_token_hash TTL: 7d
-- token:refresh_family:{family_id}         → Set of refresh_token_jti  TTL: 7d
-- rate_limit:login:{ip}                    → value: count              TTL: 60s
-- rate_limit:refresh:{ip}                  → value: count              TTL: 60s
