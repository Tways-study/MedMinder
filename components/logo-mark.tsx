import { cn } from "@/lib/utils";

/**
 * The brand tile: the Lucide Pill on gentian violet, matching app/icon.svg.
 * Decorative: every placement sits beside the "MedMinder" wordmark or a
 * heading that names the product, so it is hidden from assistive tech.
 */
export function LogoMark({
  className,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("shrink-0 rounded-md", className)}
    >
      <rect width="32" height="32" rx="7" fill="#6D4AA8" />
      <g
        transform="translate(5 5) scale(0.9167)"
        fill="none"
        stroke="#fff"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </g>
    </svg>
  );
}
