# ADR-008: Backend Go 認証・認可技術 — QA2

## 2026-02-16T19:27 指摘者： Antigravity (Gemini)

> 対象バージョン: v1.1.0 (2026-02-10)
> 前回QA (_qa.md) の指摘反映後のセカンドレビュー

---

### 前回QA指摘の反映状況

| QA1指摘 | 状況 | コメント |
|---------|------|----------|
| Q1: AGENT.md にADR-008未登録 | **未対応** | AGENT.md のADR一覧はADR-006までのまま。ADR-007, ADR-008を追記すべき |
| Q2: Section 5.3 のコードブロック言語指定 | **対応済** | `json` に修正されている |
| Q3: roles と permissions 両方含める根拠 | **対応済** | Section 3.3 に設計方針として明記された |
| Q4: Refresh Token の保管場所・仕組み | **対応済** | Section 5.4 に詳細追加 |
| Q5: CORS設定 | **対応済** | Section 5.6 に追加 |
| Q6: Rate Limiting | **対応済** | Section 5.7 に追加 |
| Q7: 公開鍵の配布メカニズム | **対応済** | Section 5.5 にJWKS方針追加 |
| Q8: Auth Serverの責務と所在 | **対応済** | Section 3.1 に認証サーバー方針（Phase 1）追加 |
| Q9: Webhook認証方式 | **対応済** | Section 3.1 の表にHMAC-SHA256追加 |
| Q10: ADR-004との相互参照 | **対応済** | Section 4.3 にADR-004参照を追記 |
| Q11: マルチテナント対応の深掘り | **対応済** | Section 3.3 にマルチテナント方針追加 |

**総評**: 前回指摘11件中10件が対応済み。Q1（AGENT.md更新）のみ未対応。

---

### I. セキュリティ設計の深掘り

- Q1: **Access Token 15分 + Refresh Token 7日の根拠が薄い**
  Section 5.1 で Access Token 15分、Refresh Token 7日と定めているが、これらの値の選定根拠が「短期間で失効させセキュリティ向上」「ユーザー体験とセキュリティのバランス」と抽象的である。Shipping Service の業務特性（配送管理は長時間の連続操作が想定される）を踏まえると、15分は短すぎる可能性がある。
  - **提案**: 業務シナリオ（配送一覧の確認→詳細表示→ステータス更新→一覧に戻る等）の想定操作時間を基に有効期限を決定する旨を補足記載すべき。Silent Refresh（バックグラウンドでの自動トークン更新）の実装方針にも触れるべき。

- Q2: **Redis ブラックリストの具体的な運用方針が不足**
  Section 5.2 で「緊急時: Redis ブラックリストで即時無効化」と記載があるが、以下が未定義：
  - ブラックリストに格納するキー（`jti` か `sub` か）
  - ブラックリストのTTL方針（Access TokenのTTLと一致させるべき）
  - ブラックリスト参照のパフォーマンス影響（全リクエストで参照するか、特定条件のみか）
  - Redis障害時のフォールバック方針
  - **提案**: Phase 1 では Redis ブラックリストを使用しない（短いAccess TokenのTTLで自然失効に頼る）と明記するか、使用する場合は `jti` ベースのブラックリスト設計を記載すべき。

- Q3: **JWT ペイロード肥大化のリスクへの言及がない**
  Section 3.3 で `roles` と `permissions` を両方ペイロードに含め、さらに `tenant_id` も含める設計としている。パーミッションが増加した場合（例: 将来的にABACを導入する Phase 3）、トークンサイズが数KBに膨らむリスクがある。
  - HTTPヘッダサイズ上限（一般的なリバースプロキシのデフォルトは8KB）を超える可能性
  - ネットワーク帯域への影響（全リクエストにJWTが付与される）
  - **提案**: パーミッション数の上限ガイドラインを設けるか、パーミッション数が閾値を超える場合はイントロスペクション方式に切り替える方針を記載すべき。

