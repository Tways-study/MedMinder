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
    <main className={cn("mx-auto flex w-full max-w-3xl flex-col gap-6 px-5", className)}>
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
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-medium leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
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
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card/50 px-6 py-12 text-center">
      <p className="font-display text-lg font-medium">{title}</p>
      <p className="max-w-[42ch] text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

/** Matches the shape of what's loading rather than spinning in the abstract. */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg border bg-card" />
      ))}
    </div>
  );
}
