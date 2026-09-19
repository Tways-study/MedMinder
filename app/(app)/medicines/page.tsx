"use client";

import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { TierBadge, tierStyle } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { GroupedList, GroupedListRow } from "@/components/grouped-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/convex/_generated/api";
import { DEFAULT_ALERT_TIERS, expiryTier } from "@/convex/lib/inventory";
import {
  type ExpiryStatus,
  type MedicineFilter,
  type MedicineSort,
  filterMedicines,
  isFiltering,
  isLowStock,
  sortMedicines,
} from "@/convex/lib/medicineFilters";
import { parseSearch } from "@/convex/lib/search";
import { formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { usePaginatedQuery, useQuery } from "convex/react";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useState } from "react";

const PAGE_SIZE = 30;

const STATUS_CHIPS: ExpiryStatus[] = [
  "expired",
  "critical",
  "warning",
  "watch",
  "ok",
  "none",
];

const SORT_LABELS: Record<MedicineSort, string> = {
  expiry: "Soonest expiry",
  name: "Name",
  stock: "Lowest stock",
};

// Written out in full so Tailwind can see them; they mirror TierBadge's fills.
const CHIP_ON: Record<Exclude<ExpiryStatus, "none">, string> = {
  expired:
    "data-[state=on]:bg-tier-expired-bg data-[state=on]:text-tier-expired",
  critical:
    "data-[state=on]:bg-tier-critical-bg data-[state=on]:text-tier-critical",
  warning:
    "data-[state=on]:bg-tier-warning-bg data-[state=on]:text-tier-warning",
  watch: "data-[state=on]:bg-tier-watch-bg data-[state=on]:text-tier-watch",
  ok: "data-[state=on]:bg-tier-ok-bg data-[state=on]:text-tier-ok",
};

const NO_FILTER: MedicineFilter = { statuses: [], lowStockOnly: false };

// Shared by every chip so status and low-stock toggles read as one control row.
const CHIP =
  "h-9 gap-1.5 rounded-full border border-border bg-card px-3 text-footnote font-medium text-foreground hover:bg-card data-[state=on]:border-transparent";

