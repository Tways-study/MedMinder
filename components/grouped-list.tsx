import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

/*
  The iOS grouped list: one white rounded block per group on the frost canvas,
  rows split by hairlines that start after the leading padding (inset), so the
  group reads as one object rather than a stack of separate cards.
*/
export function GroupedList({
  title,
  count,
  description,
  footer,
  children,
  className,
}: {
  title?: ReactNode;
  /** Shown beside the title in tabular figures. */
  count?: number;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      {(title || description) && (
        <div className="px-1">
          {title && (
            <h2 className="font-display text-subheading font-semibold">
              {title}
              {count !== undefined && (
                <span
                  className="font-data ml-2 text-body font-normal text-muted-foreground"
                  aria-label={`${count} ${count === 1 ? "medicine" : "medicines"}`}
                >
                  {count}
                </span>
              )}
            </h2>
          )}
          {description && (
            <p className="mt-0.5 text-body-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <ul className="overflow-hidden rounded-lg bg-card">{children}</ul>
      {footer && (
        <p className="px-1 text-footnote text-muted-foreground">{footer}</p>
      )}
    </section>
  );
}

/*
  Inset hairline via a pseudo-element on every row after the first. The tap
  highlight lands on pointer-down (`active:`) with no transition delay — the
  row answers the finger, not the release.
*/
const ROW =
  "relative block before:absolute before:inset-x-0 before:left-4 before:top-0 before:h-px before:bg-border [&:first-child]:before:hidden";

const ROW_BODY = "flex min-h-11 items-start justify-between gap-4 px-4 py-3.5";

export function GroupedListRow({
  href,
  bare = false,
  children,
  className,
}: {
  href?: string;
  /** Render children as-is, for rows that lay themselves out (e.g. MedicineCard). */
  bare?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li className={cn(ROW, bare && className)}>
      {bare ? (
        children
      ) : href ? (
        <Link
          href={href}
          className={cn(ROW_BODY, "focus-card active:bg-pebble/60", className)}
        >
          {children}
        </Link>
      ) : (
        <div className={cn(ROW_BODY, className)}>{children}</div>
      )}
    </li>
  );
}
