"use client";

import { GroupedList, GroupedListRow } from "@/components/grouped-list";
import { MedicineCard } from "@/components/medicine-card";
import { MedicineForm } from "@/components/medicine-form";
import { ExpandCollapse } from "@/components/motion";
import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { tierLabel } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LabelField, RxLabel } from "@/components/rx-label";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import type { ExpiryTier } from "@/convex/lib/inventory";
import { formatExpiryDistance } from "@/convex/lib/inventory";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import {
  PackageOpen,
  PackageSearch,
  Plus,
  ShieldCheck,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK, STAGGER } from "@/lib/motion";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { DashboardMetrics } from "@/components/dashboard-metrics";

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

/**
 * Rows rise in as they scroll into view, staggered per batch. GroupedList owns
 * its <ul>, so this animates the <li> rows from outside rather than putting a
 * wrapper element inside the list.
 */
function RowReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const rows = Array.from(
          root.querySelectorAll<HTMLElement>(":scope > section > ul > li"),
        );
        if (!rows.length) return;
        gsap.set(rows, { y: 10, autoAlpha: 0 });
        const reveal = (batch: Element[]) =>
          gsap.to(batch, {
            y: 0,
            autoAlpha: 1,
            duration: DUR.enter,
            ease: EASE.out,
            stagger: STAGGER,
            overwrite: "auto",
            clearProps: "transform,opacity,visibility",
          });
        // onLeave: rows already scrolled past must not stay hidden.
        ScrollTrigger.batch(rows, {
          start: "top 96%",
          once: true,
          onEnter: reveal,
          onLeave: reveal,
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return <div ref={ref}>{children}</div>;
}

export default function DashboardPage() {
  const summary = useQuery(api.dashboard.summary);
  const medicines = useQuery(api.medicines.list);
  const create = useMutation(api.medicines.create);
  const now = Date.now();

  const [tab, setTab] = useState<Tab>("onHand");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<Id<"medicines"> | null>(null);
  // Set after mount so server and client markup match.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);
  const eyebrow = today ?? " ";

  if (summary === undefined || medicines === undefined) {
    return (
      <Page>
        <PageHeader
          eyebrow={eyebrow}
          title="Today"
          description="Checking the shelf…"
        />
        <div aria-hidden>
          <RxLabel title="Shelf report">
            {["Total stock", "Expiry watch", "Running low", "Count drift"].map(
              (label) => (
                <LabelField
                  key={label}
                  label={label}
                  mono={false}
                  value={
                    <>
                      <Skeleton className="h-7 w-14" />
                      <Skeleton className="mt-2 h-3 w-24 opacity-70" />
                    </>
                  }
                />
              ),
            )}
          </RxLabel>
        </div>
        <CardSkeleton count={3} />
      </Page>
    );
  }

  const nothingStocked = medicines.length === 0;
  const medicineById = new Map(medicines.map((m) => [m._id, m]));
  // Alerts already carry the settings-configured tier, computed server-side —
  // reused here so a badge on the Actual tab never disagrees with On hand.
  const tierByMedicine = new Map(
    summary.alerts.map((a) => [a.medicineId, a.tier]),
  );
  const discrepancyCount = medicines.filter(
    (m) => m.onHandQuantity !== m.actualQuantity,
  ).length;

  const q = search.trim().toLowerCase();
  const searching = q.length > 0;

  function toggleEdit(id: Id<"medicines">) {
    setEditingId((current) => (current === id ? null : id));
  }

  const addPanel = (
    <ExpandCollapse open={adding}>
      <Card className="mt-0 p-4">
        <MedicineForm
          submitLabel="Add medicine"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            try {
              await create(values);
              setAdding(false);
              toast.success(`Added ${values.name}`);
              const reduceMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
              ).matches;
              window.scrollTo({
                top: 0,
                behavior: reduceMotion ? "auto" : "smooth",
              });
            } catch (err) {
              if (
                err instanceof ConvexError &&
                typeof err.data === "object" &&
                err.data !== null &&
                (err.data as Record<string, unknown>).code === "DUPLICATE"
              ) {
                const message = `A medicine named "${(err.data as { name: string }).name}" already exists.`;
                toast.error(message);
                throw new ConvexError(message);
              }
              toast.error("Could not add the medicine");
              throw err;
            }
          }}
        />
      </Card>
    </ExpandCollapse>
  );

  const addButton = (
    <Button
      type="button"
      variant={adding ? "outline" : "default"}
      onClick={() => setAdding((v) => !v)}
    >
      {adding ? <X aria-hidden /> : <Plus aria-hidden />}
      {adding ? "Cancel" : "Add medicine"}
    </Button>
  );

  return (
    <Page>
      <PageHeader
        eyebrow={eyebrow}
        title="Today"
        description={
          nothingStocked ? (
            "Nothing on the shelf yet."
          ) : summary.alerts.length > 0 ? (
            <>
              <span className="font-serif text-lg italic text-foreground">
                {summary.alerts.length}{" "}
                {summary.alerts.length === 1 ? "needs" : "need"} attention
              </span>
              , most urgent first.
            </>
          ) : (
            "Everything on the shelf is in order."
          )
        }
        actions={addButton}
      />

      {addPanel}

      {!nothingStocked && (
        <DashboardMetrics
          totalMedicines={summary.totals.medicines}
          onHandUnits={summary.totals.onHandUnits}
          actualUnits={summary.totals.actualUnits}
          alertCount={summary.alerts.length}
          lowStockCount={summary.lowStock.length}
          discrepancyCount={discrepancyCount}
          activeTab={tab}
          right={
            <ToggleGroup
              type="single"
              value={tab}
              onValueChange={(v) => v && setTab(v as Tab)}
              aria-label="Which count to show"
            >
              <ToggleGroupItem value="onHand">On hand</ToggleGroupItem>
              <ToggleGroupItem value="actual">Actual</ToggleGroupItem>
            </ToggleGroup>
          }
        />
      )}

      {!nothingStocked && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.75}
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines"
              aria-label="Search medicines"
              className="pl-9 pr-10 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {searching && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-0.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.75} aria-hidden />
              </Button>
            )}
          </div>
        </div>
      )}

      {nothingStocked && !adding && (
        <EmptyState
          icon={PackageOpen}
          title="Nothing on the shelf yet"
          description="Add the medicines you stock, with their expiry date and quantity. Expiry alerts start from there."
          action={
            <Button type="button" onClick={() => setAdding(true)}>
              <Plus aria-hidden />
              Add medicine
            </Button>
          }
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
    ? summary.alerts.filter((a) =>
        a.medicineName.toLowerCase().includes(search),
      )
    : summary.alerts;
  const filteredLowStock = search
    ? summary.lowStock.filter((m) => m.name.toLowerCase().includes(search))
    : summary.lowStock;

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    items: filteredAlerts.filter((a) => a.tier === tier),
  })).filter((g) => g.items.length > 0);

  const noMatches =
    searching && grouped.length === 0 && filteredLowStock.length === 0;

  return (
    <>
      {!searching &&
        summary.alerts.length === 0 &&
        summary.totals.medicines > 0 && (
          <EmptyState
            icon={ShieldCheck}
            title="All in date"
            description="Nothing on the shelf expires within six months. A quiet shelf is the goal."
          />
        )}

      {noMatches && (
        <EmptyState
          icon={PackageSearch}
          title="Nothing matches that"
          description={`No medicine matches "${search}". Check the spelling and try again.`}
        />
      )}

      {grouped.map(({ tier, items }) => (
        <RowReveal key={tier}>
          <GroupedList
            title={tierLabel(tier)}
            count={items.length}
            description={TIER_BLURB[tier]}
          >
            {items.map((item) => {
              const medicine = medicineById.get(item.medicineId);
              if (!medicine) return null;
              return (
                <GroupedListRow key={item.medicineId} bare>
                  <MedicineCard
                    medicine={medicine}
                    activeKind="onHand"
                    tier={item.tier}
                    expiryDistance={formatExpiryDistance(item.expiryDate, now)}
                    isEditing={editingId === item.medicineId}
                    onToggleEdit={() => onToggleEdit(item.medicineId)}
                  />
                </GroupedListRow>
              );
            })}
          </GroupedList>
        </RowReveal>
      ))}

      {filteredLowStock.length > 0 && (
        <RowReveal>
          <GroupedList
            title="Running low"
            count={filteredLowStock.length}
            description="At or below the reorder point you set."
          >
            {filteredLowStock.map((m) => {
              const medicine = medicineById.get(m.medicineId);
              if (!medicine) return null;
              return (
                <GroupedListRow key={m.medicineId} bare>
                  <MedicineCard
                    medicine={medicine}
                    activeKind="onHand"
                    tier={undefined}
                    expiryDistance={
                      medicine.expiryDate
                        ? formatExpiryDistance(medicine.expiryDate, now)
                        : undefined
                    }
                    isEditing={editingId === m.medicineId}
                    onToggleEdit={() => onToggleEdit(m.medicineId)}
                  />
                </GroupedListRow>
              );
            })}
          </GroupedList>
        </RowReveal>
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
        icon={PackageSearch}
        title="Nothing matches that"
        description={`No medicine matches "${search}". Check the spelling and try again.`}
      />
    );
  }

  if (sorted.length === 0) return null;

  return (
    <RowReveal>
      <GroupedList
        title="All medicines"
        count={sorted.length}
        description="Walk the shelf and update counts as you go."
      >
        {sorted.map((m) => (
          <GroupedListRow key={m._id} bare>
            <MedicineCard
              medicine={m}
              activeKind="actual"
              tier={tierByMedicine.get(m._id)}
              expiryDistance={
                m.expiryDate
                  ? formatExpiryDistance(m.expiryDate, now)
                  : undefined
              }
              isEditing={editingId === m._id}
              onToggleEdit={() => onToggleEdit(m._id)}
            />
          </GroupedListRow>
        ))}
      </GroupedList>
    </RowReveal>
  );
}
