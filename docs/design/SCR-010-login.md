# SCR-010 ログイン画面設計書

**画面ID:** SCR-010  
**画面名:** ログイン（Login）  
**Version:** 1.0.0  
**作成日:** 2026-02-16  

---

## 1. 画面概要

### 1.1 目的
Shipping Service Admin UI へのアクセスを認証するログイン画面。

### 1.2 対象ユーザー
- 全ユーザー（admin / operator / viewer）

### 1.3 アクセス経路
- URL 直接アクセス（未認証時のリダイレクト先）
- ログアウト後のリダイレクト先
- トークン期限切れ時のリダイレクト先

### 1.4 認証方式
- ADR-008 Phase 1: Shipping API 内蔵の JWT 認証
- ユーザー名 + パスワードによる認証
- JWT（Access Token + Refresh Token）発行

---

## 2. 画面イメージ（テキスト形式）

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                                                                   │
│                                                                   │
│              ┌────────────────────────────────┐                │
│              │                                  │                │
│              │    📦 Shipping Service Admin     │                │
│              │                                  │                │
│              │    ────────────────────────────   │                │
│              │                                  │                │
│              │    ユーザー名                     │                │
│              │    [________________________]    │                │
│              │                                  │                │
│              │    パスワード                     │                │
│              │    [________________________] 👁  │                │
│              │                                  │                │
│              │    [      ログイン      ]        │                │
│              │                                  │                │
│              │    ⚠️ エラーメッセージ表示エリア  │                │
│              │                                  │                │
│              └────────────────────────────────┘                │
│                                                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 画面構成要素

### 3.1 ログインカード

| 要素 | タイプ | 説明 |
|------|--------|------|
| アプリケーションロゴ | Image/Text | "📦 Shipping Service Admin" |
| ユーザー名 | Input | ユーザー名入力（placeholder: "ユーザー名を入力"） |
| パスワード | Input (password) | パスワード入力（placeholder: "パスワードを入力"） |
| パスワード表示切替 | IconButton | 👁 アイコンでパスワードの表示/非表示を切替 |
| ログインボタン | Button (primary) | ログイン処理を実行 |
| エラーメッセージ | Alert | 認証エラー時に表示 |

### 3.2 レイアウト
- 画面中央にログインカードを配置
- カードサイズ: 最大幅 400px
- 背景: グラデーションまたはテーマに合わせた背景

---

## 4. 画面項目とイベント

### 4.1 初期表示時

#### イベント: ページロード
**処理内容:**
1. 既存の Access Token を確認
2. 有効なトークンがある場合、Dashboard（SCR-001）へリダイレクト
3. トークンがない/無効な場合、ログインフォームを表示

**API呼び出し:**
なし（クライアントサイドでのトークン存在確認のみ）

---

### 4.2 ログインボタンクリック

#### イベント: ボタンクリック / Enter キー押下
**処理内容:**
1. バリデーション実行
2. 認証API呼び出し
3. 成功: トークン保存 → Dashboard へ遷移
4. 失敗: エラーメッセージ表示

**API呼び出し:**

```typescript
POST /api/v1/auth/login

Request:
{
  "username": "admin",
  "password": "admin123"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": 1,
      "username": "admin",
      "display_name": "管理者 太郎",
      "email": "admin@example.com",
      "roles": ["admin"],
      "permissions": ["shipping:*", "user:*", "system:*"]
    }
  }
}
```

**Refresh Token の取得:**
- Refresh Token はレスポンスボディに含めず、`Set-Cookie` ヘッダで送信
- `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`

**トークン保存:**
- Access Token: メモリ内（変数）に保持。localStorage/sessionStorage には保存しない（XSS 対策）
- Refresh Token: HttpOnly Cookie（ブラウザが自動管理）

**UI動作:**
- ログインボタンをローディング状態に変更（二重送信防止）
- 成功: Dashboard（SCR-001）へ遷移
- 失敗: エラーメッセージを表示

---

### 4.3 認証エラー

#### エラーパターン

| HTTP Status | 条件 | エラーメッセージ |
|-------------|------|-----------------|
| 401 | ユーザー名/パスワード不一致 | "ユーザー名またはパスワードが正しくありません" |
| 401 | アカウント無効 | "アカウントが無効化されています。管理者に連絡してください" |
| 429 | Rate Limit 超過 | "ログイン試行回数が上限を超えました。しばらく待ってから再試行してください" |
| 500 | サーバーエラー | "システムエラーが発生しました。しばらく待ってから再試行してください" |

**UI動作:**
- エラーメッセージをログインカード内に赤色の Alert で表示
- パスワード入力欄をクリア
- ログインボタンを再度有効化