- Q4: **Refresh Token Rotation における競合問題（Race Condition）の考慮がない**
  Section 5.4 で「Refresh Token 使用時に新しいペアを発行」「使用済みRefresh Tokenの再利用検知時、該当ユーザーの全トークンを無効化」と記載があるが、以下のシナリオが未考慮：
  - 複数タブ・複数デバイスで同時にRefresh Tokenを使用した場合、正当なリクエストが「再利用」と誤検知される可能性がある
  - **提案**: Refresh Token Family（同一セッションの複数Refresh Tokenをグループ管理）の概念を導入するか、短いGrace Period（例: 数秒間は旧トークンも有効）を設ける方針を記載すべき。

---

### II. 実装設計の具体性

- Q5: **ミドルウェアのエラーレスポンス形式が未定義**
  Section 4.2 でAuth MiddlewareとRBAC Middlewareを定義しているが、認証失敗・認可失敗時のレスポンス形式が明記されていない。
  - 401 Unauthorized と 403 Forbidden の使い分け基準
  - エラーレスポンスのJSON構造（エラーコード体系）
  - セキュリティ上の配慮（認証エラー時に詳細情報を漏洩させない）
  - **提案**: 以下を明記すべき：
    - 401: トークン未提供、期限切れ、署名不正
    - 403: 権限不足
    - エラーメッセージにトークンの具体的な不正理由を含めない（セキュリティ上の理由）

- Q6: **`context.go` の役割が過小に見える**
  Section 4.3 のディレクトリ構成で `context.go` を「Context操作ヘルパー」としているが、以下の設計判断が不明：
  - Contextに格納するユーザー情報の構造体定義はどこに配置するか（`middleware/` か `domain/` か）
  - Context Key の型安全な管理方法（string キーは衝突リスクあり）
  - **提案**: ユーザー情報の構造体（Claims）は `domain/` 層に配置し、`context.go` はそれを Gin Context に出し入れするアダプタとすべき。これによりドメイン層のテスタビリティが向上する。

- Q7: **Service Account JWT の発行フローが未記載**
  Section 5.3 でサービス間認証にService Account JWTを使用すると定めているが、以下が未定義：
  - Service Account の資格情報（Client ID / Client Secret）をどう管理するか
  - JWT発行はどのサービスが行うか（Shipping API自身か、共通の認証サービスか）
  - トークンのキャッシュ方針（毎回発行するか、有効期限内はキャッシュするか）
  - **提案**: Phase 1 では各サービスが共有秘密鍵で自己発行し、Phase 2 で IdP に一本化する方針を明記すべき。

---

### III. 運用・監査の観点

- Q8: **監査ログの具体的な出力方針が不足**
  Section 6 の決定理由で「JWT Claims でユーザー追跡可能」と記載しているが、具体的な監査ログ要件が未定義：
  - どのイベントをログに記録するか（ログイン成功/失敗、権限不足アクセス、トークン更新等）
  - ログに含めるべき情報（`sub`, `tenant_id`, IP アドレス, User-Agent, リクエストパス等）
  - ログ保持期間・ローテーション方針
  - **提案**: Section 5 に「5.8 監査ログ」を追加し、最低限のログイベント一覧と出力形式を定めるべき。特に認証系イベントのログは PCI-DSS 等のコンプライアンス要件で求められる場合が多い。

- Q9: **鍵ローテーションの具体的な運用手順が不足**
  Section 5.5 で「新旧鍵の並行運用期間を設ける」と記載があるが、以下が未定義：
  - ローテーションの頻度（定期 / イベントトリガー）
  - 並行運用期間の長さ（旧鍵の有効期限はどの程度か）
  - ローテーションのトリガー条件（定期更新 / 鍵漏洩時の緊急対応）
  - `kid` の命名規則（`key-2026-02` は年月ベースだが、緊急ローテーション時に衝突しないか）
  - **提案**: `kid` は `key-{YYYYMMDD}-{sequence}` 形式にし、同月内の複数ローテーションにも対応可能にすべき。運用手順はADR外の運用ドキュメントに委譲する旨を明記するのでもよい。

---

### IV. 整合性・記述の改善

- Q10: **AGENT.md の ADR 一覧が未更新（QA1-Q1の再指摘）**
  前回QAで指摘済みだが未対応。AGENT.md の `ADR (Architecture Decision Records)` セクションにADR-007, ADR-008を追加すべき。

