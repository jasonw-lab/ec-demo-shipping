# Next Shadcn Dashboard - Layout Improvement Suggestions

**Version:** 1.0.0
**Date:** 2026-01-27
**Status:** Proposal

---

## 概要

apps/admin-next-shadcn の UI 実装において、API 連携対応を行った際に確認した Layout 改善提案をまとめる。

---

## 現状の実装状況

### 実装済み機能
- ✅ ダッシュボード画面（KPI カード + 優先リスト）
- ✅ 発送一覧画面（フィルタ + データテーブル）
- ✅ 発送詳細シート（サイドパネル）
- ✅ API 連携（summary, priority エンドポイント）

### データ型の整合性
- ✅ `order_id`: string 型に統一（Backend と一致）
- ✅ `carrier`, `tracking_number`: nullable 型に対応
- ✅ `priority_reason`: フロントエンドで動的生成

---

## Layout 改善提案

### 1. 発送一覧画面のフィルタ UI

**現状:**
- ステータスフィルタとキャリアフィルタが別々のドロップダウン
- フィルタ適用後のクリアボタンがない

**改善提案:**
```
優先度: P2（中）

- フィルタ適用状態の視覚的フィードバック追加
  - 適用中のフィルタをバッジ表示
  - 「フィルタをクリア」ボタンの追加
- 検索ボックスの追加
  - 注文ID、追跡番号での部分一致検索
  - Backend の keyword パラメータを活用
```

**実装例:**
```tsx
// Filter bar with clear button
<div className="flex items-center gap-2">
  <StatusFilter />
  <CarrierFilter />
  <SearchInput placeholder="注文ID・追跡番号で検索" />
  {hasActiveFilters && (
    <Button variant="ghost" onClick={clearFilters}>
      フィルタをクリア
    </Button>
  )}
</div>
```

---

### 2. KPI カードのリンク動作

**現状:**
- KPI カード（作成済み、出荷準備完了など）をクリックすると一覧画面に遷移
- 遷移先でフィルタが自動適用される設計

**改善提案:**
```
優先度: P3（低）

- 現状の実装で問題なし
- 将来的な拡張案:
  - カードホバー時にプレビューツールチップ表示
  - 「詳細を見る」リンクの明示化
```

---

### 3. 優先リストの表示項目

**現状:**
- 注文ID、ステータス、配送業者、理由、更新日時を表示
- `priority_reason` はフロントエンドで動的生成

**改善提案:**
```
優先度: P1（高）

- priority_reason の Backend 対応
  - 現在はフロントエンドで計算しているが、Backend で生成すべき
  - API レスポンスに priority_reason フィールドを追加
  - ビジネスロジックの一元管理

理由:
- 優先度判定ロジックが Backend と Frontend で重複
- 将来的な優先度ルール変更時の保守性向上
```

**Backend 実装案:**
```go
// domain/shipping.go に追加
type PriorityShipment struct {
    domain.Shipping
    PriorityReason string `json:"priority_reason"`
}

// service/shipping_service.go
func (s *shippingService) GetPriorityShippings(limit int) ([]PriorityShipment, error) {
    shippings, err := s.repo.FindPriority(limit, createdThreshold)
    if err != nil {
        return nil, err
    }

    result := make([]PriorityShipment, len(shippings))
    for i, shipping := range shippings {
        result[i] = PriorityShipment{
            Shipping:       shipping,
            PriorityReason: calculatePriorityReason(shipping),
        }
    }
    return result, nil
}

func calculatePriorityReason(s domain.Shipping) string {
    switch s.Status {
    case domain.StatusReturned:
        return "返送対応が必要"
    case domain.StatusCreated:
        if time.Since(s.CreatedAt) > 24*time.Hour {
            return "24時間超過"
        }
    case domain.StatusReady:
        return "出荷待ち"
    }
    return ""
}
```

---

### 4. 発送詳細シートのアクション

**現状:**
- ステータス遷移ボタンが表示される（出荷指示、発送完了など）
- ボタンはあるが、実際のアクション処理は未実装

**改善提案:**
```
優先度: P1（高）

- ステータス更新 API の実装
  - PUT /api/v1/shipments/:order_id を使用
  - 楽観ロックによる競合検出
  - エラーハンドリング（バージョン不一致時の再読み込み）

- フォームバリデーション
  - SHIPPED 遷移時: carrier, tracking_number 必須
  - tracking_number のフォーマット検証（配送業者別）

- 成功時の UI フィードバック
  - Toast 通知
  - 詳細シートの自動更新
  - 一覧画面の再取得
```

