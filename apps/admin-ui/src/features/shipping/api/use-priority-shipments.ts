"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPriorityShippings } from "./shipping-api";

export function usePriorityShipments(limit: number = 5) {
  return useQuery({
    queryKey: ["priority-shipments", limit],
    queryFn: () => fetchPriorityShippings(limit),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
}
