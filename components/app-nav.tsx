"use client";

import { cn } from "@/lib/utils";
import {
  ArchiveIcon,
  CalendarIcon,
  DashboardIcon,
  GearIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Today", icon: DashboardIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  { href: "/medicines", label: "Medicines", icon: ArchiveIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Bottom bar on a phone, side rail on a desktop.
 *
 * Bottom-anchored because this is used one-handed while standing at a shelf:
 * the thumb reaches the bottom of the screen, not the top.
 */
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur",
        "pb-[env(safe-area-inset-bottom)]",
        "sm:inset-y-0 sm:right-auto sm:w-56 sm:border-r sm:border-t-0 sm:pb-0",
      )}
    >
      <ul className="flex sm:h-full sm:flex-col sm:gap-1 sm:p-3 sm:pt-6">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1 sm:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // 56px tall: a thumb target, not a mouse target.
                  "flex h-14 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                  "sm:h-11 sm:flex-row sm:justify-start sm:gap-3 sm:rounded-sm sm:px-3 sm:text-sm",
                  active
                    ? "text-primary sm:bg-secondary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
