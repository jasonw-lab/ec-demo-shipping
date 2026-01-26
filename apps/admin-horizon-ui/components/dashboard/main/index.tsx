'use client';

import DashboardLayout from '@/components/layout';
import { Dashboard } from '@/features/shipping';
import { User } from '@supabase/supabase-js';

interface Props {
  user: User | null | undefined;
  userDetails: { [x: string]: any } | null | any;
}

export default function MainDashboard(props: Props) {
  return (
    <DashboardLayout
      user={props.user}
      userDetails={props.userDetails}
      title="発送管理ダッシュボード"
      description="発送状況の概要を確認"
    >
      <div className="h-full w-full max-w-full">
        <Dashboard />
      </div>
    </DashboardLayout>
  );
}
