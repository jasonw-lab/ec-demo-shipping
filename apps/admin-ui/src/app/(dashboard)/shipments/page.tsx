import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShipmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">発送一覧</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>発送データ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            発送一覧は issue-006 で実装予定です。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
