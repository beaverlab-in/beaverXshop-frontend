import { Suspense } from "react";
import ProductForm from "@/components/admin/pages/ProductForm";
import { Skeleton } from "@/components/ui/States";

async function Content({ params }) {
  const { id } = await params;
  return <ProductForm id={id} />;
}

export default function EditProductPage({ params }) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content params={params} />
    </Suspense>
  );
}
