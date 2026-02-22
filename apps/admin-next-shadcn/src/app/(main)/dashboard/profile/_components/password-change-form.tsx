"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/stores/auth/auth-provider";

/** バリデーションスキーマ（SCR-020 Section 5） */
const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "現在のパスワードを入力してください"),
    new_password: z
      .string()
      .min(1, "新しいパスワードを入力してください")
      .min(8, "パスワードは8文字以上で入力してください"),
    confirm_password: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "パスワードが一致しません",
    path: ["confirm_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "現在のパスワードと異なるパスワードを入力してください",
    path: ["new_password"],
  });

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export function PasswordChangeForm() {
  const { user } = useAuth();
  const [isChanging, setIsChanging] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  /** パスワード変更処理 */
  const onSubmit = async (values: PasswordChangeFormValues) => {
    if (!user?.id) {
      toast.error("ユーザー情報が取得できません");
      return;
    }

    setIsChanging(true);
    try {
      // /users/me/password は存在しないため、/users/:id/password を使用
      await apiClient.put(`/users/${user.id}/password`, {
        current_password: values.current_password,
        new_password: values.new_password,
      });

      toast.success("パスワードを変更しました");
      form.reset();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        form.setError("current_password", {
          type: "manual",
          message: "現在のパスワードが正しくありません",
        });
      } else {
        toast.error("パスワードの変更に失敗しました");
      }
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>パスワード変更</CardTitle>
        <CardDescription>アカウントのパスワードを変更できます</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 現在のパスワード */}
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    現在のパスワード <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="現在のパスワードを入力"
                        autoComplete="current-password"
                        disabled={isChanging}
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showCurrentPassword ? "パスワードを隠す" : "パスワードを表示"}
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 新しいパスワード */}
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    新しいパスワード <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="新しいパスワードを入力"
                        autoComplete="new-password"
                        disabled={isChanging}
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showNewPassword ? "パスワードを隠す" : "パスワードを表示"}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 新しいパスワード（確認） */}
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    新しいパスワード（確認） <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="新しいパスワードを再入力"
                        autoComplete="new-password"
                        disabled={isChanging}
                        className="pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? "パスワードを隠す" : "パスワードを表示"}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ボタン */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isChanging}>
                {isChanging ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    変更中...
                  </>
                ) : (
                  "パスワードを変更"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
