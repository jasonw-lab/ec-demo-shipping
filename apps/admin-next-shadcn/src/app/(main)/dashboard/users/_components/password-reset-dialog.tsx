"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetUserPassword, type UserData } from "@/lib/api/users";

const schema = z.object({
  new_password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type FormData = z.infer<typeof schema>;

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
}

export function PasswordResetDialog({ open, onOpenChange, user }: PasswordResetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      new_password: "",
    },
  });

  async function onSubmit(data: FormData) {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await resetUserPassword(user.id, data);
      toast.success("パスワードをリセットしました。新しいパスワードをユーザーに通知してください。");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("パスワードのリセットに失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset();
    }
    onOpenChange(open);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>パスワードリセット</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                ユーザー: <strong>{user?.username}</strong> ({user?.display_name})
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    新しいパスワード <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="••••••••" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="bg-warning/10 text-warning-foreground flex items-start gap-2 rounded-md border border-yellow-200 p-3 text-sm dark:border-yellow-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
              <span className="text-yellow-800 dark:text-yellow-200">
                リセット後、このユーザーの全セッションが無効化されます。
              </span>
            </div>
            <AlertDialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                リセット
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
