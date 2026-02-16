# ADR-008: Backend Go 認証・認可技術

**Status:** Proposed  
**Version:** 1.3.0  
**Last Updated:** 2026-02-16  
**Date:** 2026-02-09  
**Decision Makers:** Tech Lead  
**Context:** Shipping Service 認証・認可基盤

---

## 1. 背景 / Context

Shipping Service は EC プラットフォームの一部として、以下のセキュリティ要件を満たす必要がある：

- **管理者向けUI**: 配送担当者・運用担当者がログインして配送管理を行う
- **内部API連携**: Order Service などの他マイクロサービスからのリクエスト認証
- **外部API**: 配送業者連携、Webhook など

マイクロサービス環境において、認証・認可は以下の観点で設計する必要がある：
- 単一障害点の排除
- スケーラビリティ
- サービス間認証
- 監査ログ

**要件定義との関係（shipping-service-requirements.md v0.3.0）**

| フェーズ | 方針 |
|----------|------|
| **Phase 1 (MVP)** | Shipping Service **単独**で認証・認可APIを実装する。`/auth/login` 等の認証エンドポイントを Shipping API に内蔵し、Admin UI が直接 Shipping API と通信する |
| **Phase 2** | BFF / Gateway との結合。ユーザー認証を BFF / Gateway / 外部IdP に移譲し、Shipping API はトークン検証（リソースサーバー）に徹する |

Phase 1 の単独認証は、Phase 2 での BFF 結合・IdP 移行を前提とした設計（JWKS ベースの署名検証）とし、移行コストを最小化する。

---

## 2. 検討した選択肢 / Options

### Option A: セッションベース認証（却下）

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   API    │────▶│  Session │
│          │◀────│  Server  │◀────│   Store  │
└──────────┘     └──────────┘     │  (Redis) │
                                   └──────────┘
```

**メリット**
- 実装がシンプル
- サーバー側でセッション管理可能

**デメリット**
- ✗ ステートフル（スケーリングに課題）
- ✗ マイクロサービス間認証に不向き
- ✗ セッションストアが単一障害点になる

---

### Option B: JWT（JSON Web Token）+ OAuth 2.0（採用）

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   Auth   │────▶│  Token   │
│          │◀────│  Server  │◀────│  Issue   │
└──────────┘     └──────────┘     └──────────┘
      │
      │ JWT
      ▼
┌──────────┐
│ Shipping │  ← JWTを自己検証（署名検証）
│   API    │
└──────────┘
```

**メリット**
- ✓ ステートレス（水平スケーリング容易）
- ✓ 署名検証のみでトークン有効性を確認
- ✓ マイクロサービス間認証に最適
- ✓ 業界標準、ライブラリ充実

**デメリット**
- トークン無効化に工夫が必要
- トークンサイズがセッションIDより大きい

---

### Option C: API Key + HMAC（ユーザー認証としては却下。Webhook受信認証に部分採用 → Section 3.1）

```
Service A ──[API Key + HMAC Signature]──▶ Service B
```

**メリット**
- シンプルな実装
- 低オーバーヘッド

**デメリット**
- ✗ ユーザー認証には不向き
- ✗ キー管理が煩雑

**判定**: ユーザー認証の選択肢としては却下。ただし Webhook 受信時の Signature 検証には HMAC-SHA256 を部分採用する（Section 3.1 参照）。

---

## 3. 決定 / Decision

### 3.1 認証基盤

| 用途 | 方式 | 備考 |
|------|------|------|
| **Admin UI ユーザー認証** | JWT + OAuth 2.0 | 外部IdP連携可能 |
| **サービス間認証** | JWT (Service Account) | 機械間認証 |
| **Webhook受信** | HMAC-SHA256 Signature検証 | 配送業者からのコールバック認証 |
| **Kafka Consumer** | mTLS または SASL | Kafkaクラスタ設定依存 |

**認証サーバー方針（Phase 1）**

Phase 1（MVP）では、Shipping Service 内に軽量なトークン発行・検証機能を内蔵する。専用の認証サーバーは構築しない。

