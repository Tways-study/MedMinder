"use client";

import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { Stagger } from "@/components/motion";
import { TierBadge, tierClasses, tierLabel } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { ExpiryTier } from "@/convex/lib/inventory";
import {
  DEFAULT_ALERT_TIERS,
  expiryTier,
  formatExpiryDistance,
} from "@/convex/lib/inventory";
import { formatDate, formatForm, fromDateInput, toDateInput } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRef, useState } from "react";

type MedicineList = FunctionReturnType<typeof api.medicines.list>;
type DayMedicine = MedicineList[number] & { tier: ExpiryTier };

/*
  A day cell is tinted by the most urgent expiry landing on it. Colour here is
  a scent, not the message: the cell also carries a count and an aria-label
  naming the tier, and the TierBadge in the selected-day list is authoritative.
*/
/** Most urgent wins the cell tint. Mirrors the dashboard's expired-first order. */
const TIER_RANK: Record<ExpiryTier, number> = {
  expired: 4,
  critical: 3,
  warning: 2,
  watch: 1,
  ok: 0,
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** UTC throughout: expiry dates are stored and formatted at UTC midnight. */
function todayUtc() {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

function mostUrgent(items: DayMedicine[]): ExpiryTier {
  return items.reduce<ExpiryTier>(
    (worst, m) => (TIER_RANK[m.tier] > TIER_RANK[worst] ? m.tier : worst),
    "ok",
  );
}

export default function CalendarPage() {
  const medicines = useQuery(api.medicines.list);
  const settings = useQuery(api.settings.get);

  const [viewMonth, setViewMonth] = useState(todayUtc);
  const [selectedKey, setSelectedKey] = useState(() =>
    toDateInput(
      Date.UTC(todayUtc().year, todayUtc().month, new Date().getUTCDate()),
    ),
  );

  // Direction of the last month change (-1 back, 1 forward, 0 none yet).
  const dirRef = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const monthIndex = viewMonth.year * 12 + viewMonth.month;

  // Direction-aware slide + fade of the grid on month change. Reduced motion: instant.
  useGSAP(
    () => {
      const dir = dirRef.current;
      if (dir === 0 || !gridRef.current) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(gridRef.current, {
          x: dir * 24,
          autoAlpha: 0,
          duration: DUR.base,
          ease: EASE.out,
          clearProps: "transform,opacity,visibility",
        });
      });
      return () => mm.revert();
    },
    { dependencies: [monthIndex], scope: gridRef },
  );

  if (medicines === undefined || settings === undefined) {
    return (
      <Page>
        <PageHeader
          title="Calendar"
          description="When your stock expires, month by month."
        />
        <CardSkeleton count={2} />
      </Page>
    );
  }

  const tiers = settings?.alertTiers ?? DEFAULT_ALERT_TIERS;
  const now = Date.now();
  const todayKey = toDateInput(
    Date.UTC(todayUtc().year, todayUtc().month, new Date().getUTCDate()),
  );

  // Bucket every dated medicine onto its UTC calendar day, annotated with tier.
  const byDay = new Map<string, DayMedicine[]>();
  let datedCount = 0;
  for (const m of medicines) {
    if (m.expiryDate === undefined) continue;
    datedCount++;
    const key = toDateInput(m.expiryDate);
    const entry: DayMedicine = {
      ...m,
      tier: expiryTier(m.expiryDate, now, tiers),
    };
    const bucket = byDay.get(key);
    if (bucket) bucket.push(entry);
    else byDay.set(key, [entry]);
  }

  if (datedCount === 0) {
    return (
      <Page>
        <PageHeader
          title="Calendar"
          description="When your stock expires, month by month."
        />
        <EmptyState
          title="No expiry dates yet"
          body="Add expiry dates to your medicines and they'll appear here, laid out across the months ahead."
          action={
            <Button asChild variant="outline">
              <Link href="/medicines">Go to medicines</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  const { year, month } = viewMonth;
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthName = new Date(Date.UTC(year, month, 1)).toLocaleDateString(
    "en-GB",
    { timeZone: "UTC", month: "long" },
  );

  function step(delta: number) {
    dirRef.current = delta;
    setViewMonth(({ year, month }) => {
      const next = new Date(Date.UTC(year, month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  function jumpToToday() {
    const t = todayUtc();
    const target = t.year * 12 + t.month;
    dirRef.current = target === monthIndex ? 0 : target > monthIndex ? 1 : -1;
    setViewMonth(t);
    setSelectedKey(todayKey);
  }

  const selectedItems = selectedKey ? (byDay.get(selectedKey) ?? []) : [];
  const selectedSorted = [...selectedItems].sort(
    (a, b) =>
      TIER_RANK[b.tier] - TIER_RANK[a.tier] || a.name.localeCompare(b.name),
  );

  const daysInPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const trailing = (7 - ((firstWeekday + daysInMonth) % 7)) % 7;
  const selectedLabel = selectedKey
    ? formatDate(fromDateInput(selectedKey))
    : "";

  return (
    <Page>
      <PageHeader
        title="Calendar"
        description="When your stock expires, month by month."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2
              className="flex items-baseline gap-2"
              aria-live="polite"
            >
              <span className="font-serif text-2xl leading-none">
                {monthName}
              </span>
              <span className="font-data text-sm text-muted-foreground">
                {year}
              </span>
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={jumpToToday}>
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => step(-1)}
                aria-label="Previous month"
              >
                <ChevronLeft strokeWidth={1.75} aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => step(1)}
                aria-label="Next month"
              >
                <ChevronRight strokeWidth={1.75} aria-hidden />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="label-caps pb-1 text-center">
                {d}
              </div>
            ))}
          </div>

          <div ref={gridRef} className="grid grid-cols-7 gap-1">

            {Array.from({ length: firstWeekday }).map((_, i) => (
              <OutOfMonthDay
                key={`prev-${i}`}
                day={daysInPrevMonth - firstWeekday + i + 1}
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = toDateInput(Date.UTC(year, month, day));
              const items = byDay.get(key);
              const urgent = items ? mostUrgent(items) : null;
              const style = urgent ? tierClasses(urgent) : null;
              const isSelected = key === selectedKey;
              const isToday = key === todayKey;

              const label = [
                formatDate(Date.UTC(year, month, day)),
                isToday ? "today" : null,
                items && urgent
                  ? `${items.length} ${items.length === 1 ? "medicine" : "medicines"} expiring, most urgent: ${tierLabel(urgent)}`
                  : null,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  aria-label={label}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "relative flex aspect-square min-h-12 w-full flex-col justify-between rounded-md border p-1.5 text-left text-sm transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    style
                      ? cn(style.bg, style.border, style.fg)
                      : "border-transparent hover:bg-muted",
                    isSelected && "ring-2 ring-primary",
                  )}
                >
                  <span
                    className={cn(
                      "font-data leading-none",
                      isToday
                        ? "font-semibold underline decoration-primary decoration-2 underline-offset-4"
                        : "font-medium",
                      !style && "text-foreground",
                    )}
                  >
                    {day}
                  </span>
                  {items && (
                    <span className="flex items-center gap-1 self-end">
                      <span
                        aria-hidden
                        className="size-1.5 rounded-full bg-current"
                      />
                      <span className="font-data rounded-sm bg-card/70 px-1 text-2xs font-semibold leading-4">
                        {items.length}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}

            {Array.from({ length: trailing }).map((_, i) => (
              <OutOfMonthDay key={`next-${i}`} day={i + 1} />
            ))}
          </div>
        </Card>

        {selectedKey && (
          <section
            data-stamp-card
            className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-xs"
          >
            <header className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><CalendarDays className="size-4" strokeWidth={1.75} /></span>
                <div className="min-w-0">
                  <p className="label-caps truncate">{selectedLabel}</p>
                  <h3 className="truncate font-serif text-2xl leading-tight">
                    {selectedSorted.length === 0
                      ? "Nothing due"
                      : `${selectedSorted.length} expiring`}
                  </h3>
                </div>
              </div>
            </header>
            <div className="perforation" aria-hidden />
            {selectedSorted.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Nothing expires on this day.
              </p>
            ) : (
              <Stagger key={selectedKey} className="divide-y">
                {selectedSorted.map((m) => (
                  <Link
                    key={m._id}
                    data-stagger
                    href={`/medicines/${m._id}`}
                    className="focus-card flex min-h-11 items-start justify-between gap-4 px-4 py-3 transition-colors duration-100 ease-out hover:bg-muted/50 focus-visible:bg-muted active:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{m.name}</p>
                      {(m.strength || m.form) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[m.strength, m.form && formatForm(m.form)].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatExpiryDistance(m.expiryDate as number, now)}
                      </p>
                    </div>
                    <TierBadge tier={m.tier} className="shrink-0 self-center" />
                  </Link>
                ))}
              </Stagger>
            )}
          </section>
        )}
      </div>
    </Page>
  );
}

function OutOfMonthDay({ day }: { day: number }) {
  return (
    <div
      aria-hidden
      className="font-data flex aspect-square min-h-12 w-full p-1.5 text-sm text-muted-foreground/50"
    >
      {day}
    </div>
  );
}