export default function MedicinesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MedicineFilter>(NO_FILTER);
  const [sort, setSort] = useState<MedicineSort>("expiry");

  // Status words typed into the search bar ("critical amox") filter just like
  // the chips; whatever text is left searches names.
  const parsed = parseSearch(search);
  const needle = parsed.text;
  const isSearching = needle !== null;
  const typedFilter: MedicineFilter = {
    statuses: parsed.statuses,
    lowStockOnly: parsed.lowStock,
  };
  const typedStatus = isFiltering(typedFilter);
  const filtering = isFiltering(filter);
  // Name order without filters is the index order, so it can page; anything
  // else needs the whole shelf in hand to filter or order it.
  const usePaging =
    !isSearching && !filtering && !typedStatus && sort === "name";

  const {
    results: browseResults,
    status,
    loadMore,
  } = usePaginatedQuery(api.medicines.listPaged, usePaging ? {} : "skip", {
    initialNumItems: PAGE_SIZE,
  });
  const allMedicines = useQuery(
    api.medicines.list,
    !isSearching && !usePaging ? {} : "skip",
  );
  const searchResults = useQuery(
    api.medicines.searchByName,
    needle ? { q: needle } : "skip",
  );
  const settings = useQuery(api.settings.get);
  const tiers = settings?.alertTiers ?? DEFAULT_ALERT_TIERS;
  const now = Date.now();

  // Hold the previous matches while the next keystroke's query loads, so the
  // list narrows in place instead of flashing back to a skeleton.
  const [lastResults, setLastResults] = useState(searchResults);
  if (searchResults !== undefined && searchResults !== lastResults) {
    setLastResults(searchResults);
  }
  const shownResults = searchResults ?? lastResults;

  // Search keeps its best-match order; filters still narrow it.
  const source = isSearching
    ? shownResults
    : usePaging
      ? browseResults
      : allMedicines;
  const filtered =
    source === undefined
      ? []
      : filterMedicines(
          filterMedicines(source, filter, now, tiers),
          typedFilter,
          now,
          tiers,
        );
  const displayedMedicines = isSearching
    ? filtered
    : sortMedicines(filtered, sort);

  const isLoading = usePaging
    ? status === "LoadingFirstPage"
    : source === undefined;
  const shelfIsEmpty =
    !isSearching &&
    !filtering &&
    !typedStatus &&
    !isLoading &&
    (source?.length ?? 0) === 0;
  const trimmed = search.trim();

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

      {!shelfIsEmpty && (
        <div className="flex flex-col gap-3">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, or type expired, critical, low stock…"
            aria-label="Search medicines by name or status"
          />

          {typedStatus && (
            <div
              aria-live="polite"
              className="flex flex-wrap items-center gap-1.5 text-body-sm text-muted-foreground"
            >
              <span>Only showing</span>
              {parsed.statuses.map((s) =>
                s === "none" ? (
                  <PlainBadge key={s}>No expiry</PlainBadge>
                ) : (
                  <TierBadge key={s} tier={s} />
                ),
              )}
              {parsed.lowStock && <PlainBadge>Low stock</PlainBadge>}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <ToggleGroup
              type="multiple"
              aria-label="Filter by expiry"
              value={filter.statuses}
              onValueChange={(statuses) =>
                setFilter((f) => ({
                  ...f,
                  statuses: statuses as ExpiryStatus[],
                }))
              }
              className="flex-wrap justify-start gap-1.5"
            >
              {STATUS_CHIPS.map((s) => (
                <StatusChip key={s} status={s} />
              ))}
            </ToggleGroup>

            <span aria-hidden className="mx-1 h-5 w-px bg-border" />

            <Toggle
              aria-label="Only low stock"
              pressed={filter.lowStockOnly}
              onPressedChange={(lowStockOnly) =>
                setFilter((f) => ({ ...f, lowStockOnly }))
              }
              className={cn(
                CHIP,
                "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
              )}
            >
              Low stock
            </Toggle>
          </div>

          <div className="flex min-h-9 items-center justify-between gap-3 text-body-sm text-muted-foreground">
            {isSearching ? (
              <span>Best match first</span>
            ) : (
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as MedicineSort)}
              >
                <SelectTrigger
                  aria-label="Sort medicines"
                  className="h-9 w-auto gap-2 rounded-full border-none bg-transparent px-0 text-body-sm focus-visible:ring-2"
                >
                  <span>Sort by</span>
                  <span className="font-medium text-foreground">
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABELS) as MedicineSort[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {SORT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {trimmed.length === 1 ? (
              <span>Type one more letter to search</span>
            ) : (
              filtering && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter(NO_FILTER)}
                >
                  Clear filters
                </Button>
              )
            )}
          </div>
        </div>
      )}

      {isLoading && <CardSkeleton />}

      {shelfIsEmpty && (
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

      {!isLoading &&
        !shelfIsEmpty &&
        displayedMedicines.length === 0 &&
        (isSearching ? (
          <EmptyState
            title="Nothing matches that"
            body={
              filtering || typedStatus
                ? `No medicine with that status matches "${needle}". Clear the filters or status words to search the whole shelf.`
                : `No medicine matches "${trimmed}". Check the spelling, or try the generic name.`
            }
          />
        ) : (
          <EmptyState
            title="Nothing in these filters"
            body="No medicine on the shelf has this status right now."
            action={
              <Button
                variant="outline"
                className="mt-1"
                onClick={() => {
                  setFilter(NO_FILTER);
                  setSearch("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ))}

      {displayedMedicines.length > 0 && (
        <GroupedList>
          {displayedMedicines.map((m) => {
            const low = isLowStock(m);
            const tier =
              m.expiryDate === undefined
                ? null
                : expiryTier(m.expiryDate, now, tiers);
            const flagged = (tier && tier !== "ok") || low;

            return (
              <GroupedListRow key={m._id} href={`/medicines/${m._id}`}>
                <div className="min-w-0">
                  <p className="text-body font-semibold">{m.name}</p>
                  <p className="mt-0.5 text-body-sm text-muted-foreground">
                    {[m.strength, m.form].filter(Boolean).join(" · ")}
                    {m.genericName ? ` · ${m.genericName}` : ""}
                  </p>
                  {flagged && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {tier && tier !== "ok" && <TierBadge tier={tier} />}
                      {low && <PlainBadge>Low stock</PlainBadge>}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2 self-center">
                  <div className="text-right">
                    <p className="font-data text-subheading font-semibold">
                      {formatQuantity(m.onHandQuantity)}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      On hand
                    </p>
                  </div>
                  {/* The iOS cue that a row opens something. */}
                  <ChevronRightIcon
                    aria-hidden
                    className="h-4 w-4 text-muted-foreground/70"
                  />
                </div>
              </GroupedListRow>
            );
          })}
        </GroupedList>
      )}

      {usePaging && status === "CanLoadMore" && (
        <Button
          variant="outline"
          className="mt-1 self-center"
          onClick={() => loadMore(PAGE_SIZE)}
        >
          Load more
        </Button>
      )}

      {usePaging && status === "LoadingMore" && (
        <p className="mt-1 text-center text-body-sm text-muted-foreground">
          Loading…
        </p>
      )}
    </Page>
  );
}

function PlainBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-2.5 py-1 text-caption font-medium text-secondary-foreground">
      {children}
    </span>
  );
}

/**
 * Off, a chip is quiet with only its icon in the tier colour; on, it takes the
 * same fill as the TierBadge it filters for, so the list below visibly matches.
 */
function StatusChip({ status }: { status: ExpiryStatus }) {
  if (status === "none") {
    return (
      <ToggleGroupItem
        value="none"
        className={cn(
          CHIP,
          "data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
        )}
      >
        No expiry
      </ToggleGroupItem>
    );
  }

  const { label, icon: Icon, className } = tierStyle(status);
  // The badge's text colour only; the fill belongs to the chip when on.
  const tint = className.split(" ").find((c) => c.startsWith("text-"));
  return (
    <ToggleGroupItem value={status} className={cn(CHIP, CHIP_ON[status])}>
      <Icon aria-hidden className={cn("h-3.5 w-3.5", tint)} />
      {label}
    </ToggleGroupItem>
  );
}
