# SCR-002 発送一覧画面設計書

**画面ID:** SCR-002  
**画面名:** 発送一覧（Shipping List）  
**Version:** 1.0.0  
**作成日:** 2026-02-09  

---

## 1. 画面概要

### 1.1 目的
全発送データを一覧表示し、検索・フィルタ・ソート機能により目的の発送を素早く見つけ、詳細確認・編集を行う画面。

### 1.2 対象ユーザー
- 倉庫担当者（Ops）
- カスタマーサポート担当者

### 1.3 アクセス経路
- サイドバーメニュー「Shipping」をクリック
- ダッシュボードのサマリーカードをクリック
- ダッシュボードの「すべての発送を見る」ボタンをクリック

---

## 2. 画面イメージ（テキスト形式）

```
┌─────────────────────────────────────────────────────────────────┐
│ [≡] Shipping Service Admin                    [👤 User] [Logout]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📦 発送一覧                                                      │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 [キーワード検索: 注文ID / 追跡番号]                    │   │
│  │                                                           │   │
│  │ ステータス: [▼ すべて]  配送業者: [▼ すべて]  [🔄 リセット] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 注文ID    │ステータス│配送業者│追跡番号      │更新日時  │操作│
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ORD-001   │[READY]   │-       │-             │2時間前   │✏️ │
│  │ ORD-002   │[SHIPPED] │YAMATO  │123456789012 📋│5時間前   │✏️ │
│  │ ORD-003   │[CREATED] │-       │-             │1日前     │✏️ │
│  │ ORD-004   │[RETURNED]│SAGAWA  │987654321098 📋│3時間前   │✏️ │
│  │ ORD-005   │[READY]   │-       │-             │6時間前   │✏️ │
│  │ ...                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [◀ 前へ]  1 / 5  [次へ ▶]                    全 100 件         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 画面構成要素

### 3.1 検索・フィルタバー

| 要素 | タイプ | 説明 |
|------|--------|------|
| キーワード検索 | Input | 注文ID / 追跡番号で部分一致検索（大文字小文字区別なし） |
| ステータスフィルタ | Select | すべて / CREATED / READY / SHIPPED / DELIVERED / RETURNED / CANCELLED |
| 配送業者フィルタ | Select | すべて / YAMATO / SAGAWA / JAPAN_POST |
| リセットボタン | Button | すべてのフィルタをクリア |

#### ステータス選択肢
| 表示名 | 値 | 説明 |
|--------|-----|------|
| すべて | (空) | フィルタなし |
| 未着手 | CREATED | 注文確定直後 |
| 出荷作業待ち | READY | 出荷指示済み |
| 出荷済み | SHIPPED | 配送業者へ引き渡し完了 |
| 配送完了 | DELIVERED | 配送完了（将来拡張） |
| 返送 | RETURNED | 返送対応 |
| キャンセル | CANCELLED | 発送前キャンセル |

#### 配送業者選択肢
| 表示名 | 値 |
|--------|-----|
| すべて | (空) |
| ヤマト運輸 | YAMATO |
| 佐川急便 | SAGAWA |
| 日本郵便 | JAPAN_POST |

### 3.2 一覧テーブル

| 列名 | 幅 | ソート | 説明 |
|------|-----|--------|------|
| 注文ID | 120px | ○ | Order ID（リンク） |
| ステータス | 100px | ○ | Badge表示（色分け） |
| 配送業者 | 100px | ○ | Carrier名（未設定時は "-"） |
| 追跡番号 | 150px | × | Tracking Number + コピーボタン |
| 更新日時 | 120px | ○ | 相対時間表示 |
| 操作 | 60px | × | 編集アイコン（✏️） |

#### ステータスバッジ配色
| ステータス | 色 | Tailwind Class |
|-----------|-----|----------------|
| CREATED | グレー | `bg-gray-100 text-gray-800` |
| READY | ブルー | `bg-blue-100 text-blue-800` |
| SHIPPED | グリーン | `bg-green-100 text-green-800` |
| DELIVERED | エメラルド | `bg-emerald-100 text-emerald-800` |
| RETURNED | レッド | `bg-red-100 text-red-800` |
| CANCELLED | グレー | `bg-gray-100 text-gray-600` |

### 3.3 ページネーション

| 要素 | 説明 |
|------|------|
| 前へボタン | 前ページへ移動（1ページ目では無効化） |
| ページ番号 | 現在ページ / 総ページ数 |
| 次へボタン | 次ページへ移動（最終ページでは無効化） |
| 総件数表示 | "全 100 件" |

---

## 4. 画面項目とイベント

### 4.1 初期表示時

#### イベント: ページロード
**処理内容:**
1. URL パラメータからフィルタ条件を取得
2. 発送一覧データを取得
3. テーブルに表示

**URL パラメータ:**
- `status`: ステータスフィルタ（例: `?status=READY`）
- `carrier`: 配送業者フィルタ（例: `?carrier=YAMATO`）
- `keyword`: キーワード検索（例: `?keyword=ORD-001`）
- `page`: ページ番号（例: `?page=2`）
- `size`: ページサイズ（デフォルト: 20）

**API呼び出し:**

```typescript
GET /api/v1/shipments?status=READY&page=1&size=20

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": "ORD-001",
      "status": "READY",
      "carrier": null,
      "tracking_number": null,
      "shipping_address": "東京都...",
      "ready_at": "2026-01-01T10:00:00Z",
      "shipped_at": null,
      "delivered_at": null,
      "version": 2,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "size": 20
}
```

**デフォルトフィルタ:**
- ステータス: `READY`（出荷作業待ち）
- ページ: 1
- サイズ: 20

---

### 4.2 キーワード検索

#### イベント: 検索入力 + Enter / 検索ボタンクリック
**処理内容:**
1. 入力値を取得
2. ページを1にリセット
3. API呼び出し
4. URL パラメータを更新

**API呼び出し:**

```typescript
GET /api/v1/shipments?keyword=ORD-001&page=1&size=20

