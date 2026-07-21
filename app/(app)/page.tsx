"use client";

import { MedicineCard } from "@/components/medicine-card";
import { MedicineForm } from "@/components/medicine-form";
import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { tierLabel } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { ExpiryTier } from "@/convex/lib/inventory";
import { formatExpiryDistance } from "@/convex/lib/inventory";
import { formatQuantity } from "@/lib/format";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useState } from "react";

import { DashboardMetrics } from "@/components/dashboard-metrics";
import { Plus, Search, X } from "lucide-react";

type DashboardSummary = FunctionReturnType<typeof api.dashboard.summary>;
type MedicineList = FunctionReturnType<typeof api.medicines.list>;

/** Most urgent first. Expired medicines are a legal problem, not a planning one. */
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

type Tab = "onHand" | "actual";

export default function DashboardPage() {
  const summary = useQuery(api.dashboard.summary);
  const medicines = useQuery(api.medicines.list);
  const create = useMutation(api.medicines.create);
  const now = Date.now();

  const [tab, setTab] = useState<Tab>("onHand");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<Id<"medicines"> | null>(null);

  if (summary === undefined || medicines === undefined) {
    return (
      <Page>
        <PageHeader title="Today" />
        <CardSkeleton count={3} />
      </Page>
    );
  }

  const nothingStocked = medicines.length === 0;
  const medicineById = new Map(medicines.map((m) => [m._id, m]));
  // Alerts already carry the settings-configured tier, computed server-side —
  // reused here so a badge on the Actual tab never disagrees with On hand.
  const tierByMedicine = new Map(summary.alerts.map((a) => [a.medicineId, a.tier]));
  const discrepancyCount = medicines.filter((m) => m.onHandQuantity !== m.actualQuantity).length;

  const q = search.trim().toLowerCase();
  const searching = q.length > 0;

  function toggleEdit(id: Id<"medicines">) {
    setEditingId((current) => (current === id ? null : id));
  }

  const addPanel = (
    <div className="flex flex-col gap-3">
      {adding && (
        <div className="rounded-xl border border-orchid/30 bg-card p-5 shadow-md transition-all">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <h3 className="font-display text-lg font-semibold text-foreground">Add New Medicine</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAdding(false)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <MedicineForm
            submitLabel="Add medicine"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              await create(values);
              setAdding(false);
            }}
          />
        </div>
      )}
    </div>
  );

  return (
    <Page>
      <PageHeader
        title="Today"
        subtitle="Inventory health dashboard & reconciliation"
        action={
          <Button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-orchid px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orchid/90 hover:shadow active:scale-98"
          >
            {adding ? (
              <>
                <X className="h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add medicine
              </>
            )}
          </Button>
        }
      />

      {!nothingStocked && (
        <DashboardMetrics
          totalMedicines={summary.totals.medicines}
          onHandUnits={summary.totals.onHandUnits}
          actualUnits={summary.totals.actualUnits}
          alertCount={summary.alerts.length}
          lowStockCount={summary.lowStock.length}
          discrepancyCount={discrepancyCount}
          activeTab={tab}
        />
      )}

      {addPanel}

      {!nothingStocked && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ToggleGroup
            type="single"
            value={tab}
            onValueChange={(v) => v && setTab(v as Tab)}
            className="inline-flex h-10 w-full sm:w-auto rounded-lg border border-border/80 bg-muted/40 p-1 shadow-2xs"
          >
            <ToggleGroupItem
              value="onHand"
              className="flex-1 sm:flex-initial px-5 h-8 rounded-md text-xs font-semibold tracking-tight data-[state=on]:bg-card data-[state=on]:text-orchid data-[state=on]:shadow-xs transition-all"
            >
              On hand
            </ToggleGroupItem>
            <ToggleGroupItem
              value="actual"
              className="flex-1 sm:flex-initial px-5 h-8 rounded-md text-xs font-semibold tracking-tight data-[state=on]:bg-card data-[state=on]:text-orchid data-[state=on]:shadow-xs transition-all"
            >
              Actual
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines..."
              aria-label="Search medicines"
              className="h-10 pl-9 pr-9 text-sm rounded-lg border-border/80 bg-card shadow-2xs focus-visible:ring-orchid [&::-webkit-search-cancel-button]:appearance-none"
            />
            {searching && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {nothingStocked && !adding && (
        <EmptyState
          title="Nothing on the shelf yet"
          body="Add the medicines you stock, with their expiry date and quantity. Expiry alerts start from there."
        />
      )}

      {tab === "onHand" ? (
        <OnHandTab
          summary={summary}
          medicineById={medicineById}
          now={now}
          search={q}
          searching={searching}
          editingId={editingId}
          onToggleEdit={toggleEdit}
        />
      ) : (
        <ActualTab
          medicines={medicines}
          tierByMedicine={tierByMedicine}
          now={now}
          search={q}
          searching={searching}
          editingId={editingId}
          onToggleEdit={toggleEdit}
        />
      )}
    </Page>
  );
}

function OnHandTab({
  summary,
  medicineById,
  now,
  search,
  searching,
  editingId,
  onToggleEdit,
}: {
  summary: DashboardSummary;
  medicineById: Map<Id<"medicines">, MedicineList[number]>;
  now: number;
  search: string;
  searching: boolean;
  editingId: Id<"medicines"> | null;
  onToggleEdit: (id: Id<"medicines">) => void;
}) {
  const filteredAlerts = search
    ? summary.alerts.filter((a) => a.medicineName.toLowerCase().includes(search))
    : summary.alerts;
  const filteredLowStock = search
    ? summary.lowStock.filter((m) => m.name.toLowerCase().includes(search))
    : summary.lowStock;

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: filteredAlerts.filter((a) => a.tier === tier),
  })).filter((g) => g.items.length > 0);

  const noMatches = searching && grouped.length === 0 && filteredLowStock.length === 0;

  return (
    <>
      {!searching && summary.alerts.length === 0 && summary.totals.medicines > 0 && (
        <EmptyState
          title="Nothing expiring soon"
          body="Nothing on the shelf expires within six months. This is the screen you want to be boring."
        />
      )}

      {noMatches && (
        <EmptyState
          title="Nothing matches that"
          body={`No medicine matches "${search}". Check the spelling and try again.`}
        />
      )}

      {grouped.map(({ tier, items }) => (
        <section key={tier} className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-medium">
              {tierLabel(tier)}
              <span
                className="ml-2 font-data text-sm font-normal text-muted-foreground"
                aria-label={`${items.length} ${items.length === 1 ? "medicine" : "medicines"}`}
                title={`${items.length} ${items.length === 1 ? "medicine" : "medicines"} in this tier`}
              >
                {items.length}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">{TIER_BLURB[tier]}</p>
          </div>

          {items.map((item) => {
            const medicine = medicineById.get(item.medicineId);
            if (!medicine) return null;
            return (
              <MedicineCard
                key={item.medicineId}
                medicine={medicine}
                activeKind="onHand"
                tier={item.tier}
                expiryDistance={formatExpiryDistance(item.expiryDate, now)}
                isEditing={editingId === item.medicineId}
                onToggleEdit={() => onToggleEdit(item.medicineId)}
              />
            );
          })}
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

          {filteredLowStock.map((m) => {
            const medicine = medicineById.get(m.medicineId);
            if (!medicine) return null;
            return (
              <MedicineCard
                key={m.medicineId}
                medicine={medicine}
                activeKind="onHand"
                tier={undefined}
                expiryDistance={
                  medicine.expiryDate ? formatExpiryDistance(medicine.expiryDate, now) : undefined
                }
                isEditing={editingId === m.medicineId}
                onToggleEdit={() => onToggleEdit(m.medicineId)}
              />
            );
          })}
        </section>
      )}
    </>
  );
}

