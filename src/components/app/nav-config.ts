export const APP_NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "dashboard", shortLabel: "Home" },
  { key: "ponds", label: "Ponds", href: "/ponds", icon: "pond", shortLabel: "Ponds" },
  { key: "batches", label: "Fish Batches", href: "/batches", icon: "batch", shortLabel: "Batches" },
  { key: "feedings", label: "Today's Feedings", href: "/feedings", icon: "feed", shortLabel: "Feeding" },
  { key: "inventory", label: "Feed Inventory", href: "/inventory", icon: "inventory", shortLabel: "Inventory" },
  { key: "harvest", label: "Harvest", href: "/harvest", icon: "harvest", shortLabel: "Harvest" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports", shortLabel: "Reports" },
  { key: "vendor", label: "Vendor Deliveries", href: "#", icon: "delivery", shortLabel: "Vendors" },
  { key: "ai", label: "AI Assistant", href: "#", icon: "ai", shortLabel: "AI" },
  { key: "settings", label: "Settings", href: "/settings", icon: "settings", shortLabel: "Settings" },
] as const;

export type AppNavKey = (typeof APP_NAV_ITEMS)[number]["key"];
export type AppNavIconType = (typeof APP_NAV_ITEMS)[number]["icon"] | "water";

export const MOBILE_NAV_KEYS: AppNavKey[] = [
  "dashboard",
  "ponds",
  "feedings",
  "harvest",
  "inventory",
  "reports",
  "settings",
];

export function getNavItem(key: AppNavKey) {
  return APP_NAV_ITEMS.find((item) => item.key === key);
}
