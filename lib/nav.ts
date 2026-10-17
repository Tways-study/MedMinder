import { CalendarDays, Package, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** The app's destinations. The sidebar, tab bar and command palette all read this. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inventory", icon: Package },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Inventory's status tabs, in display order. `?view=` carries the choice. */
export const INVENTORY_VIEWS = [
  "all",
  "expired",
  "critical",
  "warning",
  "watch",
  "low",
] as const;
export type InventoryView = (typeof INVENTORY_VIEWS)[number];
