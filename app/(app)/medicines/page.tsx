"use client";

import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { StampBadge } from "@/components/stamp-badge";
import { TierBadge, tierClasses, tierStyle } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Stagger } from "@/components/motion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { formatDate, formatQuantity } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK, STAGGER } from "@/lib/motion";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { usePaginatedQuery, useQuery } from "convex/react";
import {
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Loader2,
  PackageOpen,
  Plus,
  Search,
  SearchX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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

const NO_FILTER: MedicineFilter = { statuses: [], lowStockOnly: false };

// The button is a transparent hit area; the inner span carries the chip look,
// so the tier colours come straight from tierClasses() with no class surgery.
const CHIP_BUTTON =
  "h-8 min-w-0 rounded-md border-0 bg-transparent p-0 hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:shadow-none";
const CHIP_FACE =
  "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-2xs font-medium uppercase tracking-[0.1em] transition-colors";
const CHIP_OFF = "border-border bg-card text-foreground hover:bg-muted";
const CHIP_ON_NEUTRAL = "border-transparent bg-accent text-accent-foreground";

/**
 * Rows rise in on first load and whenever "Load more" or a new filter adds
 * rows. Rows already seen are left alone, so re-sorting never replays it.
 * (Stagger only handles div children, and table rows can't live in a div.)
 */
function useRowStagger(
  ref: React.RefObject<HTMLElement | null>,
  mounted: boolean,
) {
  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const seen = new WeakSet<Element>();
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const run = () => {
          const fresh = Array.from(root.children).filter(
            (c) => c.hasAttribute("data-stagger") && !seen.has(c),
          );
          fresh.forEach((c) => seen.add(c));
          if (!fresh.length) return;
          gsap.fromTo(
            fresh,
            { y: 10, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: DUR.enter,
              ease: EASE.out,
              stagger: STAGGER,
              overwrite: "auto",
              clearProps: "transform,opacity,visibility",
            },
          );
        };
        run();
        const observer = new MutationObserver(run);
        observer.observe(root, { childList: true });
        return () => observer.disconnect();
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [mounted] },
  );
}

