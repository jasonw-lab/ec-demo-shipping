"use client";

import { Suspense, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AUTH_ERROR_MESSAGES, AuthError } from "@/lib/auth/types";
import { useAuth } from "@/stores/auth/auth-provider";

/**
 * SCR-010 バリデーションスキーマ
 */
const loginSchema = z.object({
  username: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .min(3, "ユーザー名は3文字以上で入力してください")
    .max(50, "ユーザー名は50文字以内で入力してください"),
  password: z.string().min(1, "パスワードを入力してください").min(8, "パスワードは8文字以上で入力してください"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);

    try {
      await login(data.username, data.password);

      // ログイン成功: リダイレクト
      const returnUrl = searchParams.get("returnUrl");
      router.push(returnUrl || "/dashboard");
      router.refresh();
    } catch (err) {
      // パスワードをクリア
      form.setValue("password", "");

      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError(AUTH_ERROR_MESSAGES.server_error);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label="ログインフォーム">
        {/* エラーメッセージ */}
        {error && (
          <Alert variant="destructive" role="alert" aria-live="polite">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ユーザー名 */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ユーザー名</FormLabel>
              <FormControl>
                <Input
                  placeholder="ユーザー名を入力"
                  autoComplete="username"
                  autoFocus
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* パスワード */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="パスワードを入力"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ログインボタン */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ログイン中...
            </>
          ) : (
            "ログイン"
          )}
        </Button>
      </form>
    </Form>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
