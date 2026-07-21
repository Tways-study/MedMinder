import type { ExpiryTier } from "@/convex/lib/inventory";
import { cn } from "@/lib/utils";
import {
  CheckCircledIcon,
  ClockIcon,
  CrossCircledIcon,
  EyeOpenIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";

/*
  This drives decisions about medicine, so tier is never carried by colour
  alone. Each badge is icon + word + colour, and stays legible in greyscale,
  under colour-blindness, and on a sun-washed phone at the counter.
*/
const TIERS: Record<
  ExpiryTier,
  { label: string; icon: typeof ClockIcon; className: string }
> = {
  expired: {
    label: "Expired",
    icon: CrossCircledIcon,
    className: "bg-tier-expired-bg text-tier-expired border border-tier-expired/30 font-medium",
  },
  critical: {
    label: "Critical",
    icon: ExclamationTriangleIcon,
    className: "bg-tier-critical-bg text-tier-critical border border-tier-critical/30 font-medium",
  },
  warning: {
    label: "Soon",
    icon: ClockIcon,
    className: "bg-tier-warning-bg text-tier-warning border border-tier-warning/30 font-medium",
  },
  watch: {
    label: "Watch",
    icon: EyeOpenIcon,
    className: "bg-tier-watch-bg text-tier-watch border border-tier-watch/30 font-medium",
  },
  ok: {
    label: "In date",
    icon: CheckCircledIcon,
    className: "bg-tier-ok-bg text-tier-ok border border-tier-ok/30 font-medium",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs tracking-tight shadow-2xs",
        tierClass,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {children ?? label}
    </span>
  );
}

export function tierLabel(tier: ExpiryTier): string {
  return TIERS[tier].label;
}
