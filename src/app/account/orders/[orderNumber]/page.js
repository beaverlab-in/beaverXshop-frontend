import { Suspense } from "react";
import OrderDetail from "@/components/account/OrderDetail";
import { Skeleton } from "@/components/ui/States";

async function OrderContent({ params }) {
  const { orderNumber } = await params;
  return <OrderDetail orderNumber={orderNumber} />;
}

export default function OrderPage({ params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <OrderContent params={params} />
    </Suspense>
  );
}
