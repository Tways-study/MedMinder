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
    className: "bg-tier-expired-bg text-tier-expired",
  },
  critical: {
    label: "Critical",
    icon: ExclamationTriangleIcon,
    className: "bg-tier-critical-bg text-tier-critical",
  },
  warning: {
    label: "Soon",
    icon: ClockIcon,
    className: "bg-tier-warning-bg text-tier-warning",
  },
  watch: {
    label: "Watch",
    icon: EyeOpenIcon,
    className: "bg-tier-watch-bg text-tier-watch",
  },
  ok: {
    label: "In date",
    icon: CheckCircledIcon,
    className: "bg-tier-ok-bg text-tier-ok",
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
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium",
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
