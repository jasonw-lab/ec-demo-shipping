# SCR-003 発送詳細画面設計書

**画面ID:** SCR-003  
**画面名:** 発送詳細・編集（Shipping Detail & Edit）  
**Version:** 1.0.0  
**作成日:** 2026-02-09  

---

## 1. 画面概要

### 1.1 目的
選択した発送の詳細情報を表示し、ステータス更新・配送情報の編集を行う画面。

### 1.2 対象ユーザー
- 倉庫担当者（Ops）
- カスタマーサポート担当者

### 1.3 アクセス経路
- ダッシュボードの優先対応リストから行クリック
- 発送一覧画面の注文IDクリック
- 発送一覧画面の編集アイコンクリック

### 1.4 表示形式
- Sheet / Drawer（右側からスライドイン）
- 最大幅: 600px〜800px
- 背景オーバーレイあり

---

## 2. 画面イメージ（テキスト形式）

```
                    ┌────────────────────────────────────┐
                    │ [×] 発送詳細                       │
                    ├────────────────────────────────────┤
                    │                                    │
                    │ 📦 ORD-001                         │
                    │ [READY] 出荷作業待ち               │
                    │                                    │
                    │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
                    │                                    │
                    │ 📍 配送先住所                      │
                    │ 〒150-0041                         │
                    │ 東京都渋谷区神南1-1-1              │
                    │ 山田太郎様                         │
                    │                                    │
                    │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
                    │                                    │
                    │ 📋 ステータス情報                  │
                    │ 作成日時: 2026-01-01 09:00        │
                    │ 出荷指示: 2026-01-01 10:00        │
                    │ 出荷完了: -                        │
                    │ 配送完了: -                        │
                    │                                    │
                    │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
                    │                                    │
                    │ 🚚 出荷情報登録                    │
                    │                                    │
                    │ 配送業者 *                         │
                    │ [▼ 選択してください]              │
                    │                                    │
                    │ 追跡番号 *                         │
                    │ [____________]                     │
                    │                                    │
                    │ [キャンセル] [出荷完了登録]        │
                    │                                    │
                    └────────────────────────────────────┘
```

---

## 3. 画面構成要素

### 3.1 ヘッダー部

| 要素 | 説明 |
|------|------|
| 閉じるボタン（×） | Sheet を閉じる |
| タイトル | "発送詳細" |
| 注文ID | 大きく表示（例: ORD-001） |
| ステータスバッジ | 現在のステータスを色付きで表示 |

### 3.2 配送先住所セクション

| 項目 | 説明 |
|------|------|
| セクションタイトル | "📍 配送先住所" |
| 住所 | Order Service からコピーされた住所（Snapshot） |
| 表示形式 | 複数行テキスト（改行保持） |

**注意事項:**
- READY 以降は住所変更不可
- 表示のみ（編集不可）

### 3.3 ステータス情報セクション

| 項目 | 説明 | 表示条件 |
|------|------|----------|
| 作成日時 | created_at | 常に表示 |
| 出荷指示 | ready_at | READY 以降 |
| 出荷完了 | shipped_at | SHIPPED 以降 |
| 配送完了 | delivered_at | DELIVERED 以降 |

**表示形式:**
- 日時: `YYYY-MM-DD HH:mm`
- 未設定: `-`

### 3.4 編集フォームセクション

#### 3.4.1 ステータス別フォーム表示

| 現在のステータス | 表示内容 | アクション |
|-----------------|----------|-----------|
| CREATED | 出荷指示ボタン | READY へ遷移 |
| READY | 出荷情報登録フォーム | SHIPPED へ遷移 |
| SHIPPED | 配送情報表示 + 修正フォーム | 情報修正 |
| DELIVERED | 情報表示のみ | 編集不可 |
| RETURNED | 情報表示のみ | 編集不可 |
| CANCELLED | 情報表示のみ | 編集不可 |

---

## 4. 画面項目とイベント

### 4.1 初期表示時

#### イベント: Sheet オープン
**処理内容:**
1. 注文IDを受け取る
2. 発送詳細データを取得
3. フォームを初期化

**API呼び出し:**

```typescript
GET /api/v1/shipments/:order_id

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": "ORD-001",
    "status": "READY",
    "carrier": null,
    "tracking_number": null,
    "shipping_address": "〒150-0041\n東京都渋谷区神南1-1-1\n山田太郎様",
    "ready_at": "2026-01-01T10:00:00Z",
    "shipped_at": null,
    "delivered_at": null,
    "version": 2,
    "created_at": "2026-01-01T09:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
  }
}
```