Response: (同上)
```

**検索対象:**
- `order_id`: 注文ID（部分一致、大文字小文字区別なし）
- `tracking_number`: 追跡番号（部分一致、大文字小文字区別なし）

**UI動作:**
- 検索中はローディングスピナー表示
- 結果が0件の場合: "該当する発送が見つかりませんでした" メッセージ表示

---

### 4.3 ステータスフィルタ変更

#### イベント: Select 変更
**処理内容:**
1. 選択値を取得
2. ページを1にリセット
3. API呼び出し
4. URL パラメータを更新

**API呼び出し:**

```typescript
GET /api/v1/shipments?status=SHIPPED&page=1&size=20

Response: (同上)
```

---

### 4.4 配送業者フィルタ変更

#### イベント: Select 変更
**処理内容:**
1. 選択値を取得
2. ページを1にリセット
3. API呼び出し
4. URL パラメータを更新

**API呼び出し:**

```typescript
GET /api/v1/shipments?carrier=YAMATO&page=1&size=20

Response: (同上)
```

---

### 4.5 リセットボタンクリック

#### イベント: ボタンクリック
**処理内容:**
1. すべてのフィルタをクリア
2. デフォルト状態（status=READY, page=1）に戻す
3. API呼び出し
4. URL パラメータをクリア

**API呼び出し:**

```typescript
GET /api/v1/shipments?status=READY&page=1&size=20

Response: (同上)
```

---

### 4.6 注文IDクリック

#### イベント: 注文IDリンククリック
**処理内容:**
発送詳細画面（Sheet/Drawer）を開く

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
    "shipping_address": "東京都渋谷区...",
    "ready_at": "2026-01-01T10:00:00Z",
    "shipped_at": null,
    "delivered_at": null,
    "version": 2,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
  }
}
```

**UI動作:**
- 右側から Sheet/Drawer がスライドイン
- 詳細情報と編集フォームを表示（SCR-003参照）

---

### 4.7 追跡番号コピーボタンクリック

#### イベント: コピーアイコン（📋）クリック
**処理内容:**
1. 追跡番号をクリップボードにコピー
2. 成功トースト表示

**API呼び出し:**
なし（クライアントサイド処理のみ）

