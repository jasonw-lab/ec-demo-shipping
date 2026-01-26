'use client';

import DashboardLayout from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@supabase/supabase-js';

interface Props {
  user: User | null | undefined;
  userDetails: { [x: string]: any } | null | any;
}

export default function Shipments(props: Props) {
  return (
    <DashboardLayout
      user={props.user}
      userDetails={props.userDetails}
      title="発送一覧"
      description="発送の管理"
    >
      <div className="h-full w-full">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              発送一覧
            </h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">
                発送データ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                発送一覧の詳細実装は Issue 015 で対応予定です。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
