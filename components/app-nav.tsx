"use client";

import { LogoMark } from "@/components/logo-mark";
import { UserMenu } from "@/components/UserMenu";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CalendarDays, LayoutDashboard, Pill, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

const ITEMS = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/medicines", label: "Medicines", icon: Pill },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Moves one indicator element to the active link inside `containerRef`.
 * The first placement and any resize are instant; route changes tween
 * x/y/size over ~0.3s, or jump under reduced motion.
 */
function useNavIndicator(
  containerRef: React.RefObject<HTMLElement | null>,
  indicatorRef: React.RefObject<HTMLElement | null>,
  pathname: string,
) {
  const placed = useRef(false);

  useGSAP(
    () => {
      const container = containerRef.current;
      const indicator = indicatorRef.current;
      if (!container || !indicator) return;

      const target = () => {
        const link = container.querySelector<HTMLElement>(
          '[aria-current="page"]',
        );
        if (!link) return null;
        const c = container.getBoundingClientRect();
        const l = link.getBoundingClientRect();
        if (l.width === 0) return null; // hidden at this breakpoint
        return {
          x: l.left - c.left,
          y: l.top - c.top,
          width: l.width,
          height: l.height,
        };
      };

      const place = (animate: boolean) => {
        const t = target();
        if (!t) {
          gsap.set(indicator, { autoAlpha: 0 });
          return;
        }
        if (animate) {
          gsap.to(indicator, {
            ...t,
            autoAlpha: 1,
            duration: DUR.base + 0.02,
            ease: EASE.out,
            overwrite: "auto",
          });
        } else {
          gsap.set(indicator, { ...t, autoAlpha: 1 });
        }
      };

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        place(placed.current);
        placed.current = true;
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        place(false);
        placed.current = true;
      });

      const ro = new ResizeObserver(() => place(false));
      ro.observe(container);
      return () => {
        ro.disconnect();
        mm.revert();
      };
    },
    { dependencies: [pathname], scope: containerRef },
  );
}

/**
 * Fixed sidebar from md up (logo, nav, account at the bottom), and a bottom
 * tab bar on a phone — bottom-anchored because this is used one-handed while
 * standing at a shelf.
 */
export function AppNav() {
  const pathname = usePathname();

  const sideRef = useRef<HTMLUListElement>(null);
  const sideIndicator = useRef<HTMLSpanElement>(null);
  const tabRef = useRef<HTMLUListElement>(null);
  const tabIndicator = useRef<HTMLSpanElement>(null);

  useNavIndicator(sideRef, sideIndicator, pathname);
  useNavIndicator(tabRef, tabIndicator, pathname);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-card md:flex">
        <Link
          href="/"
          className="focus-card mx-3 mt-4 flex h-10 items-center gap-2.5 rounded-md px-2"
        >
          <LogoMark className="size-7" />
          <span className="font-serif text-xl leading-none tracking-tight">
            MedMinder
          </span>
          <span
            aria-hidden
            className="ml-auto font-serif text-lg leading-none text-muted-foreground"
          >
            ℞
          </span>
        </Link>

        <nav aria-label="Main" className="mt-6 flex-1 px-3">
          <p className="label-caps mb-2 px-3">Dispensary</p>
          <ul ref={sideRef} className="relative flex flex-col gap-1">
            <span
              ref={sideIndicator}
              aria-hidden
              className="invisible absolute left-0 top-0 rounded-md bg-accent"
            />
            {ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "focus-card relative flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                      active
                        ? "font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon
                      className="relative size-4 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="relative">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t p-3">
          <UserMenu variant="sidebar" />
          <p className="label-caps mt-2 px-2">v1 · ℞</p>
        </div>
      </aside>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul ref={tabRef} className="relative flex">
          <span
            ref={tabIndicator}
            aria-hidden
            className="invisible absolute left-0 top-0 flex justify-center"
          >
            <span className="h-0.5 w-[calc(100%-2rem)] rounded-full bg-primary" />
          </span>
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-card relative flex min-h-14 flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
