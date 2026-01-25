"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchShippingDetail } from "./shipping-api";

export function useShippingDetail(orderId: string | null) {
  return useQuery({
    queryKey: ["shipping", orderId],
    queryFn: () => fetchShippingDetail(orderId!),
    enabled: !!orderId,
    retry: (failureCount, error) => {
      // Don't retry on 404
      if ((error as { status?: number })?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