**実装例:**
```tsx
async function handleStatusChange(newStatus: ShippingStatus) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/shipments/${shipment.order_id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          carrier: shipment.carrier,
          tracking_number: shipment.tracking_number,
          version: shipment.version,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 409) {
        toast.error("データが更新されています。再読み込みしてください。");
        // Reload shipment data
      } else {
        const error = await response.json();
        toast.error(error.message || "更新に失敗しました");
      }
      return;
    }

    const updated = await response.json();
    toast.success("ステータスを更新しました");
    onUpdate(updated);
  } catch (error) {
    toast.error("通信エラーが発生しました");
  }
}
```

---

### 5. 一覧画面のページネーション

**現状:**
- ページネーションコンポーネントは実装済み
- Backend API は page, size パラメータをサポート
- 実際の API 連携は未実装（モックデータ使用）

**改善提案:**
```
優先度: P1（高）

- 一覧画面での API 連携実装
  - GET /api/v1/shipments?page=X&size=Y&status=Z&carrier=W
  - URL クエリパラメータとの同期
  - ページ遷移時の状態保持

- パフォーマンス最適化
  - Server Component での初期データ取得
  - Client Component でのページング・フィルタ
  - SWR または React Query によるキャッシュ管理
```

---

### 6. エラーハンドリングとローディング状態

**現状:**
- ダッシュボードでは Suspense による Loading 表示
- エラー時は空データを返す（console.error のみ）

**改善提案:**
```
優先度: P2（中）

- Error Boundary の追加
  - API エラー時のフォールバック UI
  - リトライボタンの提供

- ローディング状態の統一
  - Skeleton UI の活用
  - 部分的なローディング表示（KPI カードのみ、など）

- エラーメッセージの改善
  - ユーザーフレンドリーなメッセージ
  - 技術的詳細は開発者コンソールのみ
```

---

### 7. レスポンシブ対応の強化

**現状:**
- 基本的なレスポンシブ対応は実装済み
- モバイル表示での一部レイアウト崩れの可能性

**改善提案:**
```
優先度: P3（低）

- モバイル表示の最適化
  - データテーブルのスクロール対応
  - KPI カードの縦並び表示
  - 詳細シートの全画面表示（モバイル時）

- タブレット表示の調整
  - 2カラムレイアウトの最適化
  - サイドバーの折りたたみ動作
```

---

## 実装優先度まとめ

### P1（高）- 即座に対応すべき
1. **priority_reason の Backend 実装**
   - ビジネスロジックの一元管理
   - フロントエンドの複雑性削減

2. **発送詳細シートのアクション実装**
   - ステータス更新 API 連携
   - 楽観ロック対応

3. **一覧画面の API 連携**
   - ページネーション実装
   - フィルタ・検索機能

### P2（中）- 次フェーズで対応
1. **フィルタ UI の改善**
   - クリアボタン追加
   - 検索ボックス追加

2. **エラーハンドリング強化**
   - Error Boundary
   - リトライ機能

### P3（低）- 将来的な改善
1. **KPI カードの拡張**
   - プレビュー機能

2. **レスポンシブ対応強化**
   - モバイル最適化

---

## 技術的な注意事項

### API エンドポイントの統一
- Backend: `/api/v1/shipments/*` に統一済み
- Legacy: `/shippings/*` も互換性のため残存
- Frontend: `/api/v1/shipments/*` を使用

### データ型の整合性
- `order_id`: string（Backend と一致）
- `carrier`, `tracking_number`: nullable（null 許容）
- `version`: 楽観ロック用（必須）

### CORS 設定
- Backend で localhost からのアクセスを許可
- 本番環境では CORS_ALLOWED_ORIGINS 環境変数で制御

---

## 参照ドキュメント

- [ADR-006: UI Template Strategy](../adr/ADR-006-horizon-ui-adoption.md)
- [Shipping Service Requirements](../requirements/shipping-service-requirements.md)
- [API Handler Implementation](../../apps/api/internal/handler/shipping.go)

---

**本ドキュメントは、Next Shadcn Dashboard の Layout 改善提案をまとめたものである。**
**実装時は、ADR-006 のカスタマイズ原則に従い、既存 UI ベースのスタイルを維持すること。**
