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
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { ExpiryTier } from "@/convex/lib/inventory";
import { formatExpiryDistance } from "@/convex/lib/inventory";
import { formatDate, formatQuantity } from "@/lib/format";
import { useQuery } from "convex/react";
import { Cross2Icon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useState } from "react";

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
  const [search, setSearch] = useState("");

  if (summary === undefined) {
    return (
      <Page>
        <PageHeader title="Today" />
        <CardSkeleton count={3} />
      </Page>
    );
  }

  const { alerts, lowStock, totals, hasDraftCount } = summary;
  const nothingStocked = totals.medicines === 0;

  const q = search.trim().toLowerCase();
  // Matches on name or lot number: at the shelf, a lot number is often the
  // thing in hand, not the brand name.
  const filteredAlerts = q
    ? alerts.filter(
        (a) =>
          a.medicineName.toLowerCase().includes(q) ||
          a.lotNumber.toLowerCase().includes(q),
      )
    : alerts;
  const filteredLowStock = q
    ? lowStock.filter((m) => m.name.toLowerCase().includes(q))
    : lowStock;

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    lots: filteredAlerts.filter((a) => a.tier === tier),
  })).filter((g) => g.lots.length > 0);

  const searching = q.length > 0;
  const noMatches =
    searching && grouped.length === 0 && filteredLowStock.length === 0;

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

      {!nothingStocked && (
        <div className="relative">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by medicine or lot number"
            aria-label="Search medicines"
            className="h-11 pr-11 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <Cross2Icon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

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

      {hasDraftCount && !searching && (
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

      {!nothingStocked && !searching && alerts.length === 0 && (
        <EmptyState
          title="Nothing expiring soon"
          body="No lot on the shelf expires within six months. This is the screen you want to be boring."
        />
      )}

      {noMatches && (
        <EmptyState
          title="Nothing matches that"
          body={`No medicine name or lot number matches "${search.trim()}". Check the spelling and try again.`}
        />
      )}

      {grouped.map(({ tier, lots }) => (
        <section key={tier} className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-medium">
              {tierLabel(tier)}
              <span
                className="ml-2 font-data text-sm font-normal text-muted-foreground"
                aria-label={`${lots.length} ${lots.length === 1 ? "lot" : "lots"}`}
                title={`${lots.length} ${lots.length === 1 ? "lot" : "lots"} in this tier`}
              >
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

      {filteredLowStock.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-medium">
              Running low
              <span
                className="ml-2 font-data text-sm font-normal text-muted-foreground"
                aria-label={`${filteredLowStock.length} ${filteredLowStock.length === 1 ? "medicine" : "medicines"}`}
                title={`${filteredLowStock.length} ${filteredLowStock.length === 1 ? "medicine" : "medicines"} at or below reorder point`}
              >
                {filteredLowStock.length}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">
              At or below the reorder point you set.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {filteredLowStock.map((m) => (
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
                  <p
                    className="font-data shrink-0 whitespace-nowrap text-sm"
                    title={`${formatQuantity(m.totalQuantity)} on hand, reorder point ${formatQuantity(m.reorderPoint)}`}
                  >
                    <span
                      className="font-medium"
                      aria-label={`${formatQuantity(m.totalQuantity)} on hand`}
                    >
                      {formatQuantity(m.totalQuantity)}
                    </span>
                    <span
                      className="text-muted-foreground"
                      aria-label={`, reorder point ${formatQuantity(m.reorderPoint)}`}
                    >
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
