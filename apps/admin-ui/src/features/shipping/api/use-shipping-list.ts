import { useQuery } from "@tanstack/react-query";
import type { ShippingListParams } from "../types";
import { fetchShippings } from "./shipping-api";

export function useShippingList(params: ShippingListParams) {
  return useQuery({
    queryKey: ["shippings", params],
    queryFn: () => fetchShippings(params),
  });
}
