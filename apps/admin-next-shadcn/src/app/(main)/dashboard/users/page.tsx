"use client";

import { AdminGuard } from "./_components/admin-guard";
import { UsersTable } from "./_components/users-table";

/**
 * SCR-030 ユーザー管理画面
 */
export default function UsersPage() {
  return (
    <AdminGuard>
      <div className="mx-auto max-w-6xl space-y-6">
        <UsersTable />
      </div>
    </AdminGuard>
  );
}