**エラーハンドリング:**
- 404: "発送情報が見つかりませんでした" トースト + Sheet を閉じる
- 500: "システムエラーが発生しました" トースト

---

### 4.2 出荷指示（CREATED → READY）

#### イベント: 「出荷指示」ボタンクリック
**処理内容:**
1. 確認ダイアログ表示
2. ステータスを READY に更新
3. 成功トースト表示
4. 詳細データを再取得

**API呼び出し:**

```typescript
PUT /api/v1/shipments/:order_id

Request:
{
  "status": "READY",
  "version": 1
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": "ORD-001",
    "status": "READY",
    "ready_at": "2026-01-01T10:00:00Z",
    "version": 2,
    ...
  }
}
```

**UI動作:**
- 成功: "出荷指示を完了しました" トースト
- フォームを出荷情報登録フォームに切り替え

---

### 4.3 出荷完了登録（READY → SHIPPED）

#### イベント: 「出荷完了登録」ボタンクリック

**フォーム項目:**

| 項目 | 必須 | バリデーション |
|------|------|----------------|
| 配送業者 | ○ | YAMATO / SAGAWA / JAPAN_POST |
| 追跡番号 | ○ | 配送業者別フォーマット |

**追跡番号バリデーション:**

| 配送業者 | フォーマット | 例 |
|----------|-------------|-----|
| YAMATO | 12桁の数字 | 123456789012 |
| SAGAWA | 12桁の数字 | 987654321098 |
| JAPAN_POST | 11〜13桁の英数字 | AB123456789CD |

**API呼び出し:**

```typescript
PUT /api/v1/shipments/:order_id

Request:
{
  "status": "SHIPPED",
  "carrier": "YAMATO",
  "tracking_number": "123456789012",
  "version": 2
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": "ORD-001",
    "status": "SHIPPED",
    "carrier": "YAMATO",
    "tracking_number": "123456789012",
    "shipped_at": "2026-01-01T11:00:00Z",
    "version": 3,
    ...
  }
}
```

---

### 4.4 追跡番号外部リンク

#### イベント: 追跡番号クリック（SHIPPED 以降）

**URL構築（Frontend）:**

```typescript
function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const urls = {
    YAMATO: `https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number=${trackingNumber}`,
    SAGAWA: `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${trackingNumber}`,
    JAPAN_POST: `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${trackingNumber}`,
  };
  return urls[carrier];
}
```

---

### 4.5 楽観ロック競合エラー

#### イベント: 更新時に 409 Conflict

**API Response:**

```typescript
Response (409):
{
  "success": false,
  "errorCode": 409,
  "errorMessage": "データが更新されています。再読み込みしてください。"
}
```

**UI動作:**

```typescript
toast({
  variant: "destructive",
  title: "データの競合",
  description: "他のユーザーが既に更新しています。",
  action: (
    <Button onClick={handleReload}>
      最新情報を読み込む
    </Button>
  ),
});
```

---

## 5. バリデーション

### 5.1 追跡番号

| 配送業者 | 正規表現 | エラーメッセージ |
|----------|----------|------------------|
| YAMATO | `^\d{12}$` | "ヤマト運輸の追跡番号は12桁の数字です" |
| SAGAWA | `^\d{12}$` | "佐川急便の追跡番号は12桁の数字です" |
| JAPAN_POST | `^[A-Za-z0-9]{11,13}$` | "日本郵便の追跡番号は11〜13桁の英数字です" |

---

## 6. エラーハンドリング

| エラー種別 | HTTP Status | UI動作 |
|-----------|-------------|--------|
| バリデーションエラー | 400 | フィールド下にエラーメッセージ表示 |
| 発送情報なし | 404 | トースト表示 + Sheet を閉じる |
| 楽観ロック競合 | 409 | トースト + 再読み込みボタン |
| サーバーエラー | 500 | "システムエラーが発生しました" トースト |

---

## 7. 実装メモ

### 7.1 使用コンポーネント（shadcn/ui）
- Sheet: 詳細画面コンテナ
- Form: フォーム管理
- Select: 配送業者選択
- Input: 追跡番号入力
- Button: アクションボタン
- Badge: ステータス表示
- Toast: 通知

---

## 8. 関連画面

- **SCR-001:** ダッシュボード（遷移元）
- **SCR-002:** 発送一覧画面（遷移元）

---

**承認状態:** ✅ レビュー待ち  
**参照ドキュメント:**
- shipping-service-requirements.md v0.2.2
- ui-dashboard-design.md v0.2.2
- ui-api-interface-mapping.md v0.4.0
