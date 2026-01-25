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
  UpdateShippingRequest,
  ValidationError,
  ApiError,
} from "./types";

// API hooks
export {
  useShippingList,
  useShippingDetail,
  useUpdateShipping,
  useSummary,
} from "./api";

// Components
export {
  ShippingList,
  ShippingTable,
  FilterBar,
  StatusBadge,
  Pagination,
  ShippingDetailSheet,
  ShippingInfo,
  ShipForm,
  TrackingLink,
  StatusActionButton,
  Dashboard,
  SummaryCard,
} from "./components";
