"use client";

import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { TierBadge } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { DEFAULT_ALERT_TIERS, expiryTier } from "@/convex/lib/inventory";
import { formatQuantity } from "@/lib/format";
import { usePaginatedQuery, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";

const PAGE_SIZE = 30;

export default function MedicinesPage() {
  const {
    results: browseResults,
    status,
    loadMore,
  } = usePaginatedQuery(api.medicines.listPaged, {}, { initialNumItems: PAGE_SIZE });

  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const now = Date.now();

  // Server-side search — skipped (returns undefined) when q is empty.
  const searchResults = useQuery(
    api.medicines.searchByName,
    q ? { q } : "skip",
  );

  const isSearching = q.length > 0;
  const displayedMedicines = isSearching ? (searchResults ?? []) : browseResults;
  const isLoadingSearch = isSearching && searchResults === undefined;
  const loadingFirstPage = !isSearching && status === "LoadingFirstPage";

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

      {(browseResults.length > 0 || isSearching) && (
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or generic"
          aria-label="Search medicines"
          className="h-11"
        />
      )}

      {(loadingFirstPage || isLoadingSearch) && <CardSkeleton />}

      {!loadingFirstPage && !isSearching && browseResults.length === 0 && (
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

      {!isLoadingSearch && isSearching && searchResults?.length === 0 && (
        <EmptyState
          title="Nothing matches that"
          body={`No medicine matches "${search.trim()}". Check the spelling, or try the generic name.`}
        />
      )}

      {displayedMedicines.length > 0 && (
        <ul className="flex flex-col gap-3">
          {displayedMedicines.map((m) => {
            const low = m.onHandQuantity <= m.reorderPoint;
            const tier =
              m.expiryDate === undefined
                ? null
                : expiryTier(m.expiryDate, now, DEFAULT_ALERT_TIERS);

            return (
              <li key={m._id}>
                <Card className="overflow-hidden p-0 transition-colors hover:border-input">
                  <Link
                    href={`/medicines/${m._id}`}
                    className="focus-card flex items-start justify-between gap-4 p-4"
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
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {!isSearching && status === "CanLoadMore" && (
        <Button
          variant="outline"
          className="mt-1 self-center"
          onClick={() => loadMore(PAGE_SIZE)}
        >
          Load more
        </Button>
      )}

      {!isSearching && status === "LoadingMore" && (
        <p className="mt-1 text-center text-sm text-muted-foreground">Loading…</p>
      )}
    </Page>
  );
}
