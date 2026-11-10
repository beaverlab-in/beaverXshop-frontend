"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Layout";
import { ArrowRightIcon, MapPinIcon, PackageIcon, UserIcon } from "@/components/ui/Icons";
import { useAuth } from "@/providers/AuthProvider";
import { formatMobile } from "@/lib/validation";

const tiles = [
  { href: "/account/orders", title: "My orders", text: "Track orders and download invoices.", icon: PackageIcon },
  { href: "/account/addresses", title: "Saved addresses", text: "Manage where we deliver.", icon: MapPinIcon },
  { href: "/account/settings", title: "Account settings", text: "Update your name and email.", icon: UserIcon },
];

export default function Overview() {
  const { user } = useAuth();
  return (
    <div>
      <p className="eyebrow">My account</p>
      <h1 className="mt-1 text-3xl font-bold">{user?.name ? `Hello, ${user.name.split(" ")[0]}` : "Welcome back"}</h1>
      <p className="mt-2 text-muted">Logged in as {formatMobile(user?.mobile)}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {tiles.map(({ href, title, text, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="card-hover group block h-full rounded-card border border-line bg-surface p-6 shadow-card">
              <span className="grid size-11 place-items-center rounded-xl bg-subtle text-brand">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-bold">{title}</h2>
              <p className="mt-1 text-sm text-muted">{text}</p>
              <ArrowRightIcon className="mt-4 size-4 text-brand transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
