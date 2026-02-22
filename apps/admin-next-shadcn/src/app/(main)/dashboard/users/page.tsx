"use client";

import { AdminGuard } from "./_components/admin-guard";
import { UsersTable } from "./_components/users-table";

/**
 * SCR-030 ユーザー管理画面
 */
export default function UsersPage() {
  return (
    <AdminGuard>
      <div className="flex flex-col gap-6">
        <UsersTable />
      </div>
    </AdminGuard>
  );
}
