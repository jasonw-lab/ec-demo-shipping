# 発送管理システム (Shipping Service) 要件定義

**Version:** 0.5.0
**Status:** Approved (Roles API Added)

---

## 1. 目的と背景

### 1.1 目的
- 既存 EC システム（ec-demo）に対する発送管理機能の分離・提供
- 物流ドメインを独立したマイクロサービスとして定義する
- 非同期連携を前提とした実務的なアーキテクチャを採用する

### 1.2 背景
既存の ec-demo は、注文・決済・在庫までを同期的な分散トランザクションで管理している。  
一方、発送業務は物理的な作業時間を伴い、外部要因（倉庫作業・配送業者）に強く依存するため、  
**結果整合性（Eventual Consistency）を前提とした非同期設計**が適している。

---

## 2. 前提条件・制約事項（Scope Management）

### 2.1 業務制約（MVPスコープ）
1. **1注文 = 1発送（シングルシップメント）**
2. **READY 以降の住所変更は不可**
3. **配送業者 API 連携は行わない（手動入力のみ）**

### 2.2 技術制約
- Order Service との整合性は Kafka による非同期連携とする
- 分散トランザクション（Seata / Saga）は使用しない

**認証・認可の段階的実装方針**

| フェーズ | 方針 | 備考 |
|----------|------|------|
| Phase 1 (MVP) | Shipping Service **単独**で認証・認可APIを実装 | `/auth/login` 等の認証エンドポイントを Shipping API に内蔵。Admin UI が直接 Shipping API と通信する |
| Phase 2 | BFF / Gateway との結合 | ユーザー認証を BFF / Gateway / 外部IdP に移譲。Shipping API はトークン検証（リソースサーバー）に徹する |

技術詳細は [ADR-008: 認証・認可技術](../adr/ADR-008-authentication-authorization.md) を参照。

---

## 3. 業務フローとステータス定義

| ステータス | コード | 定義 |
|---|---|---|
| CREATED | 10 | 注文確定直後、作業未着手 |
| READY | 20 | 出荷指示済み（業務上の Cut-off） |
| SHIPPED | 30 | 配送業者へ引き渡し完了 |
| DELIVERED | 40 | 配送完了（将来拡張） |
| RETURNED | 90 | 返送対応（受取拒否、宛所不明等） |
| CANCELLED | 99 | 発送前キャンセル |

### 3.1 ステータス遷移ルール
- **許可:**
  - CREATED → READY: 出荷指示
  - CREATED → CANCELLED: キャンセル
  - READY → SHIPPED: 出荷完了登録
  - READY → CANCELLED: 出荷前キャンセル
  - SHIPPED → RETURNED: 返送
- **禁止:**
  - SHIPPED → READY: 逆戻り禁止
  - 完了後の変更: SHIPPED 後のステータス変更は原則不可（RETURNED除く）

---

## 4. 機能要件（API）

### 4.1 認証 API

| Method | Endpoint | 説明 | 権限 |
|---|---|---|---|
| POST | /api/v1/auth/login | ログイン（JWT 発行） | 全ユーザー |
| POST | /api/v1/auth/refresh | Access Token 更新 | 認証済み |
| POST | /api/v1/auth/logout | ログアウト（トークン無効化） | 認証済み |

#### ログイン API 詳細

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
- Access Token: レスポンスボディに含める
- Refresh Token: `Set-Cookie` ヘッダで HttpOnly Cookie として送信
- ユーザー情報（id, username, display_name, email, roles, permissions）を返却

**Rate Limiting:**
- `/auth/login`: 5回/分（IPあたり）
- `/auth/refresh`: 10回/分（IPあたり）

詳細は [ADR-008](../adr/ADR-008-authentication-authorization.md) Section 5 を参照。

---

### 4.2 ユーザー管理 API

#### 4.2.1 プロフィール（自分自身の操作）

