# Issue 016: 発送詳細画面 Horizon UI 移行

**作成日**: 2026-01-26  
**優先度**: P1  
**工数見積**: 0.5〜1日  
**ステータス**: 🔴 未着手  
**前提条件**: Issue 013（レイアウトシステム統一）完了  
**関連 ADR**: [ADR-006: Horizon UI Shadcn テンプレート採用](../adr/ADR-006-horizon-ui-adoption.md)

---

## 📋 概要

既存の発送詳細画面（Issue 012 で拡張済み）を Horizon UI ベースにリファクタリングする。

**重要**: UI フレームワークの移行のみを行い、機能仕様・ビジネスロジックは完全に維持します。

---

## 📖 機能仕様参照

本Issueは以下の既存仕様を維持します：

### 参照ドキュメント
- **[Issue 012: 発送詳細画面情報拡充](issue-012-shipping-detail.md)** - タイムライン、配送情報、監査ログ、操作エリアの詳細仕様

### 機能仕様の詳細

#### タイムライン取得
- **API**: `GET /api/v1/shipments/{id}/timeline`
- **実装方法**: 監査ログから復元
- **パフォーマンス対策**: 監査ログにインデックス追加 `(shipping_id, created_at)`、ETag キャッシュ使用

#### 監査ログ取得
- **API**: `GET /api/v1/shipments/{id}/audit-logs?limit=10&offset=0`
- **表示方式**: 初期表示10件、「もっと見る」ボタンで追加10件ずつ読み込み
- **総件数**: レスポンスヘッダー `X-Total-Count` で返却

#### 配送業者追跡URL
- **管理方法**: フロントエンド定数で管理
- **対応業者**:
  ```typescript
  export const CARRIER_TRACKING_URLS: Record<string, string> = {
    YAMATO: 'https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number={tracking_number}',
    SAGAWA: 'https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo={tracking_number}',
    JAPANPOST: 'https://trackings.post.japanpost.jp/services/srv/search?requestNo1={tracking_number}',
  };
  ```
- **表示**: `target="_blank" rel="noopener noreferrer"` で新規タブ表示

#### 楽観ロック
- **方式**: バージョン管理によるVERSION_CONFLICT検知
- **エラーハンドリング**: 競合時に409エラー、ユーザーに最新データ再読み込みを促す

#### 返送処理
- **本Issue範囲**: ステータスをRETURNEDに変更のみ
- **実行フロー**:
  1. 確認ダイアログ表示（「返送処理を実行しますか?」）
  2. `PATCH /api/v1/shipments/{id}` で `status: RETURNED` に更新
  3. 監査ログに記録（実行者: operator）
- **後続業務連携**: 倉庫指示、返金処理などは別Issue（Issue 017以降）で対応

---

## 🎯 対応内容

### 1. Sheet デザイン変更
- Horizon UI の Sheet コンポーネントを使用
- セクション区切りの視認性向上（Card コンポーネント使用）
- アクションボタンの配置最適化（Sheet Footer に固定）

### 2. タイムライン UI 変更
- Horizon UI のタイムラインスタイルを適用
- 各ステータス変更のビジュアル強化（アイコン + Horizon UI テーマカラー使用）

### 3. フォーム UI 変更
- Horizon UI の Form コンポーネントを使用
- バリデーションエラー表示のデザイン統一
- ローディング状態の視認性向上

### 4. レスポンシブ対応
- Sheet の幅調整（Desktop: 50%, Mobile: 100%）
- フォーム項目のレイアウト最適化（Mobile: 1列）

---

## 🛠️ 技術要件

### 使用コンポーネント
- Horizon UI: Sheet, Card (セクションコンテナ), Form
- shadcn/ui: Input, Select, Button, Badge, Toast (エラー通知)
- React Hook Form: フォーム状態管理
- lucide-react: アイコン

### ファイル変更箇所
```
apps/admin-horizon-ui/
└── features/
    └── shipping/
        └── components/
            ├── shipping-detail-sheet.tsx        # ← Horizon UI Sheet (メイン変更)
            ├── shipping-info.tsx                # ← Horizon UI Card (デザイン統一)
            ├── ship-form.tsx                    # ← Horizon UI Form (メイン変更)
            ├── tracking-link.tsx                # (軽微な変更)
            └── status-action-button.tsx         # (軽微な変更)
```

---

## ✅ 受け入れ条件

- [ ] Sheet が Horizon UI デザインで表示される
- [ ] 基本情報が正しく表示される
- [ ] タイムラインが視覚的に分かりやすく表示される（Horizon UI テーマカラー使用）
- [ ] 配送情報が正しく表示される（追跡番号リンク、業者別URL）
- [ ] 監査ログが正しく表示される（初期10件 + 「もっと見る」で追加読み込み）
- [ ] ステータス変更フォームが正常に動作（ステータス別の入力項目）
- [ ] バリデーションエラーが適切に表示される
- [ ] 楽観ロック競合時にエラーメッセージが表示される
- [ ] 送信成功時に Toast 通知が表示される
- [ ] 返送処理が正常に動作（確認ダイアログ → ステータス更新）
- [ ] Light/Dark Mode で正常に表示される
- [ ] レスポンシブ対応（Mobile / Tablet / Desktop）

---

## 🎨 カスタマイズ制約（重要）

