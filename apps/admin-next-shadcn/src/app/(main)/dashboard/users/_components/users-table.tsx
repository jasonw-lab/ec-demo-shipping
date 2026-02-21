"use client";

import { useCallback, useEffect, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { KeyRound, Pencil, RefreshCw, Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchUsers, getRoleDisplayName, ROLE_OPTIONS, type UserData, type UsersFilterParams } from "@/lib/api/users";
import { useAuth } from "@/stores/auth/auth-provider";

import { PasswordResetDialog } from "./password-reset-dialog";
import { StatusToggleDialog } from "./status-toggle-dialog";
import { UserFormDialog } from "./user-form-dialog";

/** ロールバッジの配色 */
function getRoleBadgeVariant(code: string): "default" | "secondary" | "outline" {
  switch (code) {
    case "admin":
      return "default";
    case "operator":
      return "secondary";
    default:
      return "outline";
  }
}

/** ステータスバッジ */
function StatusBadge({ isActive, onClick, disabled }: { isActive: boolean; onClick?: () => void; disabled?: boolean }) {
  const badge = (
    <Badge
      variant={isActive ? "default" : "destructive"}
      className={`cursor-pointer ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      onClick={disabled ? undefined : onClick}
    >
      {isActive ? "有効" : "無効"}
    </Badge>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>自分自身は無効化できません</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

export function UsersTable() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<UsersFilterParams>({
    keyword: "",
    role: "",
    is_active: undefined,
    page: 1,
    size: 20,
  });

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserData | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusUser, setStatusUser] = useState<UserData | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: UsersFilterParams = {
        page: filters.page,
        size: filters.size,
      };
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.role) params.role = filters.role;
      if (filters.is_active !== undefined) params.is_active = filters.is_active;

      const response = await fetchUsers(params);
      setUsers(response.data);
      setTotal(response.total);
    } catch {
      toast.error("ユーザー一覧の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    loadUsers();
  }

  function handleReset() {
    setFilters({
      keyword: "",
      role: "",
      is_active: undefined,
      page: 1,
      size: 20,
    });
  }

  function openCreateDialog() {
    setEditingUser(null);
    setFormDialogOpen(true);
  }

  function openEditDialog(user: UserData) {
    setEditingUser(user);
    setFormDialogOpen(true);
  }

  function openPasswordDialog(user: UserData) {
    setPasswordUser(user);
    setPasswordDialogOpen(true);
  }

  function openStatusDialog(user: UserData) {
    setStatusUser(user);
    setStatusDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">ユーザー管理</h1>
            <p className="text-muted-foreground text-sm">ユーザーアカウントの管理</p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          新規ユーザー作成
        </Button>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 rounded-lg border p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="名前 / メールで検索"
            className="pl-9"
            value={filters.keyword ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
          />
        </div>
        <Select
          value={filters.role ?? "all"}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value === "all" ? "" : value }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="ロール" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのロール</SelectItem>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.is_active === undefined ? "all" : filters.is_active ? "active" : "inactive"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              is_active: value === "all" ? undefined : value === "active",
            }))
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="active">有効</SelectItem>
            <SelectItem value="inactive">無効</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          検索
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={handleReset}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">ユーザー名</TableHead>
              <TableHead className="w-[150px]">表示名</TableHead>
              <TableHead className="w-[200px]">メールアドレス</TableHead>
              <TableHead className="w-[120px]">ロール</TableHead>
              <TableHead className="w-[80px]">ステータス</TableHead>
              <TableHead className="w-[120px]">最終ログイン</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  ユーザーが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.display_name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email || "-"}</TableCell>
                    <TableCell>
                      {user.roles.map((role) => (
                        <Badge key={role.code} variant={getRoleBadgeVariant(role.code)}>
                          {getRoleDisplayName(role.code)}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={user.is_active} onClick={() => openStatusDialog(user)} disabled={isSelf} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.last_login_at
                        ? formatDistanceToNow(new Date(user.last_login_at), {
                            addSuffix: true,
                            locale: ja,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>編集</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openPasswordDialog(user)}>
                                <KeyRound className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>パスワードリセット</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      {!isLoading && users.length > 0 && <div className="text-muted-foreground text-sm">全 {total} 件</div>}

      {/* Dialogs */}
      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        user={editingUser}
        currentUserId={currentUser?.id}
        onSuccess={loadUsers}
      />
      <PasswordResetDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} user={passwordUser} />
      <StatusToggleDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        user={statusUser}
        onSuccess={loadUsers}
      />
    </div>
  );
}
