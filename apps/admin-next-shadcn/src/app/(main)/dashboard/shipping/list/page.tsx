import { getMockShipments } from "../_components/api";
import { ShipmentsDataTable } from "../_components/shipments-data-table";

export default function ShippingListPage() {
  const { data: shipments } = getMockShipments(1, 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">発送一覧</h1>
        <p className="text-muted-foreground">すべての発送データを管理できます</p>
      </div>

      <ShipmentsDataTable data={shipments} />
    </div>
  );
}