export default function MedicinesPage() {
  const router = useRouter();
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
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
  useRowStagger(tbodyRef, isDesktop && displayedMedicines.length > 0);

  return (
    <Page>
      <PageHeader
        eyebrow={
          allMedicines !== undefined && !isSearching
            ? `Inventory · ${allMedicines.length} ${allMedicines.length === 1 ? "item" : "items"}`
            : "Inventory"
        }
        title="Medicines"
        description="Everything on the shelf, and what is running low."
        actions={
          <Button asChild>
            <Link href="/medicines/new">
              <Plus aria-hidden />
              Add medicine
            </Link>
          </Button>
        }
      />

      {!shelfIsEmpty && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, or type expired, critical, low stock…"
              aria-label="Search medicines by name or status"
              className="px-9 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <X aria-hidden />
              </Button>
            )}
          </div>

          {typedStatus && (
            <div
              aria-live="polite"
              className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
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
              className="flex-wrap justify-start gap-1.5 bg-transparent p-0"
            >
              {STATUS_CHIPS.map((s) => (
                <StatusChip
                  key={s}
                  status={s}
                  on={filter.statuses.includes(s)}
                />
              ))}
            </ToggleGroup>

            <span aria-hidden className="mx-1 h-5 w-px bg-border" />

            <Toggle
              aria-label="Only low stock"
              pressed={filter.lowStockOnly}
              onPressedChange={(lowStockOnly) =>
                setFilter((f) => ({ ...f, lowStockOnly }))
              }
              className={CHIP_BUTTON}
            >
              <span
                className={cn(
                  CHIP_FACE,
                  filter.lowStockOnly ? CHIP_ON_NEUTRAL : CHIP_OFF,
                )}
              >
                Low stock
              </span>
            </Toggle>
          </div>

          <div className="flex min-h-9 flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            {isSearching ? (
              <span>Best match first</span>
            ) : (
              <div className="flex items-center gap-2">
                <span id="sort-label" className="text-sm font-medium">
                  Sort
                </span>
                <Select
                  value={sort}
                  onValueChange={(v) => setSort(v as MedicineSort)}
                >
                  <SelectTrigger aria-labelledby="sort-label" className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SORT_LABELS) as MedicineSort[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {SORT_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          icon={PackageOpen}
          title="No medicines yet"
          description="Add the medicines you stock, with their expiry date and quantity."
          action={
            <Button asChild>
              <Link href="/medicines/new">
                <Plus aria-hidden />
                Add the first medicine
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading &&
        !shelfIsEmpty &&
        displayedMedicines.length === 0 &&
        (isSearching ? (
          <EmptyState
            icon={SearchX}
            title="Nothing matches that"
            description={
              filtering || typedStatus
                ? `No medicine with that status matches "${needle}". Clear the filters or status words to search the whole shelf.`
                : `No medicine matches "${trimmed}". Check the spelling, or try the generic name.`
            }
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title="Nothing in these filters"
            description="No medicine on the shelf has this status right now."
            action={
              <Button
                variant="outline"
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
        <>
          {/* Desktop: sortable data table. Only one layout is mounted. */}
          {isDesktop ? (
            <div
              data-lenis-prevent
              className="overflow-hidden rounded-lg border bg-card shadow-xs [&>div]:max-h-[70vh]"
            >
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted [&_th]:bg-muted">
                  <TableRow className="hover:bg-transparent">
                    <SortHead
                      label="Name"
                      sortKey="name"
                      sort={sort}
                      onSort={setSort}
                      disabled={isSearching}
                    />
                    <SortHead
                      label="On hand"
                      sortKey="stock"
                      sort={sort}
                      onSort={setSort}
                      disabled={isSearching}
                      align="right"
                    />
                    <TableHead className="label-caps text-right">
                      Actual
                    </TableHead>
                    <SortHead
                      label="Expiry"
                      sortKey="expiry"
                      sort={sort}
                      onSort={setSort}
                      disabled={isSearching}
                    />
                    <TableHead className="label-caps">Status</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Open</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody ref={tbodyRef}>
                  {displayedMedicines.map((m) => {
                    const low = isLowStock(m);
                    const tier =
                      m.expiryDate === undefined
                        ? null
                        : expiryTier(m.expiryDate, now, tiers);
                    const meta = [m.strength, m.form]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <TableRow
                        key={m._id}
                        data-stagger
                        className="cursor-pointer focus-within:bg-muted/50"
                        onClick={() => router.push(`/medicines/${m._id}`)}
                      >
                        <TableCell>
                          <Link
                            href={`/medicines/${m._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {m.name}
                          </Link>
                          {meta && (
                            <p className="text-xs text-muted-foreground">
                              {meta}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="font-data text-right">
                          {formatQuantity(m.onHandQuantity)}
                        </TableCell>
                        <TableCell className="font-data text-right text-muted-foreground">
                          {formatQuantity(m.actualQuantity)}
                        </TableCell>
                        <TableCell className="font-data whitespace-nowrap">
                          {m.expiryDate !== undefined ? (
                            formatDate(m.expiryDate)
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {tier ? (
                              <TierBadge tier={tier} />
                            ) : (
                              <PlainBadge>No expiry</PlainBadge>
                            )}
                            {low && <PlainBadge>Low stock</PlainBadge>}
                          </div>
                        </TableCell>
                        <TableCell className="w-10 pl-0">
                          <ChevronRight
                            aria-hidden
                            className="size-4 text-muted-foreground"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Mobile: label-style rows. */
            <Stagger className="divide-y overflow-hidden rounded-lg border bg-card shadow-xs">
              {displayedMedicines.map((m) => {
                const low = isLowStock(m);
                const tier =
                  m.expiryDate === undefined
                    ? null
                    : expiryTier(m.expiryDate, now, tiers);
                const flagged = (tier && tier !== "ok") || low;

                return (
                  <Link
                    key={m._id}
                    data-stagger
                    href={`/medicines/${m._id}`}
                    className="focus-card flex min-h-11 items-start justify-between gap-4 px-4 py-3 transition-colors duration-100 ease-out hover:bg-muted/50 focus-visible:bg-muted active:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="font-serif text-lg leading-tight">
                        {m.name}
                      </p>
                      <p className="label-caps mt-1 normal-case tracking-normal">
                        {[m.strength, m.form].filter(Boolean).join(" · ")}
                        {m.genericName ? ` · ${m.genericName}` : ""}
                      </p>
                      {flagged && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {tier && tier !== "ok" && (
                            <StampBadge tier={tier} size="sm" seed={m._id} />
                          )}
                          {low && (
                            <StampBadge
                              tier="low"
                              size="sm"
                              seed={`${m._id}-low`}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-center">
                      <div className="text-right">
                        <p className="font-data text-base font-semibold">
                          {formatQuantity(m.onHandQuantity)}
                        </p>
                        <p className="label-caps">On hand</p>
                      </div>
                      <ChevronRight
                        aria-hidden
                        className="size-4 text-muted-foreground"
                      />
                    </div>
                  </Link>
                );
              })}
            </Stagger>
          )}
        </>
      )}

      {usePaging && (status === "CanLoadMore" || status === "LoadingMore") && (
        <Button
          variant="outline"
          className="self-center"
          disabled={status === "LoadingMore"}
          onClick={() => loadMore(PAGE_SIZE)}
        >
          {status === "LoadingMore" && (
            <Loader2 className="animate-spin" aria-hidden />
          )}
          {status === "LoadingMore" ? "Loading…" : "Load more"}
        </Button>
      )}
    </Page>
  );
}

function PlainBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

/** A column header that drives the page's existing sort state. */
function SortHead({
  label,
  sortKey,
  sort,
  onSort,
  disabled,
  align = "left",
}: {
  label: string;
  sortKey: MedicineSort;
  sort: MedicineSort;
  onSort: (s: MedicineSort) => void;
  disabled: boolean;
  align?: "left" | "right";
}) {
  const active = !disabled && sort === sortKey;
  return (
    <TableHead
      aria-sort={active ? "ascending" : disabled ? undefined : "none"}
      className={cn("label-caps", align === "right" && "text-right")}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSort(sortKey)}
        className={cn(
          "label-caps -mx-1.5 inline-flex items-center gap-1 rounded-sm px-1.5 py-1 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
          active && "text-foreground",
        )}
      >
        {label}
        {active ? (
          <ArrowUp aria-hidden className="size-3.5" />
        ) : (
          <ArrowUpDown aria-hidden className="size-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}

/**
 * Off, a chip is quiet with only its icon in the tier colour; on, it takes the
 * same fill as the TierBadge it filters for, so the list below visibly matches.
 */
function StatusChip({ status, on }: { status: ExpiryStatus; on: boolean }) {
  if (status === "none") {
    return (
      <ToggleGroupItem value="none" className={CHIP_BUTTON}>
        <span className={cn(CHIP_FACE, on ? CHIP_ON_NEUTRAL : CHIP_OFF)}>
          No expiry
        </span>
      </ToggleGroupItem>
    );
  }

  const { label, icon: Icon } = tierStyle(status);
  const { fg, bg, border } = tierClasses(status);
  return (
    <ToggleGroupItem value={status} className={CHIP_BUTTON}>
      <span className={cn(CHIP_FACE, on ? cn(fg, bg, border) : CHIP_OFF)}>
        <Icon aria-hidden className={cn("size-3.5", !on && fg)} />
        {label}
      </span>
    </ToggleGroupItem>
  );
}