**UI動作:**
```typescript
navigator.clipboard.writeText(trackingNumber);
toast({
  title: "コピーしました",
  description: `追跡番号: ${trackingNumber}`,
  duration: 2000,
});
```

---

### 4.8 編集アイコンクリック

#### イベント: 編集アイコン（✏️）クリック
**処理内容:**
発送詳細画面（Sheet/Drawer）を開く（注文IDクリックと同じ）

**API呼び出し:**
GET /api/v1/shipments/:order_id（同上）

---

### 4.9 ページネーション操作

#### イベント: 前へ / 次へボタンクリック
**処理内容:**
1. ページ番号を増減
2. API呼び出し
3. URL パラメータを更新
4. テーブルの先頭にスクロール

**API呼び出し:**

```typescript
GET /api/v1/shipments?status=READY&page=2&size=20

Response: (同上)
```

---

### 4.10 ソート（将来拡張）

#### イベント: 列ヘッダークリック
**処理内容:**
1. ソート順を切り替え（昇順 ⇔ 降順）
2. API呼び出し（sort パラメータ付き）

**API呼び出し:**

```typescript
GET /api/v1/shipments?status=READY&sort=updated_at&order=desc&page=1&size=20

Response: (同上)
```

**実装方針:**
- MVP では実装しない
- 将来的に Backend 側でソート対応後に実装

---

## 5. バリデーション

### 5.1 キーワード検索
- 最小文字数: なし（空文字可）
- 最大文字数: 100文字
- 許可文字: 英数字、ハイフン、アンダースコア

### 5.2 ページ番号
- 最小値: 1
- 最大値: 総ページ数
- 範囲外の場合: 自動的に1にリセット

---

## 6. エラーハンドリング

| エラー種別 | HTTP Status | UI動作 |
|-----------|-------------|--------|
| API接続エラー | - | エラートースト表示 + リトライボタン |
| サーバーエラー | 500 | "システムエラーが発生しました" トースト表示 |
| データなし | 200（空配列） | "該当する発送が見つかりませんでした" メッセージ |
| 不正なパラメータ | 400 | デフォルト状態にリセット |

---

## 7. 非機能要件

### 7.1 パフォーマンス
- 初期表示: 1秒以内
- フィルタ変更: 500ms 以内
- ページ遷移: 300ms 以内

### 7.2 アクセシビリティ
- テーブルはキーボード操作可能（Tab + Enter）
- スクリーンリーダー対応（aria-label 設定）
- フォーカス表示を明確にする

### 7.3 レスポンシブ対応
- モバイル: カード形式で表示（テーブルを縦積み）
- タブレット: テーブル表示（横スクロール可）
- デスクトップ: フルテーブル表示

---

## 8. 実装メモ

### 8.1 使用コンポーネント（shadcn/ui）
- Input: キーワード検索
- Select: フィルタ
- Button: リセット、ページネーション
- Table: 一覧表示
- Badge: ステータス表示
- Sheet: 詳細画面（SCR-003）
- Toast: 通知

### 8.2 状態管理
```typescript
interface ShippingListState {
  shippings: Shipping[];
  total: number;
  page: number;
  size: number;
  filters: {
    status: string | null;
    carrier: string | null;
    keyword: string | null;
  };
  isLoading: boolean;
  error: string | null;
}
```

### 8.3 URL 同期
```typescript
// URL パラメータとフィルタ状態を同期
const searchParams = new URLSearchParams(window.location.search);
const status = searchParams.get('status') || 'READY';
const page = parseInt(searchParams.get('page') || '1');
```

---

## 9. 関連画面

- **SCR-001:** ダッシュボード（遷移元）
- **SCR-003:** 発送詳細画面（Sheet/Drawer）

---

## 10. 変更履歴

| Version | 日付 | 変更内容 | 担当者 |
|---------|------|----------|--------|
| 1.0.0 | 2026-02-09 | 初版作成 | - |

---

**承認状態:** ✅ レビュー待ち  
**参照ドキュメント:**
- shipping-service-requirements.md v0.2.2
- ui-dashboard-design.md v0.2.2
- ui-api-interface-mapping.md v0.4.0

