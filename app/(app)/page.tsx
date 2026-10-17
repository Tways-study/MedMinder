"use client";

import { InventoryTable } from "@/components/inventory-table";
import { MedicineDrawer, type DrawerState } from "@/components/medicine-drawer";
import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { statusStyle } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { DEFAULT_ALERT_TIERS } from "@/convex/lib/inventory";
import {
  type MedicineFilter,
  type MedicineSort,
  filterMedicines,
  isFiltering,
  sortMedicines,
} from "@/convex/lib/medicineFilters";
import { parseSearch } from "@/convex/lib/search";
import { INVENTORY_VIEWS, type InventoryView } from "@/lib/nav";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import {
  PackageOpen,
  Package,
  PackageMinus,
  Plus,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const SHOW_STEP = 100;

const SORT_LABELS: Record<MedicineSort, string> = {
  expiry: "Soonest expiry",
  name: "Name",
  stock: "Lowest stock",
};

const VIEW_FILTER: Record<InventoryView, MedicineFilter> = {
  all: { statuses: [], lowStockOnly: false },
  expired: { statuses: ["expired"], lowStockOnly: false },
  critical: { statuses: ["critical"], lowStockOnly: false },
  warning: { statuses: ["warning"], lowStockOnly: false },
  watch: { statuses: ["watch"], lowStockOnly: false },
  low: { statuses: [], lowStockOnly: true },
};

const VIEW_LABEL: Record<InventoryView, string> = {
  all: "All",
  expired: "Expired",
  critical: "Critical",
  warning: "Soon",
  watch: "Watch",
  low: "Low stock",
};

export default function InventoryPage() {
  // useSearchParams needs a Suspense boundary for the static build.
  return (
    <Suspense
      fallback={
        <Page>
          <CardSkeleton count={5} />
        </Page>
      }
    >
      <Inventory />
    </Suspense>
  );
}

function parseView(value: string | null): InventoryView {
  return INVENTORY_VIEWS.includes(value as InventoryView)
    ? (value as InventoryView)
    : "all";
}

function Inventory() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const desktop = useMediaQuery("(min-width: 768px)");

  const view = parseView(params.get("view"));
  const openId = params.get("m");
  const adding = params.get("add") === "1";
  const editing = params.get("edit") === "1";

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<MedicineSort>("expiry");
  const [shown, setShown] = useState(SHOW_STEP);

  const medicines = useQuery(api.medicines.list);
  const settings = useQuery(api.settings.get);
  const tiers = settings?.alertTiers ?? DEFAULT_ALERT_TIERS;
  const now = Date.now();

  // Status words typed into the box ("critical amox") filter like the tabs;
  // whatever text is left searches names, ranked by the server.
  const parsed = parseSearch(search);
  const needle = parsed.text;
  const isSearching = needle !== null;
  const typedFilter: MedicineFilter = {
    statuses: parsed.statuses,
    lowStockOnly: parsed.lowStock,
  };
  const searchResults = useQuery(
    api.medicines.searchByName,
    needle ? { q: needle } : "skip",
  );
  // Keep the previous matches on screen while the next keystroke loads, so the
  // list narrows in place instead of flashing back to a skeleton.
  const [lastResults, setLastResults] = useState(searchResults);
  if (searchResults !== undefined && searchResults !== lastResults) {
    setLastResults(searchResults);
  }
  const source = isSearching ? (searchResults ?? lastResults) : medicines;

  function update(
    changes: Record<string, string | null>,
    mode: "push" | "replace" = "push",
  ) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router[mode](qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function hrefFor(id: Id<"medicines">) {
    const next = new URLSearchParams(params.toString());
    next.delete("add");
    next.delete("edit");
    next.set("m", id);
    return `${pathname}?${next.toString()}`;
  }

  const drawer: DrawerState = adding
    ? { kind: "add" }
    : openId
      ? { kind: "view", id: openId, editing }
      : null;
  const drawerOpen = drawer !== null;

  if (medicines === undefined || source === undefined) {
    return (
      <Page>
        <PageHeader title="Inventory" description="Checking the shelf…" />
        <CardSkeleton count={5} />
        <MedicineDrawer
          state={drawer}
          medicines={undefined}
          tiers={tiers}
          now={now}
          desktop={desktop}
          onClose={() => update({ m: null, add: null, edit: null })}
          onEdit={() => update({ edit: "1" })}
          onStopEdit={() => update({ edit: null })}
          onSaved={(id) => update({ add: null, edit: null, m: id })}
        />
      </Page>
    );
  }

  // Tab counts always describe the whole shelf, not the current search.
  const counts = Object.fromEntries(
    INVENTORY_VIEWS.map((v) => [
      v,
      filterMedicines(medicines, VIEW_FILTER[v], now, tiers).length,
    ]),
  ) as Record<InventoryView, number>;
  const attention = counts.expired + counts.critical + counts.warning;

  const filtered = filterMedicines(
    filterMedicines(source, VIEW_FILTER[view], now, tiers),
    typedFilter,
    now,
    tiers,
  );
  const rows = isSearching ? filtered : sortMedicines(filtered, sort);
  const visible = rows.slice(0, shown);

  const shelfIsEmpty = medicines.length === 0;
  const trimmed = search.trim();
  const typedStatus = isFiltering(typedFilter);

  return (
    <div
      className={cn(
        "transition-[padding] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
        drawerOpen && "xl:pr-[28rem]",
      )}
    >
      <Page>
        <PageHeader
          title="Inventory"
          description={
            shelfIsEmpty
              ? "Nothing on the shelf yet."
              : `${medicines.length} ${medicines.length === 1 ? "medicine" : "medicines"} on the shelf. ${
                  attention > 0
                    ? `${attention} ${attention === 1 ? "needs" : "need"} attention.`
                    : "Everything is in date."
                }`
          }
          actions={
            // Desktop has Add in the top bar.
            <Button
              className="md:hidden"
              onClick={() => update({ add: "1", m: null, edit: null })}
            >
              <Plus aria-hidden />
              Add medicine
            </Button>
          }
        />

        {!shelfIsEmpty && (
          <div className="flex flex-col gap-3">
            <div
              role="group"
              aria-label="Filter by status"
              className="-mx-1 flex gap-1 overflow-x-auto overflow-y-hidden border-b px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {INVENTORY_VIEWS.map((v) => {
                const active = v === view;
                const style =
                  v === "all"
                    ? null
                    : v === "low"
                      ? statusStyle("low")
                      : statusStyle(v);
                const Icon = style?.icon;
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setShown(SHOW_STEP);
                      update({ view: v === "all" ? null : v }, "replace");
                    }}
                    className={cn(
                      "focus-card -mb-px flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors",
                      active
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {Icon && (
                      <Icon
                        aria-hidden
                        className={cn("size-3.5", style?.fg)}
                        strokeWidth={1.75}
                      />
                    )}
                    {VIEW_LABEL[v]}
                    <span className="font-data text-xs text-muted-foreground">
                      {counts[v]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1 basis-full sm:basis-auto sm:max-w-md">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShown(SHOW_STEP);
                  }}
                  placeholder="Filter by name, or type expired, low stock…"
                  aria-label="Filter medicines by name or status"
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

              {/* Desktop sorts from the column headers. */}
              {!isSearching && (
                <div className="flex items-center gap-2 md:hidden">
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

              <p
                aria-live="polite"
                className="ml-auto text-sm text-muted-foreground"
              >
                {trimmed.length === 1
                  ? "Type one more letter to search"
                  : isSearching
                    ? "Best match first"
                    : `${rows.length} shown`}
              </p>
            </div>
          </div>
        )}

        {shelfIsEmpty && (
          <EmptyState
            icon={PackageOpen}
            title="No medicines yet"
            description="Add the medicines you stock, with their expiry date and quantity. Expiry alerts start from there."
            action={
              <Button onClick={() => update({ add: "1", m: null, edit: null })}>
                <Plus aria-hidden />
                Add the first medicine
              </Button>
            }
          />
        )}

        {!shelfIsEmpty && rows.length === 0 && (
          <EmptyState
            icon={view === "low" ? PackageMinus : isSearching ? SearchX : Package}
            title={isSearching ? "Nothing matches that" : "Nothing here"}
            description={
              isSearching
                ? view !== "all" || typedStatus
                  ? `No ${VIEW_LABEL[view].toLowerCase()} medicine matches "${needle}". Switch to All or drop the status words to search the whole shelf.`
                  : `No medicine matches "${trimmed}". Check the spelling, or try the generic name.`
                : `No medicine is ${view === "low" ? "low on stock" : VIEW_LABEL[view].toLowerCase()} right now.`
            }
            action={
              (view !== "all" || search) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    update({ view: null }, "replace");
                  }}
                >
                  Show everything
                </Button>
              )
            }
          />
        )}

        {rows.length > 0 && (
          <>
            <InventoryTable
              medicines={visible}
              now={now}
              tiers={tiers}
              sort={sort}
              sortDisabled={isSearching}
              onSort={setSort}
              selectedId={openId}
              hrefFor={hrefFor}
              onOpen={(id) => update({ m: id, add: null, edit: null })}
              desktop={desktop}
            />
            {rows.length > visible.length && (
              <Button
                variant="outline"
                className="self-center"
                onClick={() => setShown((n) => n + SHOW_STEP)}
              >
                Show more ({rows.length - visible.length} left)
              </Button>
            )}
          </>
        )}
      </Page>

      <MedicineDrawer
        state={drawer}
        medicines={medicines}
        tiers={tiers}
        now={now}
        desktop={desktop}
        onClose={() => update({ m: null, add: null, edit: null })}
        onEdit={() => update({ edit: "1" })}
        onStopEdit={() => update({ edit: null })}
        onSaved={(id) => update({ add: null, edit: null, m: id })}
      />
    </div>
  );
}