- Q11: **Section 3.1 の表とSection 5.3のサービス間認証で `scope` と `permissions` の用語が混在**
  Section 3.1 の表では「JWT (Service Account)」としサービス間認証を定義し、Section 5.3 の JWT 例では `scope` フィールドを使用している。一方、Section 4.1 のユーザー用JWT では `permissions` を使用している。OAuth 2.0 の仕様では `scope` はアクセストークン要求時の権限指定に使用される用語であり、意図的な使い分けなのか統一漏れなのか不明。
  - **提案**: 意図的な使い分け（OAuth 2.0準拠のService Account は `scope`、独自RBAC は `permissions`）であればその旨を注記すべき。統一漏れであれば `permissions` に統一すべき。

- Q12: **Option C（API Key + HMAC）の記載位置が「検討した選択肢」にあるが、採用もされている**
  Section 2 の Option C で「API Key + HMAC（サービス間認証のみ）」を検討項目として挙げ、デメリットの記載があるが、Section 3.1 では「Webhook受信: HMAC-SHA256 Signature検証」として実際に採用されている。Option C のデメリット「ユーザー認証には不向き」「キー管理が煩雑」は事実だが、Webhook検証用途では採用されているため、Section 2 の記述が誤解を招く可能性がある。
  - **提案**: Option C の記述を「ユーザー認証の選択肢としては却下。ただしWebhook受信認証には HMAC-SHA256 を部分採用（Section 3.1 参照）」と明記すべき。

- Q13: **Phase ロードマップの整合性**
  Section 3.1 で Phase 1 / Phase 2 の認証サーバー方針、Section 3.3 で Phase 1 のマルチテナント方針、Section 8 で Phase 2〜4 の将来拡張を記載しているが、各Phaseの時期やスコープが散在しており全体像が把握しづらい。
  - **提案**: Section 8 にPhaseのサマリ表を設け、各Phaseの主要変更点を一覧化すべき。

---

### V. 技術的な追加検討事項

- Q14: **HTTPS / TLS に関する前提条件の明記がない**
  JWTをHTTPヘッダで送信し、Refresh TokenをCookieで管理する設計だが、HTTPS の使用が暗黙の前提となっている。開発環境・ステージング環境・本番環境それぞれでのTLS方針を明記すべき。
  - **提案**: 「本番環境ではHTTPSを必須とする。開発環境ではHTTPを許容するが、Secure Cookie は開発環境では無効化する」等の方針を記載すべき。

- Q15: **CSRFへの対策の言及がない**
  Section 5.4 で Refresh Token を HttpOnly Secure Cookie で管理するとしているが、Cookie ベースの認証は CSRF 攻撃に脆弱である。SPA（Admin UI）から API を呼び出す際の CSRF 対策方針が記載されていない。
  - **提案**: 以下のいずれかの方針を明記すべき：
    - Access Token は Authorization ヘッダで送信する（Cookieではない）ため、通常のAPI呼び出しは CSRF の対象外
    - Refresh Token の Cookie 送信時は、CSRF Token または SameSite Cookie 属性で保護する

---

### まとめ

| カテゴリ | 指摘数 | 重要度高 |
|---------|--------|---------|
| セキュリティ設計の深掘り | 4件 (Q1-Q4) | Q2, Q4 |
| 実装設計の具体性 | 3件 (Q5-Q7) | Q5 |
| 運用・監査の観点 | 2件 (Q8-Q9) | Q8 |
| 整合性・記述の改善 | 4件 (Q10-Q13) | Q10, Q11 |
| 技術的な追加検討事項 | 2件 (Q14-Q15) | Q15 |

**全体評価**: v1.1.0 は前回QAの指摘をほぼ全件反映しており、認証・認可の基本設計として十分な品質に達している。本QA2では、実運用・セキュリティインシデント対応・実装の具体性の観点から、さらに実用性を高めるための指摘を行った。特に **Q2（Redisブラックリスト）、Q4（Refresh Token Race Condition）、Q15（CSRF対策）** は実装フェーズ前に方針を確定すべき重要項目である。

---

## 2026-02-16T19:34 回答担当： Antigravity (Gemini)

