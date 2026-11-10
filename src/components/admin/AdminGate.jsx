"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { LockIcon } from "@/components/ui/Icons";
import { useAuth } from "@/providers/AuthProvider";
import { IS_DEMO } from "@/lib/env";

function Notice({ title, children, action }) {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-4">
      <div className="rounded-card border border-line bg-surface p-8 text-center shadow-card">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-subtle text-brand">
          <LockIcon className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <div className="mt-2 text-muted">{children}</div>
        {action}
      </div>
    </div>
  );
}

/**
 * Admin access is a role on the same mobile + OTP account. This gate is a convenience (it avoids showing an
 * empty panel): the backend independently refuses every admin request from an account without the right role.
 */
export default function AdminGate({ children }) {
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!IS_DEMO && status === "guest") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (IS_DEMO) {
    return (
      <Notice title="The admin panel needs the live API">
        <p>
          The storefront is running on built-in sample data. Set <code className="rounded bg-subtle px-1">NEXT_PUBLIC_DATA_SOURCE=api</code> and point <code className="rounded bg-subtle px-1">NEXT_PUBLIC_API_URL</code> at the backend to use the admin panel.
        </p>
      </Notice>
    );
  }
  if (status !== "authed") {
    return (
      <div className="p-8" aria-busy="true" aria-label="Loading">
        <Skeleton className="mx-auto h-64 max-w-3xl" />
      </div>
    );
  }
  if (!user?.role) {
    return (
      <Notice
        title="This area is for store staff"
        action={
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/">Back to the store</Button>
            <Button variant="secondary" onClick={() => signOut().then(() => router.replace("/login?next=/admin"))}>
              Use a different number
            </Button>
          </div>
        }
      >
        <p>
          Your account isn&apos;t set up for admin access. Ask a super admin to add your mobile number in <strong>Team</strong>. <Link href="/account" className="font-semibold text-brand underline underline-offset-4">My account</Link>
        </p>
      </Notice>
    );
  }
  return children;
}
