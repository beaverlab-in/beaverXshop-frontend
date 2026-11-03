import { Suspense } from "react";
import { CustomerDetail } from "@/components/admin/pages/Customers";
import { Skeleton } from "@/components/ui/States";

async function Content({ params }) {
  const { id } = await params;
  return <CustomerDetail id={id} />;
}

export default function AdminCustomerPage({ params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content params={params} />
    </Suspense>
  );
}