> **前提**: 要件定義 (shipping-service-requirements.md v0.2.2) を踏まえた回答
> - 要件定義 Section 2.2:「認証・認可は BFF / Gateway 側で完結」「Shipping Service は内部 API として提供」
> - Redis は使用する前提
> - **ADR-008 への追記が必要な項目は「→ ADR追記」と明記**

---

### I. セキュリティ設計の深掘り

#### Q1の回答: Access Token 15分 + Refresh Token 7日の根拠
**対応: ADR追記 (Section 5.1 補足)**

- Access Token 15分は業界標準（Auth0/Okta推奨値）に準拠しており、配送管理の業務特性上も妥当
- 配送業務の連続操作は SPA 上で行われるため、**Silent Refresh（有効期限前にバックグラウンドでトークン更新）** で UX を維持する
- Silent Refresh の実装方針:
  - Access Token の残り有効期限が **2分以下** になった時点で `/auth/refresh` を非同期呼び出し
  - Refresh 失敗時はユーザーに再ログインを促す
- Refresh Token 7日はログイン頻度のバランス（週次ログイン）を考慮

#### Q2の回答: Redis ブラックリストの具体的な運用方針
**対応: ADR追記 (Section 5.2 詳細化)**

Redis を使用する前提で、以下の設計を採用する：

| 項目 | 方針 |
|------|------|
| **保存キー** | `jti`（JWT ID）ベース。キー: `token:blacklist:{jti}` |
| **TTL** | 対象 Access Token の残り有効期限と一致（最大15分） |
| **参照タイミング** | Auth Middleware で **全リクエスト** で参照（Redis GET は O(1) で低負荷） |
| **Redis 障害時** | フォールバック: JWT 署名検証のみで許可（短い TTL で自然失効に頼る）。ログに警告出力 |
| **無効化トリガー** | ログアウト、パスワード変更、管理者による強制無効化 |

```
Redis Key Design:
  token:blacklist:{jti}  →  value: "1"  TTL: remaining_exp
  token:refresh:{user_id}:{family_id}  →  value: refresh_token_hash  TTL: 7d
```

#### Q3の回答: JWT ペイロード肥大化のリスク
**対応: ADR追記 (Section 4.1 注記)**

- Phase 1 の RBAC ロール数は 4（admin, operator, viewer, service）、パーミッション数は最大 10 程度を想定
- **Phase 1 のペイロードサイズ見積もり**: 約 300〜500 bytes（エンコード後）→ 問題なし
- **上限ガイドライン**: パーミッション数が **20を超える** 場合は、トークンには `roles` のみを含め、パーミッション解決はサーバーサイドで行う方式に切り替える
- Phase 3 (ABAC) 移行時はイントロスペクション方式を検討（Section 8 の将来拡張に含む）

#### Q4の回答: Refresh Token Rotation の Race Condition
**対応: ADR追記 (Section 5.4 詳細化)**

**Grace Period 方式を採用**:
- Refresh Token 使用後、旧トークンを **30秒間** 有効とする（Grace Period）
- Grace Period 内の同一旧トークンの再利用は正当なリクエストとして許可し、同一の新トークンペアを返却する
- Grace Period 経過後の旧トークン使用は不正と判断し、**Token Family 全体を無効化**

**Token Family 設計**（Redis 管理）:
- 初回ログイン時に `family_id` (UUID) を発行
- Refresh Token に `family_id` を埋め込む
- 不正検知時は `family_id` に属する全 Refresh Token を Redis から削除

```
Redis Key Design:
  token:refresh_family:{family_id}  →  Set of refresh_token_jti  TTL: 7d
```

---

### II. 実装設計の具体性

#### Q5の回答: ミドルウェアのエラーレスポンス形式
**対応: ADR追記 (Section 4.2 詳細化)**

| HTTP Status | 条件 | レスポンス例 |
|-------------|------|-------------|
| **401 Unauthorized** | トークン未提供、期限切れ、署名不正 | `{"code": "UNAUTHORIZED", "message": "Authentication required"}` |
| **403 Forbidden** | 認証済みだが権限不足 | `{"code": "FORBIDDEN", "message": "Insufficient permissions"}` |

