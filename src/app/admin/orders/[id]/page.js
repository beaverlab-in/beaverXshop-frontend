import { Suspense } from "react";
import OrderDetail from "@/components/admin/pages/OrderDetail";
import { Skeleton } from "@/components/ui/States";

async function Content({ params }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}

export default function AdminOrderPage({ params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content params={params} />
    </Suspense>
  );
}
