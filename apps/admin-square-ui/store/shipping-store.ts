import { create } from "zustand";
import {
  mockShipments,
  mockShippingSummary,
  mockPriorityShipments,
  mockTimelines,
  mockAuditLogs,
  type Shipment,
  type ShippingSummary,
  type PriorityShipment,
  type TimelineEvent,
  type AuditLog,
  type ShippingStatus,
  type Carrier,
} from "@/mock-data/shipping";

interface ShippingState {
  shipments: Shipment[];
  summary: ShippingSummary;
  priorityShipments: PriorityShipment[];
  selectedShipment: Shipment | null;
  statusFilter: ShippingStatus | "all";
  carrierFilter: Carrier | "all";
  setSelectedShipment: (shipment: Shipment | null) => void;
  setStatusFilter: (status: ShippingStatus | "all") => void;
  setCarrierFilter: (carrier: Carrier | "all") => void;
  getFilteredShipments: () => Shipment[];
  getTimeline: (shipmentId: string) => TimelineEvent[];
  getAuditLogs: (shipmentId: string) => AuditLog[];
}

export const useShippingStore = create<ShippingState>((set, get) => ({
  shipments: mockShipments,
  summary: mockShippingSummary,
  priorityShipments: mockPriorityShipments,
  selectedShipment: null,
  statusFilter: "all",
  carrierFilter: "all",
  setSelectedShipment: (shipment) => set({ selectedShipment: shipment }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setCarrierFilter: (carrier) => set({ carrierFilter: carrier }),
  getFilteredShipments: () => {
    const { shipments, statusFilter, carrierFilter } = get();
    return shipments.filter((shipment) => {
      const statusMatch = statusFilter === "all" || shipment.status === statusFilter;
      const carrierMatch = carrierFilter === "all" || shipment.carrier === carrierFilter;
      return statusMatch && carrierMatch;
    });
  },
  getTimeline: (shipmentId) => mockTimelines[shipmentId] || [],
  getAuditLogs: (shipmentId) => mockAuditLogs[shipmentId] || [],
}));
