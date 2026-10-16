import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
  A pharmacy-label card: ℞ + caps title, a perforated tear line, then a grid of
  LabelFields. Built on the card tokens, so it follows the theme tokens. The root
  carries `data-stamp-card` so a StampBadge inside can shake it on impact.
*/
export function RxLabel({
  title,
  eyebrow,
  right,
  density = "card",
  footer,
  className,
  bodyClassName,
  children,
}: {
  /** The record's name, set in the display serif. */
  title: ReactNode;
  /** Small plain line above the title (e.g. dosage form). */
  eyebrow?: ReactNode;
  /** Right slot of the header strip (stamp, count, actions). */
  right?: ReactNode;
  density?: "card" | "row";
  /** Mono note under the body. */
  footer?: ReactNode;
  className?: string;
  /** Extra classes for the LabelField grid (override columns). */
  bodyClassName?: string;
  /** LabelFields. */
  children?: ReactNode;
}) {
  const row = density === "row";
  return (
    <section
      data-stamp-card
      data-density={density}
      className={cn(
        "group/rx rounded-lg border bg-card text-card-foreground shadow-xs",
        className,
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3",
          row ? "px-3 py-2" : "px-4 py-3",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              "shrink-0 font-serif leading-none text-primary",
              row ? "text-xl" : "text-2xl",
            )}
          >
            ℞
          </span>
          <div className="min-w-0">
            {eyebrow && (
              <p className="truncate text-xs text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h3
              className={cn(
                "truncate font-serif font-medium leading-tight",
                row ? "text-lg" : "text-2xl",
              )}
            >
              {title}
            </h3>
          </div>
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </header>
      <div className="perforation" aria-hidden />
      {children && (
        <dl
          className={cn(
            "grid grid-cols-2 sm:grid-cols-4",
            row ? "gap-x-3 gap-y-2 px-3 py-2" : "gap-x-4 gap-y-3 px-4 py-3",
            bodyClassName,
          )}
        >
          {children}
        </dl>
      )}
      {footer && (
        <p
          className={cn(
            "text-xs text-muted-foreground",
            row ? "px-3 pb-2" : "px-4 pb-3",
          )}
        >
          {footer}
        </p>
      )}
    </section>
  );
}

export function LabelField({
  label,
  value,
  mono = true,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  /** Mono tabular value (default). Turn off for prose values. */
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="label-caps">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 text-sm group-data-[density=row]/rx:text-xs",
          mono && "font-data",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
