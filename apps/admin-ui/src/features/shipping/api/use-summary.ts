"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSummary } from "./shipping-api";

export function useSummary() {
  return useQuery({
    queryKey: ["shippings", "summary"],
    queryFn: fetchSummary,
  });
}
