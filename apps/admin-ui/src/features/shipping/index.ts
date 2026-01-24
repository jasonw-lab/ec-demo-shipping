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

// API hooks (will be added in issue-006)
// export { useShippingList, useShippingDetail, useShippingSummary } from './api';

// Components (will be added in issue-006, issue-007)
// export { ShippingTable, ShippingFilters, StatusBadge } from './components';
