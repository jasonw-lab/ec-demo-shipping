"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateShipping } from "./shipping-api";
import type { UpdateShippingRequest } from "../types";

interface UpdateParams {
  orderId: string;
  data: UpdateShippingRequest;
}

export function useUpdateShipping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: UpdateParams) =>
      updateShipping(orderId, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific shipping detail
      queryClient.invalidateQueries({
        queryKey: ["shipping", variables.orderId],
      });
      // Invalidate the shipping list to reflect changes
      queryClient.invalidateQueries({
        queryKey: ["shippings"],
      });
      // Invalidate summary for dashboard
      queryClient.invalidateQueries({
        queryKey: ["shippings", "summary"],
      });
    },
  });
}