| フェーズ | トークン発行元 | 備考 |
|----------|---------------|------|
| Phase 1 (MVP) | Shipping API 内蔵 | `/auth/login` エンドポイントでJWT発行 |
| Phase 2+ | 外部IdP (Keycloak / Auth0等) | OIDC Discovery で自動連携 |

各サービスは JWKS（公開鍵セット）を用いてJWTを自己検証するため、Phase 2 での IdP 移行時もリソースサーバー側の変更は最小限となる。

### 3.2 使用するGoライブラリ

```go
// JWT処理
"github.com/golang-jwt/jwt/v5"

// OAuth 2.0 / OIDC
"golang.org/x/oauth2"

// Gin Middleware
"github.com/gin-gonic/gin"
```

### 3.3 認可モデル

**RBAC（Role-Based Access Control）を採用**

```
┌─────────────────────────────────────────────────────────┐
│                    Role Definitions                      │
├─────────────┬───────────────────────────────────────────┤
│ Role        │ Permissions                               │
├─────────────┼───────────────────────────────────────────┤
│ admin       │ shipping:*, user:*, system:*             │
│ operator    │ shipping:read, shipping:update           │
│ viewer      │ shipping:read                            │
│ service     │ shipping:create, shipping:read (M2M用)   │
└─────────────┴───────────────────────────────────────────┘
```

**設計方針: roles と permissions の併用**

JWTペイロードに `roles`（ロール）と `permissions`（権限）を両方含める。ロール単位のアクセス制御（管理画面セクションの表示可否など）とパーミッション単位の細粒度制御（個別API操作の許可）を状況に応じて使い分ける。パーミッションはロールから事前展開してトークンに埋め込むことで、認可判定時にDB参照を不要とする。

**マルチテナント方針**

JWTに `tenant_id` を含めるが、Phase 1 ではシングルテナント運用とする。マルチテナント対応（テナント間データ分離、テナント横断アクセス制御）は Phase 2 以降の拡張とし、現時点では `tenant_id` フィールドの予約にとどめる。

---

## 4. 実装方針 / Implementation Strategy

### 4.1 JWT構造 / JWT Structure

