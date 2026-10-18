"use client";

import { useStampIn } from "@/components/motion";
import { statusStyle } from "@/components/status-chip";
import type { ExpiryTier } from "@/convex/lib/inventory";
import { cn } from "@/lib/utils";
import { useRef } from "react";

/**
 * Stable rotation in [-3, +2] degrees (0.5 steps) derived from a string hash.
 * Deterministic, so server and client render the same value.
 */
export function stampRotation(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const steps = (h >>> 0) % 11; // 0..10
  return -3 + steps * 0.5;
}

/*
  A rubber-stamp status mark: double border (outer + inner) in the tier colour,
  uppercase mono, slight stable tilt. Always icon + word + colour, never colour
  alone. Dense tables should keep the flat StatusChip instead.
*/
export function StampBadge({
  tier,
  label,
  size = "md",
  seed,
  animate = false,
  delay = 0,
  className,
}: {
  /** An expiry tier, or "low" for the low-stock stamp. */
  tier: ExpiryTier | "low";
  /** Overrides the default word (rendered uppercase). */
  label?: string;
  size?: "sm" | "md";
  /** Stable rotation seed: use the medicine id or name. */
  seed: string;
  /** Thunk in when scrolled into view (once). */
  animate?: boolean;
  /** Seconds to hold the thunk, to sequence stamps down a list. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useStampIn(ref, { enabled: animate, delay });

  const style = statusStyle(tier);
  const Icon = style.icon;
  const sm = size === "sm";

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex select-none rounded-sm border border-current p-[2px] align-middle",
        style.fg,
        className,
      )}
      style={{ transform: `rotate(${stampRotation(seed)}deg)` }}
    >
      <span
        className={cn(
          "inline-flex items-center rounded-[2px] border border-current font-mono font-bold uppercase tracking-[0.14em]",
          sm ? "gap-1 px-1.5 py-px text-xs" : "gap-1.5 px-2 py-0.5 text-xs",
        )}
      >
        <Icon
          className={cn("shrink-0", sm ? "size-3" : "size-3.5")}
          strokeWidth={2}
          aria-hidden
        />
        {label ?? style.label}
      </span>
    </span>
  );
}
