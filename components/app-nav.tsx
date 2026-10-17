"use client";

import { LogoMark } from "@/components/logo-mark";
import { useShell } from "@/components/shell-state";
import { UserMenu } from "@/components/UserMenu";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK } from "@/lib/motion";
import { isActive, NAV_ITEMS as ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

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
      // Only mark as placed once the indicator has a real position; a
      // container hidden at this breakpoint has none, so the first visible
      // placement must snap rather than tween from 0,0.
      mm.add(MOTION_OK, () => {
        place(placed.current);
        if (target()) placed.current = true;
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        place(false);
        if (target()) placed.current = true;
      });

      const ro = new ResizeObserver(() => {
        place(false);
        if (target()) placed.current = true;
      });
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
 * Fixed sidebar from md up (logo, nav, account at the bottom) that collapses to
 * a 56px icon rail, and a bottom tab bar on a phone — bottom-anchored because
 * this is used one-handed while standing at a shelf.
 */
export function AppNav() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useShell();

  const sideRef = useRef<HTMLUListElement>(null);
  const sideIndicator = useRef<HTMLSpanElement>(null);
  const tabRef = useRef<HTMLUListElement>(null);
  const tabIndicator = useRef<HTMLSpanElement>(null);

  useNavIndicator(sideRef, sideIndicator, pathname);
  useNavIndicator(tabRef, tabIndicator, pathname);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden whitespace-nowrap border-r bg-card transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none md:flex",
          collapsed ? "w-14" : "w-60",
        )}
      >
        <Link
          href="/"
          aria-label="MedMinder home"
          className="focus-card mx-2 mt-4 flex h-10 items-center gap-2.5 rounded-md px-1.5"
        >
          <LogoMark className="size-7" />
          <span
            className={cn(
              "font-serif text-2xl font-medium leading-none",
              collapsed && "sr-only",
            )}
          >
            MedMinder
          </span>
        </Link>

        <nav aria-label="Main" className="mt-8 flex-1 px-2">
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
                    title={collapsed ? label : undefined}
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
                    <span className={cn("relative", collapsed && "sr-only")}>
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-1 border-t p-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="focus-card flex h-9 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            ) : (
              <PanelLeftClose className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            )}
            <span className={cn(collapsed && "sr-only")}>
              {collapsed ? "Expand sidebar" : "Collapse"}
            </span>
          </button>
          <UserMenu variant="sidebar" collapsed={collapsed} />
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
                    "focus-card relative flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
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
