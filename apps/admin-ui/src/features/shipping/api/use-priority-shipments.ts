"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPriorityShippings } from "./shipping-api";

export function usePriorityShippings(limit: number = 5) {
  return useQuery({
    queryKey: ["shippings", "priority", limit],
    queryFn: () => fetchPriorityShippings(limit),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
