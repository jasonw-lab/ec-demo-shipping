# Square UI 実装 Issue 管理

**作成日**: 2026-01-27
**対象ディレクトリ**: `apps/admin-square-ui`
**UIベース**: [Square UI](https://github.com/ln-dev7/square-ui)
**根拠 ADR**: [ADR-006: UI Template Strategy](../adr/ADR-006-horizon-ui-adoption.md)

---

## 📋 Square UI の特徴

### デザイン特性
- **モダンダッシュボードデザイン**: 洗練されたKPI表示に最適化
- **Sidebar + Header レイアウト**: SidebarProvider ベースの構成
- **角丸コーナー**: `rounded-xl` / `rounded-md` を多用
- **ボーダー強調**: `border border-border` による視覚的区切り
- **背景の階層化**: `bg-card` / `bg-muted/50` / `bg-background` の使い分け

### カラーシステム
Square UI はテーマカラーベースの配色を採用：
- `text-foreground` / `text-muted-foreground`: テキスト色
- `bg-card` / `bg-muted`: カード・背景色
- `border-border`: ボーダー色
- ダークモード: 全コンポーネントで完全対応

### スタイル一貫性ガイドライン

#### 維持すべきスタイル
- **カード**: `rounded-xl border border-border bg-card`
- **テーブル**: `overflow-hidden` で角丸を維持
- **ボタン**: `h-7` / `h-8` / `size="sm"` でコンパクトに
- **アイコン**: `size-4` / `size-3.5` を基本とする
- **間隔**: `p-4` / `gap-2` / `gap-4` の統一

#### 禁止事項
- ハードコードされた色（`text-blue-600` など）の新規追加は原則禁止
- テーマカラー（`text-primary`, `text-destructive` など）を優先使用
- 例外的にステータス表示でのセマンティックカラー使用は許容

---

## ✅ Phase 1: レイアウトシステム整備

### 状態: 完了

#### 実装内容
1. **Sidebar ナビゲーション追加**
   - `components/dashboard/sidebar.tsx` に発送管理メニューセクションを追加
   - Collapsible で折りたたみ可能
   - `usePathname` でアクティブ状態を判定

2. **ページレイアウト**
   - SidebarProvider + DashboardSidebar 構成を維持
   - 各ページで共通レイアウトラッパーを使用

#### 使用コンポーネント
- `@/components/ui/sidebar` (SidebarProvider, SidebarMenu, etc.)
- `@/components/ui/collapsible` (Collapsible, CollapsibleTrigger, CollapsibleContent)

---

## ✅ Phase 2-1: ダッシュボード画面

### 状態: 完了

#### 実装ファイル
- `app/shipping/page.tsx` - ダッシュボードページ
- `components/shipping/shipping-header.tsx` - ヘッダーコンポーネント
- `components/shipping/shipping-dashboard-content.tsx` - コンテンツ部
- `components/shipping/shipping-stat-card.tsx` - KPIカード
- `components/shipping/priority-shipments.tsx` - 要対応発送リスト

#### KPIカード仕様
| カード | データソース | リンク先 |
|--------|-------------|----------|
| 出荷準備中 | `summary.created` | `/shipping/list?status=CREATED` |
| 出荷指示済み | `summary.ready` | `/shipping/list?status=READY` |
| 本日発送 | `summary.shippedToday` | `/shipping/list?status=SHIPPED` |
| 返品対応 | `summary.returned` | `/shipping/list?status=RETURNED` |

#### スタイル適用例
```tsx
// KPIカード
<div className="rounded-xl border border-border bg-card p-4">
  <div className="flex items-start justify-between">
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-medium text-foreground">{value}</p>
    </div>
    <div className="flex size-16 items-center justify-center rounded-lg bg-muted border border-border">
      <Icon className="size-8 text-muted-foreground" />
    </div>
  </div>
</div>
```

---

## ✅ Phase 2-2: 発送一覧画面

### 状態: 完了

#### 実装ファイル
- `app/shipping/list/page.tsx` - 一覧ページ
- `components/shipping/shipping-table.tsx` - データテーブル
- `components/shipping/shipping-list-content.tsx` - コンテンツラッパー

#### 機能仕様
- TanStack React Table による一覧表示
- ステータス・配送業者フィルタ（DropdownMenu）
- 注文ID検索（Input）
- 行選択（Checkbox）
- ページネーション
- 列表示切り替え

#### スタイル適用例
```tsx
// テーブルコンテナ
<div className="rounded-xl border border-border bg-card">
  <div className="flex items-center gap-4 border-b border-border p-4">
    {/* フィルタバー */}
  </div>
  <div className="overflow-hidden">
    <Table>...</Table>
  </div>
  <div className="border-t border-border p-4">
    {/* ページネーション */}
  </div>
</div>
```

---

## ✅ Phase 2-3: 発送詳細画面

### 状態: 完了

#### 実装ファイル
- `components/shipping/shipping-detail-sheet.tsx` - 詳細Sheet

#### セクション構成
1. **ステータスカード** - 現在のステータスとバージョン表示
2. **配送情報** - 配送業者・追跡番号（外部リンク対応）
3. **配送先住所** - 住所表示
4. **ステータス履歴** - タイムライン表示
5. **監査ログ** - 変更履歴（変更前後の値を色分け表示）
6. **アクション** - ステータス別操作ボタン

#### スタイル適用例
```tsx
// ステータスカード
<div className={cn(
  "rounded-xl border-2 p-6",
  statusColors[status]  // ステータス別の色
)}>
  <div className="flex items-center gap-4">
    <div className="rounded-xl bg-background p-4 shadow-sm">
      <StatusIcon className="size-8" />
    </div>
    <div className="flex-1">
      <p className="text-sm opacity-70">現在のステータス</p>
      <p className="text-xl font-bold">{STATUS_LABELS[status]}</p>
    </div>
  </div>
</div>
```

---

## 📁 ディレクトリ構成

```
apps/admin-square-ui/
├── app/
│   ├── page.tsx                      # メインダッシュボード（既存）
│   └── shipping/
│       ├── page.tsx                  # 発送ダッシュボード
│       └── list/
│           └── page.tsx              # 発送一覧
├── components/
│   ├── dashboard/
│   │   └── sidebar.tsx               # サイドバー（発送メニュー追加）
│   ├── shipping/
│   │   ├── shipping-header.tsx       # ヘッダー
│   │   ├── shipping-stat-card.tsx    # KPIカード
│   │   ├── priority-shipments.tsx    # 要対応リスト
│   │   ├── shipping-table.tsx        # データテーブル
│   │   ├── shipping-detail-sheet.tsx # 詳細Sheet
│   │   ├── shipping-dashboard-content.tsx # ダッシュボード内容
│   │   └── shipping-list-content.tsx     # 一覧内容
│   └── ui/                           # shadcn/ui コンポーネント
├── mock-data/
│   └── shipping.ts                   # モックデータ・型定義
└── store/
    └── shipping-store.ts             # Zustand ストア
```

---

## 🔄 状態管理

### Zustand Store (`store/shipping-store.ts`)

```typescript
interface ShippingState {
  shipments: Shipment[];
  summary: ShippingSummary;
  priorityShipments: PriorityShipment[];
  selectedShipment: Shipment | null;
  statusFilter: ShippingStatus | "all";
  carrierFilter: Carrier | "all";
  setSelectedShipment: (shipment: Shipment | null) => void;
  setStatusFilter: (status: ShippingStatus | "all") => void;
  setCarrierFilter: (carrier: Carrier | "all") => void;
  getFilteredShipments: () => Shipment[];
  getTimeline: (shipmentId: string) => TimelineEvent[];
  getAuditLogs: (shipmentId: string) => AuditLog[];
}
```

---

## 📝 実装上の注意点

### チェックボックス操作の分離
行クリックで詳細Sheetが開くため、チェックボックスのクリックは `stopPropagation` で分離：

```tsx
<div onClick={(e) => e.stopPropagation()}>
  <Checkbox ... />
</div>
```

### フィルタリングの実装
TanStack Table のフィルタと Zustand Store のフィルタを併用：
- **テーブル内検索**: TanStack Table の `setFilterValue`
- **グローバルフィルタ**: Zustand の `statusFilter` / `carrierFilter`

---

## 📚 参考資料

- [Square UI GitHub](https://github.com/ln-dev7/square-ui)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Table](https://tanstack.com/table/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)

---

**このドキュメントは Square UI ベースの実装詳細を管理するファイルです。**
**共通仕様は [ui-refactoring-common.md](./ui-refactoring-common.md) を参照してください。**
