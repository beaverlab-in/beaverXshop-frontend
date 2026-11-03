import { Suspense } from "react";
import AdminGate from "@/components/admin/AdminGate";
import AdminShell from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/ui/States";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }) {
  return (
    <>
      {/* The admin panel has its own shell: hide the storefront header/footer. Rendered on the server, so there is no flash. */}
      <style>{"[data-site-chrome]{display:none!important}"}</style>
      <Suspense fallback={<Skeleton className="m-8 h-96" />}>
        <AdminGate>
          <AdminShell>
            <Suspense fallback={<Skeleton className="h-96" />}>{children}</Suspense>
          </AdminShell>
        </AdminGate>
      </Suspense>
    </>
  );
}
