import { create } from "zustand";
import type { Shipping, ShippingSummary } from "@/lib/types/shipping";

interface ShippingFilter {
  status?: string;
  carrier?: string;
  keyword?: string;
}

interface ShippingState {
  // List state
  shippings: Shipping[];
  total: number;
  page: number;
  size: number;
  isLoading: boolean;
  error: string | null;

  // Filter state
  filter: ShippingFilter;

  // Summary state
  summary: ShippingSummary | null;

  // Selected shipping for detail view
  selectedShipping: Shipping | null;

  // Actions
  setShippings: (shippings: Shipping[], total: number, page: number, size: number) => void;
  setFilter: (filter: ShippingFilter) => void;
  setPage: (page: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSummary: (summary: ShippingSummary) => void;
  setSelectedShipping: (shipping: Shipping | null) => void;
  updateShipping: (shipping: Shipping) => void;
  clearFilter: () => void;
}

export const useShippingStore = create<ShippingState>((set) => ({
  // Initial state
  shippings: [],
  total: 0,
  page: 1,
  size: 20,
  isLoading: false,
  error: null,
  filter: {},
  summary: null,
  selectedShipping: null,

  // Actions
  setShippings: (shippings, total, page, size) =>
    set({ shippings, total, page, size, error: null }),

  setFilter: (filter) =>
    set({ filter, page: 1 }), // Reset to page 1 when filter changes

  setPage: (page) =>
    set({ page }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setError: (error) =>
    set({ error, isLoading: false }),

  setSummary: (summary) =>
    set({ summary }),

  setSelectedShipping: (shipping) =>
    set({ selectedShipping: shipping }),

  updateShipping: (updatedShipping) =>
    set((state) => ({
      shippings: state.shippings.map((s) =>
        s.order_id === updatedShipping.order_id ? updatedShipping : s
      ),
      selectedShipping:
        state.selectedShipping?.order_id === updatedShipping.order_id
          ? updatedShipping
          : state.selectedShipping,
    })),

  clearFilter: () =>
    set({ filter: {}, page: 1 }),
}));
