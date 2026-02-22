"use client";

import { CircleUser } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { PasswordChangeForm } from "./_components/password-change-form";
import { ProfileForm } from "./_components/profile-form";

/**
 * SCR-020 プロフィール画面
 */
export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* ページヘッダー */}
      <div className="flex items-center gap-3">
        <CircleUser className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">マイプロフィール</h1>
          <p className="text-muted-foreground text-sm">プロフィール情報の確認・編集</p>
        </div>
      </div>

      <Separator />

      {/* プロフィール情報カード */}
      <ProfileForm />

      {/* パスワード変更カード */}
      <PasswordChangeForm />
    </div>
  );
}
