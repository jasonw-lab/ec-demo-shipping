"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Carrier, ValidationError } from "../types";

const carrierOptions: { value: Carrier; label: string }[] = [
  { value: "YAMATO", label: "ヤマト運輸" },
  { value: "SAGAWA", label: "佐川急便" },
  { value: "JAPAN_POST", label: "日本郵便" },
];

const shipSchema = z.object({
  carrier: z.enum(["YAMATO", "SAGAWA", "JAPAN_POST"], {
    message: "配送業者を選択してください",
  }),
  tracking_number: z
    .string()
    .min(1, "追跡番号を入力してください")
    .min(11, "追跡番号は11桁以上です")
    .max(14, "追跡番号は14桁以下です")
    .regex(/^[A-Z0-9]+$/i, "英数字のみ使用できます"),
});

export type ShipFormData = z.infer<typeof shipSchema>;

interface ShipFormProps {
  onSubmit: (data: ShipFormData) => void;
  isLoading?: boolean;
  serverErrors?: ValidationError[];
}

export function ShipForm({ onSubmit, isLoading, serverErrors }: ShipFormProps) {
  const form = useForm<ShipFormData>({
    resolver: zodResolver(shipSchema),
    defaultValues: {
      carrier: undefined,
      tracking_number: "",
    },
  });

  // Set server errors on form fields
  if (serverErrors && serverErrors.length > 0) {
    serverErrors.forEach((error) => {
      const fieldName = error.field as keyof ShipFormData;
      if (fieldName in form.getValues()) {
        form.setError(fieldName, {
          type: "server",
          message: error.reason,
        });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
            出荷処理
          </h4>
        </div>

        <FormField
          control={form.control}
          name="carrier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>配送業者</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="配送業者を選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {carrierOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tracking_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>追跡番号</FormLabel>
              <FormControl>
                <Input
                  placeholder="例: 123456789012"
                  {...field}
                  onChange={(e) =>
                    field.onChange(e.target.value.toUpperCase())
                  }
                />
              </FormControl>
              <FormDescription>11-14桁の英数字を入力</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Truck className="mr-2 h-4 w-4" />
          )}
          出荷完了
        </Button>
      </form>
    </Form>
  );
}
