"use client";

import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { TierBadge } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { DEFAULT_ALERT_TIERS, expiryTier } from "@/convex/lib/inventory";
import { formatQuantity } from "@/lib/format";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function MedicinesPage() {
  const medicines = useQuery(api.medicines.list);
  const [search, setSearch] = useState("");
  const now = Date.now();

  const filtered = useMemo(() => {
    if (!medicines) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    // Brand and generic are both searched: she may know either.
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q),
    );
  }, [medicines, search]);

  return (
    <Page>
      <PageHeader
        title="Medicines"
        subtitle="Everything on the shelf, and what is running low."
        action={
          <Button asChild>
            <Link href="/medicines/new">Add</Link>
          </Button>
        }
      />

      {medicines && medicines.length > 0 && (
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or generic"
          aria-label="Search medicines"
          className="h-11"
        />
      )}

      {filtered === undefined && <CardSkeleton />}

      {filtered && filtered.length === 0 && medicines?.length === 0 && (
        <EmptyState
          title="No medicines yet"
          body="Add the medicines you stock, with their expiry date and quantity."
          action={
            <Button asChild className="mt-1">
              <Link href="/medicines/new">Add the first medicine</Link>
            </Button>
          }
        />
      )}

      {filtered && filtered.length === 0 && (medicines?.length ?? 0) > 0 && (
        <EmptyState
          title="Nothing matches that"
          body={`No medicine matches "${search.trim()}". Check the spelling, or try the generic name.`}
        />
      )}

      {filtered && filtered.length > 0 && (
        <ul className="flex flex-col gap-3">
          {filtered.map((m) => {
            const low = m.onHandQuantity <= m.reorderPoint;
            const tier =
              m.expiryDate === undefined
                ? null
                : expiryTier(m.expiryDate, now, DEFAULT_ALERT_TIERS);

            return (
              <li key={m._id}>
                <Link
                  href={`/medicines/${m._id}`}
                  className="focus-card flex items-start justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-input"
                >
                  <div className="min-w-0">
                    <p className="font-display text-lg font-medium leading-snug">
                      {m.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[m.strength, m.form].filter(Boolean).join(" · ")}
                      {m.genericName ? ` · ${m.genericName}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {tier && tier !== "ok" && <TierBadge tier={tier} />}
                      {low && (
                        <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                          Low stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-data text-xl font-medium leading-none">
                      {formatQuantity(m.onHandQuantity)}
                    </p>
                    <p className="label-field mt-1">On hand</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
