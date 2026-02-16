"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkUpdateShippings } from "./shipping-api";
import type { BulkUpdateRequest } from "../types";

export function useBulkUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateRequest) => bulkUpdateShippings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shippings"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["priority-shipments"] });
    },
  });
}
