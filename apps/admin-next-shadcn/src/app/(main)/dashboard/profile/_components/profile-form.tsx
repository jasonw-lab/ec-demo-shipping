"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/stores/auth/auth-provider";

/** プロフィール取得レスポンス */
interface ProfileResponse {
  id: number;
  username: string;
  display_name: string;
  email: string;
  roles: { code: string; name: string }[];
  version: number;
}

/** バリデーションスキーマ（SCR-020 Section 5） */
const profileSchema = z.object({
  display_name: z.string().min(1, "表示名を入力してください").max(100, "表示名は100文字以内で入力してください"),
  email: z
    .string()
    .max(255, "メールアドレスは255文字以内で入力してください")
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "有効なメールアドレスを入力してください"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: "",
      email: "",
    },
  });

  /** プロフィール取得 */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/users/me");
        const data: ProfileResponse = response.data.data ?? response.data;
        setProfile(data);
        form.reset({
          display_name: data.display_name || "",
          email: data.email || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("プロフィールの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [form]);

  /** プロフィール保存 */
  const onSubmit = async (values: ProfileFormValues) => {
    if (!profile) return;

    setIsSaving(true);
    try {
      // PUT /users/me は存在しないため、PUT /users/:id を使用
      const response = await apiClient.put(`/users/${profile.id}`, {
        display_name: values.display_name,
        email: values.email || "",
        role: profile.roles[0]?.code || "viewer",
        version: profile.version,
      });

      const updatedData: ProfileResponse = response.data.data ?? response.data;
      setProfile(updatedData);
      form.reset({
        display_name: updatedData.display_name || "",
        email: updatedData.email || "",
      });
      toast.success("プロフィールを更新しました");
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 409) {
        toast.error("データが更新されています。再読み込みしてください");
        // 最新データを再取得
        const response = await apiClient.get("/users/me");
        const data: ProfileResponse = response.data.data ?? response.data;
        setProfile(data);
        form.reset({
          display_name: data.display_name || "",
          email: data.email || "",
        });
      } else {
        toast.error("プロフィールの更新に失敗しました");
      }
    } finally {
      setIsSaving(false);
    }
  };

  /** キャンセル処理 */
  const handleCancel = () => {
    if (profile) {
      form.reset({
        display_name: profile.display_name || "",
        email: profile.email || "",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>プロフィール情報</CardTitle>
        <CardDescription>ユーザー情報の確認と編集ができます</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 読み取り専用: ユーザー名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium" id="username-label">
                ユーザー名
              </label>
              <Input
                value={profile?.username || user?.username || ""}
                disabled
                aria-readonly="true"
                aria-labelledby="username-label"
                className="bg-muted"
              />
              <p className="text-muted-foreground text-xs">ユーザー名は変更できません</p>
            </div>

            {/* 読み取り専用: ロール */}
            <div className="space-y-2">
              <label className="text-sm font-medium" id="role-label">
                ロール
              </label>
              <div className="flex flex-wrap gap-2" aria-labelledby="role-label">
                {profile?.roles && profile.roles.length > 0 ? (
                  profile.roles.map((role, index) => (
                    <Badge key={role.code ?? `role-${index}`} variant="secondary">
                      {role.name ?? role.code ?? String(role)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">ロールが設定されていません</span>
                )}
              </div>
              <p className="text-muted-foreground text-xs">ロールは管理者のみ変更できます</p>
            </div>

            {/* 編集可能: 表示名 */}
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    表示名 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="表示名を入力" disabled={isSaving} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 編集可能: メールアドレス */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="example@example.com" disabled={isSaving} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ボタン */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving || !form.formState.isDirty}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
