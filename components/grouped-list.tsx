import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

/*
  A bordered card list: one rounded card per group, rows split by divide-y.
  The header sits inside the card so a group reads as one object.
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
  /** Shown at the end of the header, as "3 medicines". */
  count?: number;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const hasHeader = Boolean(title || description);
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border bg-card shadow-xs",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-col gap-1 border-b px-4 py-3">
          {title && (
            <h2 className="flex items-baseline justify-between gap-3">
              <span className="font-serif text-xl font-medium leading-tight">
                {title}
              </span>
              {count !== undefined && (
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {count} {count === 1 ? "medicine" : "medicines"}
                </span>
              )}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <ul className="divide-y">{children}</ul>
      {footer && (
        <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
          {footer}
        </p>
      )}
    </section>
  );
}

const ROW_BODY = "flex min-h-11 items-start justify-between gap-4 px-4 py-3";

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
    <li className={cn(bare && className)}>
      {bare ? (
        children
      ) : href ? (
        <Link
          href={href}
          className={cn(
            ROW_BODY,
            "focus-card transition-colors duration-100 ease-out hover:bg-muted/50 focus-visible:bg-muted active:bg-muted",
            className,
          )}
        >
          {children}
        </Link>
      ) : (
        <div className={cn(ROW_BODY, className)}>{children}</div>
      )}
    </li>
  );
}