**セキュリティポリシー**:
- エラーレスポンスにトークンの具体的な不正理由（「署名が不正」「期限切れ」等）を含め**ない**
- 詳細な認証エラー情報はサーバーサイドのログにのみ出力する
- `WWW-Authenticate` ヘッダで `Bearer` スキームを返却する

#### Q6の回答: `context.go` の設計
**対応: ADR追記 (Section 4.3 詳細化)**

- **Claims 構造体の配置**: `internal/domain/auth/` に `claims.go` を配置
- **Context Key**: Go の `type contextKey struct{}` パターンで型安全に管理（string キーは不使用）
- `context.go` は Gin Context ↔ domain Claims のアダプタに徹する

```
internal/
├── domain/
│   └── auth/
│       └── claims.go        # AuthClaims 構造体定義
├── middleware/
│   ├── auth.go              # JWT検証、Context注入
│   ├── rbac.go              # 認可チェック（Role/Permission）
│   └── context.go           # Gin Context ↔ domain Claims アダプタ
```

#### Q7の回答: Service Account JWT の発行フロー
**対応: ADR追記 (Section 5.3 詳細化)**

| フェーズ | 発行方式 | 資格情報管理 |
|----------|----------|-------------|
| Phase 1 | 各サービスが共有 RSA 秘密鍵で自己発行 | 環境変数 or Kubernetes Secret |
| Phase 2+ | 外部 IdP の Client Credentials Grant | IdP 管理コンソール |

- Phase 1 では、呼び出し元サービスが自身の Service Account JWT を自己発行する
- トークンは **有効期限内はメモリキャッシュ** し、期限切れ2分前に再発行する
- 共有公開鍵は JWKS エンドポイントで配布（Section 5.5 と同一メカニズム）

---

### III. 運用・監査の観点

#### Q8の回答: 監査ログ
**対応: ADR追記 (新規 Section 5.8)**

| イベント | ログレベル | 含める情報 |
|---------|-----------|-----------|
| ログイン成功 | INFO | `sub`, IP, User-Agent, timestamp |
| ログイン失敗 | WARN | 入力ユーザーID, IP, User-Agent, 失敗理由 |
| トークン更新 | INFO | `sub`, `family_id`, IP |
| 権限不足アクセス | WARN | `sub`, リクエストパス, 要求権限, 保有権限 |
| トークン無効化（ブラックリスト追加） | WARN | `sub`, `jti`, 無効化理由 |
| 鍵ローテーション | INFO | 旧`kid`, 新`kid` |

- **ログ形式**: JSON 構造化ログ（要件定義 Section 6 に準拠）
- **ログ保持期間**: 運用ドキュメントに委譲（ADR では定めない）

#### Q9の回答: 鍵ローテーション
**対応: ADR追記 (Section 5.5 詳細化)**

| 項目 | 方針 |
|------|------|
| 定期ローテーション | 90日ごと |
| 緊急ローテーション | 鍵漏洩時に即時実行 |
| 並行運用期間 | 旧鍵は新鍵発行後 **24時間** 有効（Access Token TTL 15分より十分長い） |
| `kid` 命名規則 | `key-{YYYYMMDD}-{seq}` 例: `key-20260216-01` |
| 運用手順 | 別途運用ドキュメント（ops-runbook）に記載 |

---

### IV. 整合性・記述の改善

#### Q10の回答: AGENT.md の ADR 一覧更新
**対応: AGENT.md を更新**

ADR-007, ADR-008 を AGENT.md に追記する。

#### Q11の回答: `scope` と `permissions` の用語混在
**対応: ADR追記 (Section 5.3 注記)**

