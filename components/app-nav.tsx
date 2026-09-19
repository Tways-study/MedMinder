"use client";

import { SPRING } from "@/components/motion";
import { cn } from "@/lib/utils";
import {
  ArchiveIcon,
  CalendarIcon,
  DashboardIcon,
  GearIcon,
} from "@radix-ui/react-icons";
import { motion } from "framer-motion";
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
        // A translucent material, not an opaque strip: the list scrolls
        // under it and stays faintly visible (solid under reduced transparency).
        "material fixed inset-x-0 bottom-0 z-40 border-t border-border/70",
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
                  "focus-card relative flex h-14 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                  "sm:h-11 sm:flex-row sm:justify-start sm:gap-3 sm:rounded-lg sm:px-3 sm:text-body-sm",
                  // Selected state is the one place the accent appears in
                  // chrome; orchid holds 5.5:1 even on the lilac highlight.
                  active
                    ? "text-link"
                    : "text-muted-foreground hover:text-foreground active:bg-pebble/40",
                )}
              >
                {/*
                  One highlight that glides to the new page rather than
                  blinking off and on, so the rail shows where you moved from.
                  Desktop only: a phone tab bar marks the active tab by colour.
                */}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={SPRING}
                    aria-hidden
                    className="absolute inset-0 hidden rounded-lg bg-pebble/60 sm:block"
                  />
                )}
                <Icon className="relative h-5 w-5 shrink-0" aria-hidden />
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
