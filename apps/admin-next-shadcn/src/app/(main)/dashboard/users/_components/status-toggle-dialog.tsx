"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type UserData, updateUserStatus } from "@/lib/api/users";

interface StatusToggleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onSuccess: () => void;
}

export function StatusToggleDialog({ open, onOpenChange, user, onSuccess }: StatusToggleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const willActivate = !user.is_active;

  async function handleConfirm() {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await updateUserStatus(user.id, {
        is_active: willActivate,
        version: user.version,
      });
      toast.success(willActivate ? "ユーザーを有効化しました" : "ユーザーを無効化しました");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 409) {
        toast.error("データが更新されています。再読み込みしてください");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error("ステータスの更新に失敗しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{willActivate ? "ユーザーを有効化" : "ユーザーを無効化"}</AlertDialogTitle>
          <AlertDialogDescription>
            {willActivate ? (
              <>このユーザーを有効にしますか？</>
            ) : (
              <>
                このユーザーを無効にしますか？
                <br />
                無効化すると、このユーザーはログインできなくなります。
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={willActivate ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {willActivate ? "有効化" : "無効化"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
