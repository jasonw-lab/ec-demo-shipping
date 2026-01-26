import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShippingListPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">発送一覧</h1>
        <p className="text-muted-foreground">すべての発送データを管理できます</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>発送一覧画面は Phase 2-2 で実装予定です</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            この画面では以下の機能が提供されます：
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-muted-foreground">
            <li>発送データテーブル表示</li>
            <li>フィルタバー（ステータス / 配送業者 / 日付範囲）</li>
            <li>ソート機能</li>
            <li>ページネーション</li>
            <li>一括操作（複数行選択 → ステータス変更）</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
