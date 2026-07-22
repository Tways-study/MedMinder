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
import { usePaginatedQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 30;

export default function MedicinesPage() {
  const {
    results: medicines,
    status,
    loadMore,
  } = usePaginatedQuery(api.medicines.listPaged, {}, { initialNumItems: PAGE_SIZE });
  const [search, setSearch] = useState("");
  const now = Date.now();

  const q = search.trim().toLowerCase();

  // Client-side search only sees the rows already loaded, so while a search is
  // active keep pulling pages until the whole shelf is in hand. At normal
  // inventory sizes this is one page or none; it only does real work for the
  // rare huge shelf, which is exactly when we want search to stay complete.
  useEffect(() => {
    if (q && status === "CanLoadMore") loadMore(PAGE_SIZE);
  }, [q, status, loadMore]);

  const loadingFirstPage = status === "LoadingFirstPage";

  const filtered = useMemo(() => {
    if (!q) return medicines;
    // Brand and generic are both searched: she may know either.
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q),
    );
  }, [medicines, q]);

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

      {medicines.length > 0 && (
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or generic"
          aria-label="Search medicines"
          className="h-11"
        />
      )}

      {loadingFirstPage && <CardSkeleton />}

      {!loadingFirstPage && medicines.length === 0 && (
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

      {!loadingFirstPage && filtered.length === 0 && medicines.length > 0 && (
        <EmptyState
          title="Nothing matches that"
          body={`No medicine matches "${search.trim()}". Check the spelling, or try the generic name.`}
        />
      )}

      {filtered.length > 0 && (
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

      {/* Manual paging for plain browsing; while searching we auto-load above. */}
      {!q && status === "CanLoadMore" && (
        <Button
          variant="outline"
          className="mt-1 self-center"
          onClick={() => loadMore(PAGE_SIZE)}
        >
          Load more
        </Button>
      )}

      {status === "LoadingMore" && (
        <p className="mt-1 text-center text-sm text-muted-foreground">Loading…</p>
      )}
    </Page>
  );
}