function ActualTab({
  medicines,
  tierByMedicine,
  now,
  search,
  searching,
  editingId,
  onToggleEdit,
}: {
  medicines: MedicineList;
  tierByMedicine: Map<Id<"medicines">, Exclude<ExpiryTier, "ok">>;
  now: number;
  search: string;
  searching: boolean;
  editingId: Id<"medicines"> | null;
  onToggleEdit: (id: Id<"medicines">) => void;
}) {
  const filtered = search
    ? medicines.filter((m) => m.name.toLowerCase().includes(search))
    : medicines;
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  if (searching && sorted.length === 0) {
    return (
      <EmptyState
        title="Nothing matches that"
        body={`No medicine matches "${search}". Check the spelling and try again.`}
      />
    );
  }

  if (sorted.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-lg font-medium">
          All medicines
          <span className="ml-2 font-data text-sm font-normal text-muted-foreground">
            {sorted.length}
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Walk the shelf and update counts as you go.
        </p>
      </div>

      {sorted.map((m) => (
        <MedicineCard
          key={m._id}
          medicine={m}
          activeKind="actual"
          tier={tierByMedicine.get(m._id)}
          expiryDistance={m.expiryDate ? formatExpiryDistance(m.expiryDate, now) : undefined}
          isEditing={editingId === m._id}
          onToggleEdit={() => onToggleEdit(m._id)}
        />
      ))}
    </section>
  );
}
