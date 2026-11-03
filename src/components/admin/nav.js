import { BoxesIcon, ChartIcon, DashboardIcon, ListIcon, MessageIcon, ReceiptIcon, SettingsIcon, ShieldIcon, TagIcon, UsersIcon, PackageIcon, BookIcon } from "@/components/ui/Icons";

// The UI only HIDES what a role can't use. The backend enforces every permission on every request.
export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon, permission: "dashboard:read", exact: true },
  { href: "/admin/orders", label: "Orders", icon: ListIcon, permission: "orders:read" },
  { href: "/admin/products", label: "Products", icon: PackageIcon, permission: "products:read" },
  { href: "/admin/categories", label: "Categories", icon: TagIcon, permission: "products:read" },
  { href: "/admin/inventory", label: "Inventory", icon: BoxesIcon, permission: "inventory:read" },
  { href: "/admin/customers", label: "Customers", icon: UsersIcon, permission: "customers:read" },
  { href: "/admin/coupons", label: "Coupons", icon: ReceiptIcon, permission: "coupons:read" },
  { href: "/admin/reports", label: "Reports", icon: ChartIcon, permission: "reports:read" },
  { href: "/admin/notifications", label: "Notifications", icon: MessageIcon, permission: "notifications:manage" },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon, permission: "settings:read" },
  { href: "/admin/team", label: "Team", icon: ShieldIcon, permission: "admins:manage" },
  { href: "/admin/audit-log", label: "Audit log", icon: BookIcon, permission: "audit:read" },
];

export const CRUMBS = {
  admin: "Admin",
  orders: "Orders",
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  customers: "Customers",
  coupons: "Coupons",
  reports: "Reports",
  notifications: "Notifications",
  settings: "Settings",
  team: "Team",
  "audit-log": "Audit log",
  new: "New",
};
