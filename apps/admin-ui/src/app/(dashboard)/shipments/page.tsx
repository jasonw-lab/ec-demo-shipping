import { Suspense } from "react";
import { ShippingList } from "@/features/shipping";
import { Skeleton } from "@/components/ui/skeleton";

function ShippingListLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function ShipmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">発送一覧</h2>
      </div>

      <Suspense fallback={<ShippingListLoading />}>
        <ShippingList />
      </Suspense>
    </div>
  );
}
