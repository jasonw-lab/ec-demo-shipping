"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUser, ROLE_OPTIONS, type UserData, updateUser } from "@/lib/api/users";

/** 作成時のバリデーションスキーマ */
const createSchema = z.object({
  username: z
    .string()
    .min(3, "ユーザー名は3文字以上で入力してください")
    .max(50, "ユーザー名は50文字以内で入力してください")
    .regex(/^[a-zA-Z0-9_-]+$/, "ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます"),
  display_name: z.string().min(1, "表示名を入力してください").max(100, "表示名は100文字以内で入力してください"),
  email: z
    .string()
    .max(255, "メールアドレスは255文字以内で入力してください")
    .email("有効なメールアドレスを入力してください")
    .or(z.literal("")),
  role: z.string().min(1, "ロールを選択してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

/** 編集時のバリデーションスキーマ */
const editSchema = z.object({
  username: z.string(),
  display_name: z.string().min(1, "表示名を入力してください").max(100, "表示名は100文字以内で入力してください"),
  email: z
    .string()
    .max(255, "メールアドレスは255文字以内で入力してください")
    .email("有効なメールアドレスを入力してください")
    .or(z.literal("")),
  role: z.string().min(1, "ロールを選択してください"),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  currentUserId?: number;
  onSuccess: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, currentUserId, onSuccess }: UserFormDialogProps) {
  const isEdit = !!user;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateFormData | EditFormData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      username: "",
      display_name: "",
      email: "",
      role: "",
      ...(isEdit ? {} : { password: "" }),
    },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          username: user.username,
          display_name: user.display_name,
          email: user.email ?? "",
          role: user.roles[0]?.code ?? "",
        });
      } else {
        form.reset({
          username: "",
          display_name: "",
          email: "",
          role: "",
          password: "",
        });
      }
    }
  }, [open, user, form]);

  const isSelfRoleChange = isEdit && user?.id === currentUserId;

  async function onSubmit(data: CreateFormData | EditFormData) {
    setIsSubmitting(true);
    try {
      if (isEdit && user) {
        await updateUser(user.id, {
          display_name: data.display_name,
          email: data.email || undefined,
          role: data.role,
          version: user.version,
        });
        toast.success("ユーザー情報を更新しました");
      } else {
        const createData = data as CreateFormData;
        await createUser({
          username: createData.username,
          display_name: createData.display_name,
          email: createData.email || undefined,
          role: createData.role,
          password: createData.password,
        });
        toast.success("ユーザーを作成しました");
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const err = error as { response?: { status: number; data?: { message?: string } } };
      if (err.response?.status === 409) {
        if (err.response.data?.message?.includes("username")) {
          form.setError("username", { message: "このユーザー名は既に使用されています" });
        } else {
          toast.error("データが更新されています。再読み込みしてください");
          onOpenChange(false);
          onSuccess();
        }
      } else {
        toast.error("エラーが発生しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "ユーザー編集" : "新規ユーザー作成"}</DialogTitle>
          <DialogDescription>{isEdit ? "ユーザー情報を編集します" : "新しいユーザーを作成します"}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ユーザー名 {!isEdit && <span className="text-destructive">*</span>}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isEdit} placeholder="user123" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    表示名 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="山田 太郎" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="user@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    ロール <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSelfRoleChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isSelfRoleChange && (
                    <p className="text-muted-foreground text-xs">自分自身のロールは変更できません</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEdit && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      初期パスワード <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "保存" : "作成"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
