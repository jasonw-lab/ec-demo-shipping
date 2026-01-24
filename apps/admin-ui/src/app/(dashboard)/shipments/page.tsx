import { ShippingList } from "@/features/shipping";

export default function ShipmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">発送一覧</h2>
      </div>

      <ShippingList />
    </div>
  );
}
