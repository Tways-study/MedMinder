"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Pill, type LucideIcon } from "lucide-react";
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
  description,
  actions,
  subtitle,
  action,
}: {
  title: ReactNode;
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
        tl.from(
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
        <h1
          data-ph="title"
          className="font-serif text-4xl font-medium leading-[1.05] sm:text-5xl"
        >
          {title}
        </h1>
        {desc && (
          <p data-ph="rest" className="mt-2.5 max-w-[60ch] text-sm text-muted-foreground">
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

/**
  An empty screen is an invitation to act, so it always carries the next step.
  It is drawn as a blank record card: the same header, tear line and ruled
  fields a filled one has, so the user sees what is about to exist.
*/
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
  const ref = useRef<HTMLElement>(null);

  // The one authored moment on a first-run screen: the blank label's ruled
  // lines are drawn in, left to right, as if about to be filled. Clip-path
  // rather than scale, so the dashes keep their size.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-rule]", {
          clipPath: "inset(0 100% 0 0)",
          duration: DUR.enter,
          ease: EASE.out,
          stagger: STAGGER * 2,
          delay: 0.2,
          clearProps: "clipPath",
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      className={cn(
        "overflow-hidden rounded-lg border bg-card shadow-xs",
        className,
      )}
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <span
          aria-hidden
          className="grid size-9 place-items-center rounded-md bg-accent text-accent-foreground"
        >
          {Icon ? (
            <Icon className="size-[18px]" strokeWidth={1.75} />
          ) : (
            <Pill className="size-[18px]" strokeWidth={1.75} />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="font-serif text-2xl font-medium leading-tight">
            {title}
          </h3>
        </div>
      </header>
      <div className="card-divider" aria-hidden />
      <div className="grid gap-6 px-4 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] sm:items-center sm:px-6">
        <div className="flex flex-col items-start gap-4">
          {desc && (
            <p className="max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
              {desc}
            </p>
          )}
          {action}
        </div>
        {/* The blank fields a first entry will fill. */}
        <dl aria-hidden className="hidden grid-cols-2 gap-x-4 gap-y-5 sm:grid">
          {["Name", "Strength", "On hand", "Expires"].map((label) => (
            <div key={label}>
              <dt className="label-caps">{label}</dt>
              <dd data-rule className="mt-2 h-px border-b border-dashed border-input" />
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Matches the shape of what's loading rather than spinning in the abstract. */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg border bg-card shadow-xs"
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
