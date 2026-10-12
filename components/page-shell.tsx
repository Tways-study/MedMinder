"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { type ReactNode, useRef } from "react";

export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  subtitle,
  action,
}: {
  title: ReactNode;
  /** Caps line above the title, e.g. today's date. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** @deprecated use `description` */
  subtitle?: ReactNode;
  /** @deprecated use `actions` */
  action?: ReactNode;
}) {
  const desc = description ?? subtitle;
  const acts = actions ?? action;
  const ref = useRef<HTMLElement>(null);

  // Title rises; eyebrow, description and actions fade. Reduced motion: no-op.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out } });
        tl.from("[data-ph=eyebrow]", { autoAlpha: 0, duration: DUR.base }, 0)
          .from(
            "[data-ph=title]",
            { y: 12, autoAlpha: 0, duration: DUR.enter },
            0.04,
          )
          .from("[data-ph=rest]", { autoAlpha: 0, duration: DUR.base }, 0.14);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <header
      ref={ref}
      className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3"
    >
      <div className="min-w-0">
        {eyebrow && (
          <p data-ph="eyebrow" className="label-caps mb-2">
            {eyebrow}
          </p>
        )}
        <h1
          data-ph="title"
          className="font-serif text-3xl leading-none sm:text-4xl"
        >
          {title}
        </h1>
        {desc && (
          <p data-ph="rest" className="mt-2 text-sm text-muted-foreground">
            {desc}
          </p>
        )}
      </div>
      {acts && (
        <div data-ph="rest" className="flex shrink-0 items-center gap-2">
          {acts}
        </div>
      )}
    </header>
  );
}

/** An empty screen is an invitation to act, so it always carries the next step. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  body,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  /** @deprecated use `description` */
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const desc = description ?? body;
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-1 flex size-11 items-center justify-center rounded-full border border-dashed text-muted-foreground">
        {Icon ? (
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        ) : (
          <span aria-hidden className="font-serif text-2xl leading-none">
            ℞
          </span>
        )}
      </div>
      <p className="font-serif text-2xl leading-tight">{title}</p>
      {desc && (
        <p className="max-w-[42ch] text-sm text-muted-foreground">{desc}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Matches the shape of what's loading rather than spinning in the abstract. */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg border bg-card shadow-xs dark:shadow-none"
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 px-4 py-4 [&:not(:first-child)]:border-t"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24 opacity-70" />
          </div>
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </div>
  );
}
