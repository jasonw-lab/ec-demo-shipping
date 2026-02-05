"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTimeline } from "./shipping-api";

export function useTimeline(orderId: string | null) {
  return useQuery({
    queryKey: ["timeline", orderId],
    queryFn: () => fetchTimeline(orderId!),
    enabled: !!orderId,
  });
}