JWTのペイロードには、ユーザー識別子（sub）、有効期限（exp）、発行者（iss）に加え、認可に必要なロール（roles）と権限（permissions）を含める。トークン無効化のため `jti`（JWT ID）を必須とする。

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-20260216-01"
  },
  "payload": {
    "iss": "https://auth.example.com",
    "sub": "user-123",
    "jti": "550e8400-e29b-41d4-a716-446655440000",
    "aud": ["shipping-service"],
    "exp": 1707500400,
    "iat": 1707496800,
    "roles": ["operator"],
    "permissions": ["shipping:read", "shipping:update"],
    "tenant_id": "tenant-abc"
  }
}
```

**ペイロードサイズガイドライン**

| 項目 | 方針 |
|------|------|
| Phase 1 想定サイズ | 約 300〜500 bytes（エンコード後）。ロール4種・パーミッション最大10程度 |
| 上限ガイドライン | パーミッション数が **20を超える** 場合は、トークンには `roles` のみを含め、パーミッション解決はサーバーサイドで行う方式に切り替える |
| HTTP ヘッダ制約 | リバースプロキシのデフォルト上限（8KB）を超えないことを保証する |

### 4.2 ミドルウェア設計 / Middleware Design

認証と認可は、それぞれ独立したGinミドルウェアとして実装し、責務を分離する。

1.  **Auth Middleware (認証)**
    *   HTTPヘッダー (`Authorization: Bearer <token>`) からJWTを取得。
    *   署名の検証（公開鍵を使用）とトークンの有効期限チェックを行う。
    *   Redis ブラックリストを参照し、無効化済みトークンを拒否する。
    *   検証成功時、JWT Claims（`sub`, `jti`, `roles`, `permissions`）をコンテキストに格納する。

2.  **RBAC Middleware (認可)**
    *   コンテキストからユーザーの権限情報（Permissions/Roles）を取得。
    *   エンドポイントごとに要求される権限と照合し、アクセスの可否を判定する。

**認証・認可エラーレスポンス**

| HTTP Status | 条件 | レスポンス |
|-------------|------|----------|
| **401 Unauthorized** | トークン未提供、期限切れ、署名不正、ブラックリスト該当 | `{"code": "UNAUTHORIZED", "message": "Authentication required"}` |
| **403 Forbidden** | 認証済みだが権限不足 | `{"code": "FORBIDDEN", "message": "Insufficient permissions"}` |

- エラーレスポンスにトークンの具体的な不正理由（「署名が不正」「期限切れ」等）を含め**ない**（セキュリティ配慮）
- 詳細な認証エラー情報はサーバーサイドの監査ログにのみ出力する（Section 5.8 参照）
- `WWW-Authenticate: Bearer` ヘッダを返却する

### 4.3 ディレクトリ構成 / Directory Structure

認証・認可ロジックは `internal/middleware` に集約し、ビジネスロジックから分離する（[ADR-004](ADR-004-backend-architecture.md) 改善提案「Middlewareディレクトリの追加」の具体化）。

Claims 構造体（認証情報のドメインモデル）は `internal/domain/auth/` に配置し、ミドルウェアとビジネスロジック双方から参照可能とする。Context Key は Go の `type contextKey struct{}` パターンで型安全に管理する（string キーは衝突リスクがあるため不使用）。

```
internal/
├── domain/
│   └── auth/
│       └── claims.go        # AuthClaims 構造体定義
├── middleware/
│   ├── auth.go              # JWT検証、Redis ブラックリスト参照、Context注入
│   ├── rbac.go              # 認可チェック（Role/Permission）
│   └── context.go           # Gin Context ↔ domain Claims アダプタ（型安全なキー管理）
```

---

## 5. セキュリティ考慮事項 / Security Considerations

### 5.1 トークン管理

| 項目 | 設定値 | 理由 |
|------|--------|------|
| Access Token有効期限 | 15分 | 業界標準（Auth0/Okta推奨値）。短期間で失効させセキュリティ向上 |
| Refresh Token有効期限 | 7日 | 週次ログインの業務パターンを想定。ユーザー体験とセキュリティのバランス |
| アルゴリズム | RS256 | 非対称鍵で公開鍵のみ配布可能 |
| Kid (Key ID) | 必須 | 鍵ローテーション対応 |
| JTI (JWT ID) | 必須 | トークン無効化（ブラックリスト）で使用。UUID v4 で発行 |

**Silent Refresh 方針**

配送管理業務は SPA 上での長時間の連続操作が想定されるため、Access Token の有効期限切れによる操作中断を防ぐために Silent Refresh を実装する。

| 項目 | 方針 |
|------|------|
| トリガー | Access Token の残り有効期限が **2分以下** になった時点 |
| 実行方法 | Admin UI（SPA）がバックグラウンドで `/auth/refresh` を非同期呼び出し |
| 失敗時 | ユーザーに再ログインを促すダイアログを表示 |
| 並行リクエスト | Refresh 中のAPIリクエストは旧 Access Token で送信（2分の残存期間で完了を想定） |

### 5.2 トークン無効化戦略

```
┌─────────────────────────────────────────────────────────┐
│                Token Revocation Strategy                 │
├─────────────────────────────────────────────────────────┤
│ 1. 短い有効期限（15分）で自然失効                        │
│ 2. Redis ブラックリストで即時無効化                      │
│ 3. 鍵ローテーションで全トークン無効化                    │
└─────────────────────────────────────────────────────────┘
```

**Redis ブラックリスト設計**

| 項目 | 方針 |
|------|------|
| 保存キー | `token:blacklist:{jti}` — JWT ID ベース |
| 値 | `"1"` （存在チェックのみ） |
| TTL | 対象 Access Token の残り有効期限と一致（最大15分）。自然失効後に Redis キーも自動削除 |
| 参照タイミング | Auth Middleware で **全リクエスト** で参照。Redis `GET` は O(1) で低負荷 |
| Redis 障害時 | フォールバック: JWT 署名検証のみで許可（短い TTL で自然失効に頼る）。監査ログに WARN 出力 |
| 無効化トリガー | ログアウト、パスワード変更、管理者による強制無効化 |

```
Redis Key Design:
  token:blacklist:{jti}                     → value: "1"                TTL: remaining_exp (max 15m)
  token:refresh:{user_id}:{family_id}       → value: refresh_token_hash TTL: 7d
  token:refresh_family:{family_id}          → Set of refresh_token_jti  TTL: 7d