**セキュリティ考慮:**
- ユーザー名の存在有無を区別するエラーメッセージを返さない（列挙攻撃防止）
- エラーメッセージは常に「ユーザー名またはパスワードが正しくありません」で統一

---

### 4.4 パスワード表示切替

#### イベント: 👁 アイコンクリック
**処理内容:**
- パスワード入力フィールドの type を `password` ⇔ `text` に切替
- アイコンを `👁` ⇔ `👁‍🗨` に切替

**API呼び出し:**
なし（クライアントサイド処理のみ）

---

## 5. バリデーション

### 5.1 ユーザー名
| ルール | 条件 | エラーメッセージ |
|--------|------|-----------------|
| 必須 | 空文字 | "ユーザー名を入力してください" |
| 最小文字数 | 3文字未満 | "ユーザー名は3文字以上で入力してください" |
| 最大文字数 | 50文字超過 | "ユーザー名は50文字以内で入力してください" |

### 5.2 パスワード
| ルール | 条件 | エラーメッセージ |
|--------|------|-----------------|
| 必須 | 空文字 | "パスワードを入力してください" |
| 最小文字数 | 8文字未満 | "パスワードは8文字以上で入力してください" |

---

## 6. エラーハンドリング

| エラー種別 | HTTP Status | UI動作 |
|-----------|-------------|--------|
| 認証失敗 | 401 | ログインカード内にエラーメッセージ表示 |
| Rate Limit | 429 | ログインカード内にエラーメッセージ表示 + ログインボタン一時無効化 |
| API接続エラー | - | "サーバーに接続できません" エラーメッセージ表示 |
| サーバーエラー | 500 | "システムエラーが発生しました" エラーメッセージ表示 |

---

## 7. 非機能要件

### 7.1 パフォーマンス
- ログイン処理: 2秒以内
- 画面初期表示: 1秒以内

### 7.2 アクセシビリティ
- フォームフィールドはキーボード操作可能（Tab + Enter）
- aria-label の適切な設定
- エラーメッセージは aria-live="polite" で通知

### 7.3 レスポンシブ対応
- モバイル: カード幅 100%（パディング付き）
- タブレット以上: カード幅 400px（中央配置）

### 7.4 セキュリティ
- パスワードフィールドは autocomplete="current-password" を設定
- ユーザー名フィールドは autocomplete="username" を設定
- フォーム送信は HTTPS 経由のみ（開発環境除く）

---

## 8. 初期ユーザーセットアップ

### 8.1 初期 admin ユーザー
- アプリケーション初回起動時に、環境変数から初期 admin ユーザーを作成する
- 既にユーザーが存在する場合はスキップ

| 環境変数 | 説明 | デフォルト値 |
|----------|------|-------------|
| `ADMIN_USERNAME` | 初期管理者ユーザー名 | `admin` |
| `ADMIN_PASSWORD` | 初期管理者パスワード | （必須・デフォルト値なし） |
| `ADMIN_EMAIL` | 初期管理者メール | `admin@example.com` |
| `ADMIN_DISPLAY_NAME` | 初期管理者表示名 | `管理者` |

### 8.2 パスワードポリシー
- 最小 8 文字
- 英数字混合を推奨（Phase 1 では強制しない）
- bcrypt でハッシュ化して保存（cost factor: 10）

---

## 9. 実装メモ

### 9.1 使用コンポーネント（shadcn/ui）
- Card: ログインカード
- Input: ユーザー名・パスワード入力
- Button: ログインボタン
- Alert: エラーメッセージ
- Label: フォームラベル

### 9.2 状態管理
```typescript
interface LoginState {
  username: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### 9.3 認証コンテキスト
```typescript
interface AuthContext {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

### 9.4 Silent Refresh（ADR-008 Section 5.1）
```typescript
// Access Token の残り有効期限が 2分以下になった時点で自動更新
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000; // 2分

function scheduleTokenRefresh(expiresIn: number) {
  const refreshAt = (expiresIn * 1000) - REFRESH_THRESHOLD_MS;
  setTimeout(() => refreshToken(), refreshAt);
}
```

---

## 10. 関連画面

- **SCR-001:** ダッシュボード（ログイン成功後の遷移先）
- **SCR-020:** プロフィール画面

---

## 11. 変更履歴

| Version | 日付 | 変更内容 | 担当者 |
|---------|------|----------|--------|
| 1.0.0 | 2026-02-16 | 初版作成 | - |

---

**承認状態:** ✅ レビュー待ち  
**参照ドキュメント:**
- shipping-service-requirements.md v0.4.0
- ADR-008-authentication-authorization.md v1.3.0
- ui-api-interface-mapping.md v0.5.0
