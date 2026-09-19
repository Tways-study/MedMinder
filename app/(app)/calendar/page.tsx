"use client";

import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { GroupedList, GroupedListRow } from "@/components/grouped-list";
import { HoverScale } from "@/components/motion";
import { TierBadge } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { ExpiryTier } from "@/convex/lib/inventory";
import {
  DEFAULT_ALERT_TIERS,
  expiryTier,
  formatExpiryDistance,
} from "@/convex/lib/inventory";
import { formatDate, fromDateInput, toDateInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

type MedicineList = FunctionReturnType<typeof api.medicines.list>;
type DayMedicine = MedicineList[number] & { tier: ExpiryTier };

/*
  A day cell is tinted by the most urgent expiry landing on it. Colour here is
  a scent, not the message — the authoritative per-medicine tier is carried by
  the TierBadge (icon + word + colour) in the selected-day list below the grid.
*/
const TIER_CELL_BG: Record<ExpiryTier, string> = {
  expired: "bg-tier-expired-bg text-tier-expired",
  critical: "bg-tier-critical-bg text-tier-critical",
  warning: "bg-tier-warning-bg text-tier-warning",
  watch: "bg-tier-watch-bg text-tier-watch",
  ok: "bg-tier-ok-bg text-tier-ok",
};

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

  if (medicines === undefined || settings === undefined) {
    return (
      <Page>
        <PageHeader title="Calendar" />
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
        <PageHeader title="Calendar" />
        <EmptyState
          title="No expiry dates yet"
          body="Add expiry dates to your medicines and they'll appear here, laid out across the months ahead."
          action={
            <Button asChild variant="outline" className="mt-1">
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
  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString(
    "en-GB",
    {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    },
  );

  function step(delta: number) {
    setViewMonth(({ year, month }) => {
      const next = new Date(Date.UTC(year, month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  function jumpToToday() {
    const t = todayUtc();
    setViewMonth(t);
    setSelectedKey(todayKey);
  }

  const selectedItems = selectedKey ? (byDay.get(selectedKey) ?? []) : [];
  const selectedSorted = [...selectedItems].sort(
    (a, b) =>
      TIER_RANK[b.tier] - TIER_RANK[a.tier] || a.name.localeCompare(b.name),
  );

  return (
    <Page>
      <PageHeader
        title="Calendar"
        subtitle="When your stock expires, month by month."
        action={
          <Button variant="outline" onClick={jumpToToday}>
            Today
          </Button>
        }
      />

      <div className="rounded-lg bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="focus-card flex h-11 w-11 items-center justify-center rounded-full text-link transition-[transform,background-color] duration-100 hover:bg-pebble/60 active:scale-95 active:bg-pebble motion-reduce:active:scale-100"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="font-display text-subheading font-semibold">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="focus-card flex h-11 w-11 items-center justify-center rounded-full text-link transition-[transform,background-color] duration-100 hover:bg-pebble/60 active:scale-95 active:bg-pebble motion-reduce:active:scale-100"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="label-field pb-1 text-center">
              {d}
            </div>
          ))}

          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`blank-${i}`} aria-hidden />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = toDateInput(Date.UTC(year, month, day));
            const items = byDay.get(key);
            const tint = items ? TIER_CELL_BG[mostUrgent(items)] : null;
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;

            return (
              <HoverScale
                key={key}
                scale={1.012}
                tapScale={0.97}
                className="relative hover:z-10"
              >
                <button
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  aria-label={`${formatDate(Date.UTC(year, month, day))}${
                    items ? `, ${items.length} expiring` : ""
                  }`}
                  aria-pressed={isSelected}
                  className={cn(
                    "focus-card flex h-full min-h-11 w-full flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-body-sm transition-colors active:bg-pebble",
                    tint ?? "hover:bg-frost",
                    isSelected && "ring-2 ring-ring",
                  )}
                >
                  <span
                    className={cn(
                      "font-data leading-none",
                      isToday && "font-semibold text-link",
                    )}
                  >
                    {day}
                  </span>
                  {items && (
                    <span className="font-data text-[0.625rem] font-medium leading-none">
                      {items.length}
                    </span>
                  )}
                </button>
              </HoverScale>
            );
          })}
        </div>
      </div>

      {selectedKey &&
        (selectedSorted.length === 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="px-1 font-display text-subheading font-semibold">
              {formatDate(fromDateInput(selectedKey))}
            </h3>
            <p className="px-1 text-body-sm text-muted-foreground">
              Nothing expires on this day.
            </p>
          </section>
        ) : (
          <GroupedList title={formatDate(fromDateInput(selectedKey))}>
            {selectedSorted.map((m) => (
              <GroupedListRow key={m._id} href={`/medicines/${m._id}`}>
                <div className="min-w-0">
                  <p className="text-body font-semibold">{m.name}</p>
                  {(m.strength || m.form) && (
                    <p className="mt-0.5 text-body-sm text-muted-foreground">
                      {[m.strength, m.form].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-body-sm text-muted-foreground">
                    {formatExpiryDistance(m.expiryDate as number, now)}
                  </p>
                </div>
                <TierBadge tier={m.tier} className="shrink-0 self-center" />
              </GroupedListRow>
            ))}
          </GroupedList>
        ))}
    </Page>
  );
}