**意図的な使い分け** である：
- **ユーザー向け JWT**: `permissions` — 独自 RBAC によるパーミッション展開
- **Service Account JWT**: `scope` — OAuth 2.0 Client Credentials Grant の仕様（[RFC 6749 Section 3.3](https://tools.ietf.org/html/rfc6749#section-3.3)）に準拠

この使い分けの理由を ADR に注記として追記する。

#### Q12の回答: Option C の記述改善
**対応: ADR追記 (Section 2 Option C 修正)**

Option C のタイトルを以下に修正：
> `Option C: API Key + HMAC（ユーザー認証としては却下。Webhook 受信認証に部分採用 → Section 3.1）`

#### Q13の回答: Phase ロードマップの一覧化
**対応: ADR追記 (Section 8 にサマリ表追加)**

| Phase | スコープ | 認証 | 認可 |
|-------|---------|------|------|
| Phase 1 (MVP) | Shipping API 内蔵認証 | JWT自己発行・検証 + Redis | RBAC (roles/permissions) |
| Phase 2 | 外部IdP連携 | Keycloak/Auth0, SSO | RBAC（IdP管理） |
| Phase 3 | 高度な認可 | 同上 | ABAC, OPA連携 |
| Phase 4 | ゼロトラスト | mTLS, SPIFFE/SPIRE | ワークロードID |

---

### V. 技術的な追加検討事項

#### Q14の回答: HTTPS / TLS 前提条件
**対応: ADR追記 (新規 Section 5.9)**

| 環境 | TLS | Secure Cookie | 備考 |
|------|-----|---------------|------|
| 本番 | HTTPS 必須 | 有効 | TLS 終端は LB / Ingress |
| ステージング | HTTPS 必須 | 有効 | 本番同等構成 |
| 開発 | HTTP 許容 | 無効 | `SameSite=Lax` で代替 |

#### Q15の回答: CSRF 対策
**対応: ADR追記 (Section 5.6 追記)**

**方針**: CSRF リスクは限定的であり、以下の多層防御で対処する：
1. **Access Token は `Authorization: Bearer` ヘッダで送信**（Cookie ではない）→ 通常の API 呼び出しは CSRF 対象外
2. **Refresh Token Cookie は `SameSite=Strict`** に設定 → クロスサイトからの `/auth/refresh` 呼び出しをブラウザレベルで遮断
3. **CORS ポリシー**（Section 5.6）で許可オリジンを明示的に限定 → 不正オリジンからのリクエストを拒否

上記3点の組み合わせにより、別途 CSRF Token の発行・検証は不要と判断する。

---

### 要件定義との整合性に関する補足指摘

#### Q16（追加）: 要件定義 Section 2.2 との整合性確認
**重要**: 要件定義 (v0.2.2) Section 2.2 に「**認証・認可は BFF / Gateway 側で完結**」「**Shipping Service は内部 API として提供**」と記載がある。一方、ADR-008 では Shipping Service **内に** 認証機能（`/auth/login`）を持つ設計としている。

この点について以下のいずれかを ADR-008 の Section 1（背景）に明記すべき：
- **解釈A**: 要件定義の「BFF / Gateway で完結」は Phase 2 以降の目標であり、Phase 1 (MVP) では Shipping API 内蔵で開始する
- **解釈B**: 要件定義を改訂し、Shipping Service の認証方針を ADR-008 に準拠させる
- **解釈C**: BFF/Gateway は Admin UI 向けの認証を担い、Shipping API の `/auth/login` はサービス間の内部トークン発行用途に限定する

**→ ADR-008 Section 1 に要件定義との関係性を追記。Phase 1 MVP の位置付けを明確化する。**

---

### ADR-008 追記対象のまとめ

| QA2指摘 | 追記先 Section | 内容 |
|---------|---------------|------|
| Q1 | 5.1 | Silent Refresh 方針、TTL根拠補足 |
| Q2 | 5.2 | Redis ブラックリスト詳細設計 |
| Q3 | 4.1 | ペイロードサイズ上限ガイドライン |
| Q4 | 5.4 | Grace Period + Token Family 設計 |
| Q5 | 4.2 | エラーレスポンス定義 |
| Q6 | 4.3 | ディレクトリ構成詳細化、Claims配置 |
| Q7 | 5.3 | Service Account 発行フロー詳細 |
| Q8 | 5.8（新規） | 監査ログ方針 |
| Q9 | 5.5 | 鍵ローテーション詳細 |
| Q10 | — | AGENT.md 更新 |
| Q11 | 5.3 | scope/permissions使い分け注記 |
| Q12 | 2 (Option C) | タイトル・説明修正 |
| Q13 | 8 | Phase サマリ表追加 |
| Q14 | 5.9（新規） | TLS/HTTPS 環境別方針 |
| Q15 | 5.6 | CSRF 対策方針 |
| Q16 | 1 | 要件定義との整合性明記 |