```

### 5.3 サービス間認証

Service Account JWT は短めの有効期限（1時間）と厳格なスコープ制限で発行する。

```json
{
    "sub": "service:order-service",
    "jti": "sa-550e8400-e29b-41d4-a716-446655440000",
    "aud": ["shipping-service"],
    "scope": "shipping:create shipping:read",
    "exp": "<1時間>",
    "iat": "<発行時刻>",
    "iss": "internal-auth"
}
```

> **注記: `scope` と `permissions` の使い分け**
> - **ユーザー向け JWT** (Section 4.1): `permissions` フィールド — 独自 RBAC によるパーミッション展開
> - **Service Account JWT** (本セクション): `scope` フィールド — OAuth 2.0 Client Credentials Grant の仕様 ([RFC 6749 Section 3.3](https://tools.ietf.org/html/rfc6749#section-3.3)) に準拠
>
> これは意図的な使い分けであり、Phase 2 以降の外部 IdP 移行時に標準仕様との互換性を保つための設計判断である。

**Service Account JWT 発行フロー**

| フェーズ | 発行方式 | 資格情報管理 |
|----------|----------|-------------|
| Phase 1 (MVP) | 各サービスが共有 RSA 秘密鍵で自己発行 | 環境変数 or Kubernetes Secret |
| Phase 2+ | 外部 IdP の Client Credentials Grant | IdP 管理コンソール |

- Phase 1 では、呼び出し元サービスが自身の Service Account JWT を自己発行する
- トークンは **有効期限内はメモリキャッシュ** し、期限切れ2分前に再発行する
- 共有公開鍵は JWKS エンドポイントで配布（Section 5.5 と同一メカニズム）

### 5.4 Refresh Token 管理

| 項目 | 方針 |
|------|------|
| 保管場所 | Redis で管理（キー: `token:refresh:{user_id}:{family_id}`） |
| クライアント保持 | HttpOnly Secure Cookie で送信 |
| Token Rotation | Refresh Token 使用時に新しいペアを発行 |
| 失効 | ログアウト時に Redis から即時削除 |
| 不正検知 | Grace Period 経過後の使用済みRefresh Token再利用検知時、Token Family 全体を無効化 |

**Refresh Token Rotation — Grace Period 方式**

複数タブ・複数デバイスでの同時利用時に正当なリクエストが「再利用」と誤検知されることを防ぐため、Grace Period 方式を採用する。

| 項目 | 方針 |
|------|------|
| Grace Period | Refresh Token 使用後、旧トークンを **30秒間** 有効とする |
| Grace Period 内の再利用 | 正当とみなし、**同一の新トークンペア** を返却する |
| Grace Period 経過後の再利用 | 不正と判断し、Token Family 全体を無効化 |
| Token Family | 初回ログイン時に `family_id` (UUID) を発行し、Refresh Token に埋め込む |
| 不正検知時の処理 | `family_id` に属する全 Refresh Token を Redis から削除し、該当ユーザーに再ログインを要求 |

### 5.5 公開鍵配布（JWKS）と鍵ローテーション

各サービスがJWTを自己検証するために、公開鍵は JWKS（JSON Web Key Set）エンドポイントで配布する。

| 項目 | 方針 |
|------|------|
| 配布方式 | `/.well-known/jwks.json` エンドポイント |
| キャッシュ | 各サービスで公開鍵をメモリキャッシュ（TTL: 1時間） |
| ローテーション | `kid` ヘッダーで鍵識別、新旧鍵の並行運用期間を設ける |

**鍵ローテーション詳細**

| 項目 | 方針 |
|------|------|
| 定期ローテーション | 90日ごと |
| 緊急ローテーション | 鍵漏洩時に即時実行 |
| 並行運用期間 | 旧鍵は新鍵発行後 **24時間** 有効（Access Token TTL 15分より十分長い） |
| `kid` 命名規則 | `key-{YYYYMMDD}-{seq}` 例: `key-20260216-01`。同日内の複数ローテーションにも対応 |
| 運用手順 | 別途運用ドキュメント（ops-runbook）に記載 |

### 5.6 CORS ポリシーと CSRF 対策

Admin UI と API が異なるオリジンで稼働する構成を想定し、以下の方針で CORS を設定する。

| 項目 | 方針 |
|------|------|
| 許可オリジン | 環境変数で明示的に指定（ワイルドカード禁止） |
| 許可メソッド | GET, POST, PUT, DELETE, OPTIONS |
| 許可ヘッダー | Authorization, Content-Type |
| Credentials | `Access-Control-Allow-Credentials: true` |

**CSRF 対策**

CSRF リスクは以下の多層防御により限定的であり、別途 CSRF Token の発行・検証は不要と判断する。

1. **Access Token は `Authorization: Bearer` ヘッダで送信**（Cookie ではない）→ 通常の API 呼び出しは CSRF 対象外
2. **Refresh Token Cookie は `SameSite=Strict`** に設定 → クロスサイトからの `/auth/refresh` 呼び出しをブラウザレベルで遮断
3. **CORS ポリシー** で許可オリジンを明示的に限定 → 不正オリジンからのリクエストを拒否

### 5.7 Rate Limiting

認証エンドポイントへのブルートフォース攻撃・DoS 対策として Rate Limiting を適用する。

| 対象 | 制限 | 備考 |
|------|------|------|
| `/auth/login` | 5回/分（IPあたり） | ログイン試行制限 |
| `/auth/refresh` | 10回/分（IPあたり） | Token再発行制限 |
| 一般API | 100回/分（ユーザーあたり） | 通常利用想定 |

### 5.8 監査ログ

認証・認可に関するイベントは、以下の方針で監査ログを出力する（要件定義 Section 6「構造化ログ（JSON）出力」に準拠）。

| イベント | ログレベル | 含める情報 |
|---------|-----------|-----------|
| ログイン成功 | INFO | `sub`, IP, User-Agent, timestamp |
| ログイン失敗 | WARN | 入力ユーザーID, IP, User-Agent, 失敗理由（内部ログのみ） |
| トークン更新（Silent Refresh） | INFO | `sub`, `family_id`, IP |
| 権限不足アクセス | WARN | `sub`, リクエストパス, 要求権限, 保有権限 |
| トークン無効化（ブラックリスト追加） | WARN | `sub`, `jti`, 無効化理由 |
| 鍵ローテーション | INFO | 旧 `kid`, 新 `kid` |
| Redis フォールバック発動 | WARN | Redis 接続エラー詳細、影響範囲 |

- ログ保持期間・ローテーション方針は運用ドキュメント（ops-runbook）に委譲する
- 認証エラーの詳細理由はクライアントには返却しない（Section 4.2 のエラーレスポンスポリシー参照）

### 5.9 TLS / HTTPS 方針

JWT を HTTP ヘッダで送信し、Refresh Token を Cookie で管理する設計のため、通信経路の暗号化は必須前提とする。

| 環境 | TLS | Secure Cookie | SameSite | 備考 |
|------|-----|---------------|----------|------|
| **本番** | HTTPS 必須 | 有効 | Strict | TLS 終端は LB / Ingress |
| **ステージング** | HTTPS 必須 | 有効 | Strict | 本番同等構成 |
| **開発** | HTTP 許容 | 無効 | Lax | ローカル開発の利便性を優先 |

---

## 6. 決定理由 / Rationale

| 要件 | 採用技術が満たす理由 |
|------|----------------------|
| **スケーラビリティ** | JWT はステートレス、自己完結型 |
| **マイクロサービス連携** | 署名検証のみで認証可能 |
| **監査対応** | JWT Claims でユーザー追跡可能 |
| **将来の拡張** | OAuth 2.0 / OIDC で外部IdP連携可能 |
| **Goエコシステム** | golang-jwt/jwt は成熟したライブラリ |
| **トークン即時無効化** | Redis ブラックリストにより15分以内の即時無効化が可能 |

---

## 7. 結果 / Consequences

### ポジティブ
- ✓ 水平スケーリング容易
- ✓ サービス間認証が統一
- ✓ 認可ロジックの一元管理
- ✓ 監査ログに必要な情報がトークンに含まれる
- ✓ Redis ブラックリストによるトークン即時無効化
- ✓ Grace Period によるRefresh Token Race Conditionの回避

### ネガティブ / トレードオフ
- △ Redis への依存（ブラックリスト・Refresh Token管理）。ただしフォールバック方針あり
- △ トークンサイズがセッションIDより大きい（ペイロードサイズガイドラインで制御）
- △ 公開鍵配布・ローテーション運用が必要（90日サイクル・緊急対応手順を定義済み）

---

## 8. 将来の拡張 / Future Considerations

### Phase ロードマップ

| Phase | スコープ | 認証 | 認可 | 備考 |
|-------|---------|------|------|------|
| **Phase 1 (MVP)** | **単独の認証・認可API実装** | Shipping API 内蔵 JWT発行・検証 + Redis | RBAC (roles/permissions) | **現在** |
| **Phase 2** | **BFF / Gateway との結合** | 外部IdP (Keycloak/Auth0) + BFF/Gateway | RBAC（IdP管理） | ユーザー認証を移譲 |
| **Phase 3** | 高度な認可 | 同上 | ABAC, OPA連携 | パーミッション → イントロスペクション方式 |
| **Phase 4** | ゼロトラスト | mTLS, SPIFFE/SPIRE | ワークロードID | サービスメッシュ |

### Phase 1 (MVP): 単独の認証・認可API実装 ← 現在
- Shipping API 内に認証エンドポイント（`/auth/login`, `/auth/refresh`, `/auth/logout`）を実装
- JWT 発行・検証・無効化（Redis ブラックリスト）を Shipping Service 単体で完結
- Admin UI は Shipping API に直接通信
- BFF / Gateway は構築しない

### Phase 2: BFF / Gateway との結合
- Keycloak / Auth0 / Okta など OIDC対応IdP の導入
- SSO（シングルサインオン）対応
- BFF / Gateway でのユーザー認証一元化
- Shipping API はリソースサーバー（トークン検証のみ）に移行
- Phase 1 の `/auth/*` エンドポイントは廃止（BFF / IdP に移譲）

### Phase 3: 高度な認可
- ABAC（Attribute-Based Access Control）
- OPA（Open Policy Agent）連携
- パーミッション数が上限（20）を超える場合、JWT ペイロードから roles のみに切り替え、パーミッション解決はサーバーサイドで実施

### Phase 4: ゼロトラストアーキテクチャ
- mTLS によるサービスメッシュ認証
- SPIFFE/SPIRE によるワークロードID

---

## 9. 関連ドキュメント / References

- [ADR-002: Backend Framework (Gin + GORM)](ADR-002-backend-framework-gin-gorm.md)
- [ADR-004: Backend Architecture](ADR-004-backend-architecture.md)
- [Shipping Service 要件定義 v0.3.0](../design/shipping-service-requirements.md)
- [RFC 7519: JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [RFC 6749: OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [golang-jwt/jwt](https://github.com/golang-jwt/jwt)

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0.0 | 2026-02-09 | 初版作成 |
| 1.1.0 | 2026-02-10 | QA1 指摘反映（Refresh Token管理、CORS、Rate Limiting、JWKS、認証サーバー方針、Webhook認証、マルチテナント方針、scope/permissions使い分け等を追加） |
| 1.2.0 | 2026-02-16 | QA2 指摘反映（要件定義との整合性明記、Redisブラックリスト詳細設計、Silent Refresh方針、Grace Period + Token Family、エラーレスポンス定義、Claims配置、監査ログ、TLS方針、CSRF対策、Phaseロードマップ等を追加） |
| 1.3.0 | 2026-02-16 | Phase 1 を「単独の認証・認可API実装」に明確化。Phase 2 を「BFF / Gateway との結合」に変更。要件定義 v0.3.0 との整合 |

---

**ADR-008 は Shipping Service の認証・認可技術に関する方針決定とする。**
