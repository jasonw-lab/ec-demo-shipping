# Issue 014: ダッシュボード画面 Horizon UI 移行

**作成日**: 2026-01-26  
**優先度**: P1  
**工数見積**: 0.5〜1日  
**ステータス**: ✅ 完了  
**前提条件**: Issue 013（レイアウトシステム統一）完了  
**関連 ADR**: [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)

---

## 📋 概要

既存のダッシュボード画面（Issue 010 で拡張済み）を Horizon UI ベースにリファクタリングする。

**重要**: UI フレームワークの移行のみを行い、機能仕様・ビジネスロジックは完全に維持します。

---

## 📖 機能仕様参照

本Issueは以下の既存仕様を維持します：

### 参照ドキュメント
- **[Issue 010: ダッシュボード画面改善](issue-010-dashboard.md)** - KPI定義、要対応発送リスト仕様

### 機能仕様の詳細

#### SHIPPED TODAY 定義
- **定義**: JST基準で当日00:00:00〜23:59:59の間にステータスがSHIPPEDに変更された発送
- **API**: `GET /api/v1/shipments?shipped_from=2026-01-26T00:00:00+09:00&shipped_to=2026-01-26T23:59:59+09:00`
- **タイムゾーン処理**: date-fns + date-fns-tz を使用

#### 要対応発送の優先度ルール
1. **①RETURNED**（全件） - 最優先対応
2. **②CREATED**（作成後24h超過） - 長期滞留の未着手
3. **③READY**（更新日時の古い順） - 準備完了の古いもの

#### データ取得API
- **KPI取得**: `GET /api/v1/shipments/summary`
- **要対応リスト取得**: `GET /api/v1/shipments/priority?limit=5`

---

## 🎯 対応内容

### 1. KPI カード UI 変更
- Horizon UI の Card コンポーネントを使用
- クリッカブルデザインの強化（hover エフェクト）
- RETURNED カードの警告表示（Horizon UI の destructive variant 使用）

### 2. 要対応発送リスト UI 変更
- Horizon UI の Table コンポーネントを使用
- コンパクト表示（Dashboard 下部に配置）
- 「すべて表示」リンクの視認性向上

### 3. レスポンシブ対応
- KPI カード: Grid レイアウト（Mobile: 1列、Tablet: 2列、Desktop: 4列）
- 要対応リスト: Horizontal Scroll 対応（Mobile）

---

## 🛠️ 技術要件

### 使用コンポーネント
- Horizon UI: Card (KPI カード)
- shadcn/ui: Table (要対応リスト), Badge (ステータス表示)
- lucide-react: アイコン

### ファイル変更箇所
```
apps/admin-horizon-ui/
├── app/
│   └── (dashboard)/
│       └── page.tsx                      # Server Component (変更なし)
└── features/
    └── shipping/
        └── components/
            ├── dashboard.tsx              # ← Horizon UI ベース (メイン変更)
            └── summary-card.tsx           # ← Horizon UI Card (メイン変更)
```

---

## ✅ 受け入れ条件

- [x] KPI カードが Horizon UI デザインで表示される
- [x] KPI カードクリックで適切な発送一覧に遷移する
  - CREATED → `/shipments?status=CREATED`
  - SHIPPED TODAY → `/shipments?status=SHIPPED&date=today`
  - RETURNED → `/shipments?status=RETURNED`
- [x] RETURNED カードが警告表示（Horizon UI の destructive variant）される
- [x] 要対応発送リストが正しく表示される（最大5件、優先度ルール適用）
- [x] Light/Dark Mode で正常に表示される
- [x] レスポンシブ対応（Mobile / Tablet / Desktop）

---

## 🎨 カスタマイズ制約（重要）

### 🚫 変更禁止
- Horizon UI の Card コンポーネント構造
- グリッドレイアウトシステム（`grid gap-4 md:grid-cols-2 lg:grid-cols-4`）
- Horizon UI が提供する Spacing / Padding
- テーマカラーシステム

### ✅ カスタマイズ可能
- KPI カードの variant 指定（Horizon UI の variant のみ）
  - 例: RETURNED は `variant="destructive"` または `className="border-destructive bg-destructive/10"`
  - ❌ 禁止: `className="border-red-300 bg-red-50"` （独自色指定）
- カード内のアイコン（lucide-react 範囲内）
- カード内のテキスト・ラベル（日本語化）
- 数値フォーマット（3桁カンマ区切りなど）

### ⚠️ 実装時の注意
- Horizon UI の Card コンポーネントをベースに使用
- 構造は変更せず、`className` での色変更に留める
- レスポンシブグリッドは Horizon UI のパターンを維持

---

## 🚫 非対応（本Issue外）

- データ取得ロジックの変更（`api/` は変更なし）
- グラフ・チャート追加
- 新規 KPI 追加
- タイムゾーン処理の変更（既存の date-fns 実装を維持）

---

## 📚 参考資料

- [Issue 010: ダッシュボード画面改善](issue-010-dashboard.md)
- [ADR-006: UI Template Strategy](../adr/ADR-006-multi-ui-template.md)
- [Horizon UI Card Component](https://horizon-ui.com/docs-boilerplate/shadcn-components)

---

## 📝 実装ガイドライン（AI Agent 向け）

### 必須遵守事項

1. **Horizon UI のソースコードをベースに実装**
   - `components/ui/card.tsx` をそのまま使用
   - 構造・スタイルは変更しない

2. **カスタマイズは Horizon UI のテーマカラーのみ**
   ```tsx
   // ✅ OK: Horizon UI のテーマカラー使用
   <Card className="border-destructive bg-destructive/10">
     <CardContent className="text-destructive-foreground">
       返送が発生しています
     </CardContent>
   </Card>
   
   // ❌ NG: Tailwind の独自色指定
   <Card className="border-red-300 bg-red-50">
   </Card>
   ```

3. **データ取得ロジックは変更しない**
   - `features/shipping/api/` は維持
   - 既存の date-fns 実装を維持

4. **Horizon UI の推奨パターンに従う**
   - ドキュメント参照: https://horizon-ui.com/docs-boilerplate/shadcn-components
   - レスポンシブグリッドは Horizon UI のパターンを使用

### KPI カードの実装例

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* CREATED カード */}
  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle>未着手</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{summary.created}</p>
    </CardContent>
  </Card>

  {/* RETURNED カード（警告表示） */}
  <Card className="border-destructive bg-destructive/10 cursor-pointer">
    <CardHeader>
      <CardTitle className="text-destructive">返送</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-destructive">{summary.returned}</p>
    </CardContent>
  </Card>
</div>
```

---

**このIssueは Issue 013（レイアウトシステム統一）完了後に着手してください。**
