// Shipping feature public API
// Only export from this file - no deep imports allowed (ADR-003)

// Types
export type {
  Shipping,
  ShippingStatus,
  Carrier,
  ShippingListParams,
  ShippingListResponse,
  ShippingSummary,
} from "./types";

// API hooks
export { useShippingList } from "./api";

// Components
export {
  ShippingList,
  ShippingTable,
  FilterBar,
  StatusBadge,
  Pagination,
} from "./components";
