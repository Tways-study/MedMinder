import type { ExpiryTier } from "@/convex/lib/inventory";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  PackageMinus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type StatusKind = ExpiryTier | "low";

/*
  This drives decisions about medicine, so status is never carried by colour
  alone. Every chip is icon + word + colour (the dot variant keeps the word),
  and stays legible in greyscale, under colour-blindness, and on a sun-washed
  phone at the counter.

  "low" is a stock status, not an expiry tier; it borrows the critical colours.
  Class names are written out literally so Tailwind's JIT can see them.
*/
const STATUS: Record<
  StatusKind,
  {
    label: string;
    icon: LucideIcon;
    fg: string;
    bg: string;
    border: string;
    className: string;
  }
> = {
  expired: {
    label: "Expired",
    icon: XCircle,
    fg: "text-tier-expired",
    bg: "bg-tier-expired-bg",
    border: "border-tier-expired-border",
    className: "bg-tier-expired-bg text-tier-expired border-tier-expired-border",
  },
  critical: {
    label: "Critical",
    icon: AlertTriangle,
    fg: "text-tier-critical",
    bg: "bg-tier-critical-bg",
    border: "border-tier-critical-border",
    className:
      "bg-tier-critical-bg text-tier-critical border-tier-critical-border",
  },
  warning: {
    label: "Soon",
    icon: Clock,
    fg: "text-tier-warning",
    bg: "bg-tier-warning-bg",
    border: "border-tier-warning-border",
    className: "bg-tier-warning-bg text-tier-warning border-tier-warning-border",
  },
  watch: {
    label: "Watch",
    icon: Eye,
    fg: "text-tier-watch",
    bg: "bg-tier-watch-bg",
    border: "border-tier-watch-border",
    className: "bg-tier-watch-bg text-tier-watch border-tier-watch-border",
  },
  ok: {
    label: "In date",
    icon: CheckCircle2,
    fg: "text-tier-ok",
    bg: "bg-tier-ok-bg",
    border: "border-tier-ok-border",
    className: "bg-tier-ok-bg text-tier-ok border-tier-ok-border",
  },
  low: {
    label: "Low stock",
    icon: PackageMinus,
    fg: "text-tier-critical",
    bg: "bg-tier-critical-bg",
    border: "border-tier-critical-border",
    className:
      "bg-tier-critical-bg text-tier-critical border-tier-critical-border",
  },
};

/** Label, icon and fg / bg / border / combined classes for a status. */
export function statusStyle(kind: StatusKind) {
  return STATUS[kind];
}

export function tierLabel(tier: ExpiryTier): string {
  return STATUS[tier].label;
}

export function StatusChip({
  kind,
  variant = "chip",
  children,
  className,
}: {
  kind: StatusKind;
  /** `chip` is the bordered tag; `dot` is the quiet form for dense rows. */
  variant?: "chip" | "dot";
  /** The expiry phrasing, e.g. "expires in 5 months". Falls back to the status word. */
  children?: React.ReactNode;
  className?: string;
}) {
  const { label, icon: Icon, fg, className: tone } = STATUS[kind];

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium",
          fg,
          className,
        )}
      >
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
        {children ?? label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
      {children ?? label}
    </span>
  );
}
