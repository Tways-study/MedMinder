"use client";

import { BatchCard } from "@/components/batch-card";
import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { tierLabel } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { ExpiryTier } from "@/convex/lib/inventory";
import { formatExpiryDistance } from "@/convex/lib/inventory";
import { formatDate, formatQuantity } from "@/lib/format";
import { useQuery } from "convex/react";
import Link from "next/link";

/** Most urgent first. Expired lots are a legal problem, not a planning one. */
const TIER_ORDER: Exclude<ExpiryTier, "ok">[] = [
  "expired",
  "critical",
  "warning",
  "watch",
];

const TIER_BLURB: Record<Exclude<ExpiryTier, "ok">, string> = {
  expired: "Off the shelf today.",
  critical: "Too late to return. Use or write off.",
  warning: "Still returnable to most suppliers.",
  watch: "Time to plan around these.",
};

export default function DashboardPage() {
  const summary = useQuery(api.dashboard.summary);
  const now = Date.now();

  if (summary === undefined) {
    return (
      <Page>
        <PageHeader title="Today" />
        <CardSkeleton count={3} />
      </Page>
    );
  }

  const { alerts, lowStock, totals, hasDraftCount } = summary;
  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    lots: alerts.filter((a) => a.tier === tier),
  })).filter((g) => g.lots.length > 0);

  const nothingStocked = totals.medicines === 0;

  return (
    <Page>
      <PageHeader
        title="Today"
        subtitle={
          nothingStocked
            ? undefined
            : `${formatQuantity(totals.lots)} ${totals.lots === 1 ? "lot" : "lots"} · ${formatQuantity(totals.units)} units`
        }
      />

      {nothingStocked && (
        <EmptyState
          title="Nothing on the shelf yet"
          body="Add the medicines you stock, then log a delivery. Expiry alerts start from the lots that arrive."
          action={
            <Button asChild className="mt-1">
              <Link href="/medicines/new">Add a medicine</Link>
            </Button>
          }
        />
      )}

      {hasDraftCount && (
        <Link
          href="/count"
          className="focus-card rounded-lg border border-primary/40 bg-secondary p-4 transition-colors hover:border-primary"
        >
          <p className="font-medium text-secondary-foreground">
            A count is in progress
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pick it back up, or discard it to start fresh.
          </p>
        </Link>
      )}

      {!nothingStocked && alerts.length === 0 && (
        <EmptyState
          title="Nothing expiring soon"
          body="No lot on the shelf expires within six months. This is the screen you want to be boring."
        />
      )}

      {grouped.map(({ tier, lots }) => (
        <section key={tier} className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-medium">
              {tierLabel(tier)}
              <span className="ml-2 font-data text-sm font-normal text-muted-foreground">
                {lots.length}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">{TIER_BLURB[tier]}</p>
          </div>

          {lots.map((lot) => (
            <Link key={lot.batchId} href={`/medicines/${lot.medicineId}`} className="focus-card block">
              <BatchCard
                medicineName={lot.medicineName}
                strength={lot.strength}
                form={lot.form}
                lotNumber={lot.lotNumber}
                expiryLabel={formatDate(lot.expiryDate)}
                expiryDistance={formatExpiryDistance(lot.expiryDate, now)}
                quantity={lot.quantity}
                tier={lot.tier}
                className="transition-colors hover:border-input"
              />
            </Link>
          ))}
        </section>
      ))}

      {lowStock.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-medium">
              Running low
              <span className="ml-2 font-data text-sm font-normal text-muted-foreground">
                {lowStock.length}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">
              At or below the reorder point you set.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {lowStock.map((m) => (
              <li key={m.medicineId}>
                <Link
                  href={`/medicines/${m.medicineId}`}
                  className="focus-card flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-input"
                >
                  <div className="min-w-0">
                    <p className="font-display text-base font-medium leading-snug">
                      {m.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[m.strength, m.form].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="font-data shrink-0 whitespace-nowrap text-sm">
                    <span className="font-medium">
                      {formatQuantity(m.totalQuantity)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      / {formatQuantity(m.reorderPoint)}
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}
