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

/*
  This drives decisions about medicine, so tier is never carried by colour
  alone. Each badge is icon + word + colour, and stays legible in greyscale,
  under colour-blindness, and on a sun-washed phone at the counter.

  Class names are written out literally so Tailwind's JIT can see them.
*/
const TIERS: Record<
  ExpiryTier,
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
};

export function TierBadge({
  tier,
  children,
  className,
}: {
  tier: ExpiryTier;
  /** The expiry phrasing, e.g. "expires in 5 months". Falls back to the tier word. */
  children?: React.ReactNode;
  className?: string;
}) {
  const { label, icon: Icon, className: tierClass } = TIERS[tier];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tierClass,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
      {children ?? label}
    </span>
  );
}

export function tierLabel(tier: ExpiryTier): string {
  return TIERS[tier].label;
}

/** The badge's icon, label and combined classes, for controls that need to match it. */
export function tierStyle(tier: ExpiryTier) {
  return TIERS[tier];
}

/** Separate fg / bg / border utility classes for building custom tier-coloured UI. */
export function tierClasses(tier: ExpiryTier): {
  fg: string;
  bg: string;
  border: string;
} {
  const { fg, bg, border } = TIERS[tier];
  return { fg, bg, border };
}

/** Low-stock treatment: critical-tier colours with a package icon (stock, not expiry). */
export const LOW_STOCK_STYLE = {
  label: "Low stock",
  icon: PackageMinus as LucideIcon,
  fg: "text-tier-critical",
  bg: "bg-tier-critical-bg",
  border: "border-tier-critical-border",
  className: "bg-tier-critical-bg text-tier-critical border-tier-critical-border",
};
