"use client";

import { StampBadge } from "@/components/stamp-badge";
import { expiryTier } from "@/convex/lib/inventory";
import { MOTION_OK } from "@/lib/motion";
import { Pill } from "lucide-react";
import { useEffect, useState } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;
const TICK_MS = 5000;
const TICK_START_MS = 4500;
const MAX_TICKS = 4;

/** Sample lots for the sign-in page. `stock: "low"` swaps the expiry stamp. */
const SAMPLE_SHELF = [
  { name: "Amoxicillin 500 mg", meta: "Capsule, 42 on hand", days: 31 },
  {
    name: "Salbutamol inhaler",
    meta: "100 mcg, 3 on hand",
    days: 140,
    stock: "low",
  },
  { name: "Ibuprofen 200 mg", meta: "Tablet, 96 on hand", days: 71 },
  { name: "Loratadine 10 mg", meta: "Tablet, 64 on hand", days: 160 },
  { name: "Paracetamol 500 mg", meta: "Tablet, 380 on hand", days: 412 },
] as const;

/**
 * A decorative sample shelf. Under normal motion the day counts tick down a
 * few times so a lot visibly crosses into the next tier and is re-stamped,
 * which is the product's whole job in one gesture. Under reduced motion it
 * stays at its first state.
 */
export function LandingShelf() {
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    if (!window.matchMedia(MOTION_OK).matches) return;
    let count = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        if (document.hidden) return;
        count += 1;
        setTicks(count);
        if (count >= MAX_TICKS) clearInterval(interval);
      }, TICK_MS);
    }, TICK_START_MS);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      data-below
      aria-hidden
      className="w-full rounded-lg bg-card text-left text-card-foreground shadow-landing"
    >
      <div className="flex items-center gap-2.5 px-4 py-3 sm:px-5">
        <Pill className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
        <p className="font-serif text-xl font-medium leading-none">
          On the shelf
        </p>
      </div>
      <div className="card-divider" />
      <ul className="divide-y divide-dashed">
        {SAMPLE_SHELF.map((row, i) => {
          const days = row.days - ticks;
          const tier = expiryTier(days * DAY_MS, 0);
          const stamp = "stock" in row ? row.stock : tier;
          return (
            <li
              key={row.name}
              data-below
              className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
            >
              <div className="min-w-0">
                <p className="font-serif text-lg font-medium leading-tight">
                  {row.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.meta}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-data w-10 text-right text-sm text-muted-foreground">
                  {days}d
                </span>
                <span className="flex justify-end sm:w-28">
                  <StampBadge
                    key={stamp}
                    tier={stamp}
                    size="sm"
                    seed={row.name}
                    animate
                    className="whitespace-nowrap"
                    delay={ticks === 0 ? 0.7 + i * 0.14 : 0}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Faint tiled pills for the landing canvas. The svg overscans the page by one
 * tile (96px) so the drift in app/signin can loop seamlessly.
 */
export function PillField() {
  return (
    <svg
      data-drift
      aria-hidden
      className="pointer-events-none absolute -inset-24 size-[calc(100%+12rem)] text-primary-foreground/[0.05]"
    >
      <defs>
        <pattern
          id="pill-field"
          width="96"
          height="96"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g transform="translate(14 14) rotate(-30 12 12)">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              <path d="m8.5 8.5 7 7" />
            </g>
            <g transform="translate(60 58) rotate(40 12 12) scale(0.8)">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
              <path d="m8.5 8.5 7 7" />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pill-field)" />
    </svg>
  );
}