| Method | Endpoint | 説明 | 権限 |
|---|---|---|---|
| GET | /api/v1/users/me | 自分のプロフィール取得 | 認証済み（全ロール） |
| PUT | /api/v1/users/me | 自分のプロフィール更新（表示名・メール） | 認証済み（全ロール） |
| PUT | /api/v1/users/me/password | 自分のパスワード変更 | 認証済み（全ロール） |

#### 4.2.2 ユーザー管理（admin 専用）

| Method | Endpoint | 説明 | 権限 |
|---|---|---|---|
| GET | /api/v1/users | ユーザー一覧取得（検索・フィルタ） | user:read |
| POST | /api/v1/users | ユーザー新規作成 | user:create |
| GET | /api/v1/users/:id | ユーザー詳細取得 | user:read |
| PUT | /api/v1/users/:id | ユーザー情報更新（表示名・メール・ロール変更） | user:update |
| PUT | /api/v1/users/:id/status | ユーザー有効/無効切替 | user:delete |
| PUT | /api/v1/users/:id/password | パスワードリセット（管理者） | user:update |

#### 4.2.3 ロール・パーミッション参照 API（admin 専用）

| Method | Endpoint | 説明 | 権限 |
|---|---|---|---|
| GET | /api/v1/roles | ロール一覧取得 | user:read |
| GET | /api/v1/roles/:id/permissions | ロールのパーミッション一覧 | user:read |

**ユーザー管理の業務ルール:**
- ユーザー名（username）は作成後に変更不可
- 自分自身のロール変更・無効化は不可
- service ロールのユーザーは管理画面の一覧に表示しない
- ユーザー無効化時、対象ユーザーの全 Access Token をブラックリストに追加（即時ログアウト）
- パスワードリセット時も全トークンを無効化（強制再ログイン）
- パスワードは bcrypt でハッシュ化して保存（cost factor: 10）

#### 4.2.3 初期ユーザーセットアップ

- アプリケーション初回起動時に、環境変数から初期 admin ユーザーを自動作成
- 既にユーザーが存在する場合はスキップ

| 環境変数 | 説明 | デフォルト値 |
|----------|------|-------------|
| `ADMIN_USERNAME` | 初期管理者ユーザー名 | `admin` |
| `ADMIN_PASSWORD` | 初期管理者パスワード | （必須・デフォルト値なし） |
| `ADMIN_EMAIL` | 初期管理者メール | `admin@example.com` |
| `ADMIN_DISPLAY_NAME` | 初期管理者表示名 | `管理者` |

---

### 4.3 発送一覧・詳細 API

| Method | Endpoint | 説明 |
|---|---|---|
| GET | /api/v1/shipments | 発送一覧取得（検索・フィルタ） |
| GET | /api/v1/shipments/{order_id} | 発送詳細取得 |
| PUT | /api/v1/shipments/{order_id} | 発送情報更新（楽観ロック） |

---

### 4.4 Dashboard 集計用 API

**目的:**  
Dashboard 上部に表示する各ステータス件数を、**1リクエストで効率的に取得**する。

| Method | Endpoint | 説明 |
|---|---|---|
| GET | /api/v1/shipments/summary | 発送ステータス別件数を取得 |

#### Response（例）
```json
{
  "created": 10,
  "ready": 5,
  "shipped_today": 8,
  "returned": 1
}
```

- Dashboard 表示は **必ず本 API を使用**する
- 一覧 API の全件取得・count で代替しないこと

---

## 5. データモデル（概要）

### 5.1 Shipping

```go
type Shipping struct {
    ID              uint64     `json:"id" gorm:"primaryKey"`
    OrderID         string     `json:"order_id" gorm:"uniqueIndex;type:varchar(50);not null"`
    Status          string     `json:"status" gorm:"type:varchar(20);not null"`
    Carrier         string     `json:"carrier" gorm:"type:varchar(50)"`
    TrackingNumber  string     `json:"tracking_number" gorm:"type:varchar(100)"`
    
    // Address Snapshot (非正規化: Orderからコピー)
    ShippingAddress string     `json:"shipping_address" gorm:"type:text"`
    
    // Status Timestamps
    ReadyAt         *time.Time `json:"ready_at"`
    ShippedAt       *time.Time `json:"shipped_at"`
    DeliveredAt     *time.Time `json:"delivered_at"`
    
    // Metadata
    Version         uint64     `json:"version" gorm:"default:1"`
    CreatedAt       time.Time  `json:"created_at"`
    UpdatedAt       time.Time  `json:"updated_at"`
    DeletedAt       *time.Time `json:"deleted_at" gorm:"index"`
}
```

