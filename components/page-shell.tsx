import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 pt-2", className)}>
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    // iOS large title: the page names itself in the biggest type on screen.
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-large-title font-semibold">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-body text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** An empty screen is an invitation to act, so it always carries the next step. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-card px-6 py-12 text-center">
      <p className="font-display text-subheading font-semibold">{title}</p>
      <p className="max-w-[42ch] text-body text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

/** Matches the shape of what's loading rather than spinning in the abstract. */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-lg bg-card" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 border-border px-4 py-4 [&:not(:first-child)]:border-t"
        >
          <div className="flex flex-col gap-2">
            <div className="h-4 w-40 animate-pulse rounded-full bg-pebble" />
            <div className="h-3 w-24 animate-pulse rounded-full bg-pebble/70" />
          </div>
          <div className="h-5 w-10 animate-pulse rounded-full bg-pebble" />
        </div>
      ))}
    </div>
  );
}