### 🚫 変更禁止
- Horizon UI の Sheet コンポーネント構造・スタイル
- Sheet の幅・高さ・アニメーション
- Form コンポーネントのレイアウト・Spacing
- Card セクションの基本構造

### ✅ カスタマイズ可能
- セクション内の情報配置（業務要件に応じて）
- タイムラインアイコンの選択（lucide-react 内）
- タイムラインの色: Horizon UI のテーマカラー使用
  - 例: `text-primary`, `text-destructive`, `text-muted-foreground`
  - ❌ 禁止: `text-blue-600`, `text-red-500` （独自色指定）
- フォーム項目のラベル（日本語化）
- バリデーションエラーメッセージ
- アクションボタンの variant 指定

### ⚠️ 実装時の注意
- Horizon UI の Sheet/Form/Card をベースに使用
- セクション区切りは Card コンポーネントで実現
- タイムラインは Horizon UI のスタイルに準拠

---

## 🚫 非対応（本Issue外）

- データ取得ロジックの変更（`api/` は変更なし）
- ステータスフローの変更
- 新規フィールド追加
- 配送業者APIとのリアルタイム連携
- 返送処理の後続業務連携（倉庫指示、返金処理など）

---

## 📚 参考資料

- [Issue 012: 発送詳細画面情報拡充](issue-012-shipping-detail.md)
- [ADR-006: Horizon UI Shadcn テンプレート採用](../adr/ADR-006-horizon-ui-adoption.md)
- [Horizon UI Sheet Component](https://horizon-ui.com/docs-boilerplate/shadcn-components)
- [React Hook Form](https://react-hook-form.com/)

---

## 📝 実装ガイドライン（AI Agent 向け）

### 必須遵守事項

1. **Horizon UI の Sheet/Form/Card をベースに実装**
   - `components/ui/sheet.tsx` をそのまま使用
   - `components/ui/form.tsx` も同様
   - 構造は変更しない

2. **React Hook Form との統合**
   ```tsx
   // Horizon UI の Form コンポーネントと React Hook Form を統合
   import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
   import { useForm } from 'react-hook-form';
   
   const form = useForm({
     defaultValues: {
       status: shipping.status,
       trackingNumber: shipping.trackingNumber,
     },
   });
   ```

3. **セクション区切りは Card で実現**
   ```tsx
   <Sheet>
     <SheetContent>
       <Card>
         <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
         <CardContent>...</CardContent>
       </Card>
       <Card>
         <CardHeader><CardTitle>タイムライン</CardTitle></CardHeader>
         <CardContent>...</CardContent>
       </Card>
       <Card>
         <CardHeader><CardTitle>監査ログ</CardTitle></CardHeader>
         <CardContent>...</CardContent>
       </Card>
     </SheetContent>
   </Sheet>
   ```

4. **カスタマイズは Horizon UI のテーマカラーのみ**
   ```tsx
   // ✅ OK: タイムラインで Horizon UI のテーマカラー使用
   <div className="flex items-center gap-2">
     <div className="bg-primary h-2 w-2 rounded-full" />
     <span className="text-primary">CREATED</span>
   </div>
   <div className="flex items-center gap-2">
     <div className="bg-destructive h-2 w-2 rounded-full" />
     <span className="text-destructive">RETURNED</span>
   </div>
   
   // ❌ NG: Tailwind の独自色指定
   <div className="bg-blue-600 h-2 w-2 rounded-full" />
   <span className="text-red-500">RETURNED</span>
   ```

5. **データ取得・バリデーションは変更しない**
   - `features/shipping/api/` は維持
   - React Hook Form のバリデーションロジックを継続
   - 楽観ロックエラーハンドリングは既存のまま

### 配送業者追跡リンクの実装例

```tsx
// 配送業者マスタ定義
export const CARRIER_TRACKING_URLS: Record<string, string> = {
  YAMATO: 'https://toi.kuronekoyamato.co.jp/cgi-bin/tneko?number={tracking_number}',
  SAGAWA: 'https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo={tracking_number}',
  JAPANPOST: 'https://trackings.post.japanpost.jp/services/srv/search?requestNo1={tracking_number}',
};

// コンポーネント内
const trackingUrl = CARRIER_TRACKING_URLS[shipping.carrier]?.replace(
  '{tracking_number}',
  shipping.trackingNumber
);

{trackingUrl ? (
  <a
    href={trackingUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary hover:underline"
  >
    {shipping.trackingNumber}
  </a>
) : (
  <span>{shipping.trackingNumber}</span>
)}
```

### 返送処理の実装例

```tsx
const handleReturnShipment = async () => {
  // 確認ダイアログ
  const confirmed = await confirm({
    title: "返送処理の確認",
    description: "この発送を返送処理しますか?",
  });
  
  if (!confirmed) return;
  
  try {
    // ステータスをRETURNEDに更新
    await updateShipmentStatus(shipping.id, {
      status: "RETURNED",
      version: shipping.version,
    });
    
    toast({
      title: "返送処理完了",
      description: "発送ステータスをRETURNEDに更新しました。",
    });
  } catch (error) {
    if (error.code === "VERSION_CONFLICT") {
      toast({
        title: "更新失敗",
        description: "データが他のユーザーによって更新されています。最新データを読み込んでください。",
        variant: "destructive",
      });
    }
  }
};
```

---

**このIssueは Issue 013（レイアウトシステム統一）完了後に着手してください。**