### 5.2 User

```go
type User struct {
    ID           uint64     `json:"id" gorm:"primaryKey"`
    Username     string     `json:"username" gorm:"uniqueIndex;type:varchar(50);not null"`
    PasswordHash string     `json:"-" gorm:"type:varchar(255);not null"`  // JSONに出力しない
    DisplayName  string     `json:"display_name" gorm:"type:varchar(100);not null"`
    Email        *string    `json:"email" gorm:"type:varchar(255)"`
    IsActive     bool       `json:"is_active" gorm:"not null;default:true"`
    TenantID     string     `json:"tenant_id" gorm:"type:varchar(50);not null;default:'default'"`
    LastLoginAt  *time.Time `json:"last_login_at"`
    Version      uint64     `json:"version" gorm:"default:1"`
    CreatedAt    time.Time  `json:"created_at"`
    UpdatedAt    time.Time  `json:"updated_at"`
    DeletedAt    *time.Time `json:"deleted_at" gorm:"index"`
}
```

### 5.3 認証・認可テーブル

RBAC モデルの詳細は [ADR-008](../adr/ADR-008-authentication-authorization.md) および [shipping_db_v0.2.sql](../db/shipping_db_v0.2.sql) を参照。

| テーブル | 説明 |
|----------|------|
| users | ユーザー（認証） |
| roles | ロール定義（admin / operator / viewer / service） |
| permissions | パーミッション定義 |
| role_permissions | ロール ↔ パーミッション紐付け |
| user_roles | ユーザー ↔ ロール紐付け |
| auth_audit_logs | 認証・認可監査ログ |

---

## 6. 非機能要件

- **整合性:** Kafka イベントの冪等処理
- **同時更新:** version による楽観ロック
- **可観測性:** 構造化ログ（JSON）出力
- **拡張性:** 配送業者 API / ステータス自動更新に対応可能な設計
- **セキュリティ:** JWT + RBAC による認証・認可（ADR-008 参照）

---

## 7. アーキテクチャ方針（確定）

- Go における **Standard Go Layout** を採用
  - `cmd/`
  - `internal/handler`
  - `internal/service`
  - `internal/repository`
  - `internal/middleware` — 認証・認可ミドルウェア
  - `internal/domain/auth` — 認証ドメインモデル
- 過度な Clean Architecture は採用しない
- 実装は MVP スコープを厳守する

---

本ドキュメントは、以下と整合していることを保証する。

- UI 設計: ui-dashboard-design.md v0.3.0  
- UI ↔ API I/F: ui-api-interface-mapping.md v0.6.0  
- ADR-008: 認証・認可技術 v1.3.0  
- DB スキーマ: shipping_db_v0.2.sql  
- 画面設計: SCR-001 〜 SCR-003, SCR-010, SCR-020, SCR-030  

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 0.2.2 | — | Architecture Review Applied |
| 0.3.0 | 2026-02-16 | Section 2.2: 認証・認可の段階的実装方針（Phase 1: 単独実装 / Phase 2: BFF結合）を追加。ADR-008参照を追加 |
| 0.4.0 | 2026-02-16 | ユーザー管理機能を追加。Section 4.1 認証API、Section 4.2 ユーザー管理API、Section 5.2 Userデータモデル、初期ユーザーセットアップ方針を追加。画面設計（SCR-010/020/030）との整合 |
| 0.5.0 | 2026-02-16 | Roles API を追加。マッピングドキュメント参照を v0.6.0 に更新 |

**Shipping Service 要件定義の最新版（v0.5.0）とする。**
