"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

const items = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "My orders" },
  { href: "/account/addresses", label: "Saved addresses" },
  { href: "/account/settings", label: "Account settings" },
];

export default function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const toast = useToast();

  async function onLogout() {
    await signOut();
    toast.info("You've been logged out.");
    router.replace("/");
  }

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28">
      <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-full px-4 font-medium transition-colors lg:rounded-md ${
                  active ? "bg-brand text-white" : "text-ink/80 hover:bg-tint/60 hover:text-brand"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-3 lg:border-t lg:border-line lg:pt-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-11 w-full items-center rounded-full px-4 font-medium text-danger transition-colors hover:bg-danger/10 lg:rounded-md"
          >
            Log out
          </button>
        </li>
      </ul>
    </nav>
  );
}
