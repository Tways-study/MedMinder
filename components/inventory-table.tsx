"use client";

import { QuantityStepper } from "@/components/quantity-stepper";
import { StatusChip } from "@/components/status-chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Id } from "@/convex/_generated/dataModel";
import {
  type AlertTiers,
  type ExpiryTier,
  expiryTier,
} from "@/convex/lib/inventory";
import { type MedicineSort, isLowStock } from "@/convex/lib/medicineFilters";
import { formatDate, formatForm, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";

export type InventoryMedicine = {
  _id: Id<"medicines">;
  name: string;
  genericName?: string;
  form: string;
  strength?: string;
  reorderPoint: number;
  expiryDate?: number;
  onHandQuantity: number;
  actualQuantity: number;
};

type Props = {
  medicines: InventoryMedicine[];
  now: number;
  tiers: AlertTiers;
  sort: MedicineSort;
  /** Search results keep best-match order, so the sort headers go inert. */
  sortDisabled: boolean;
  onSort: (sort: MedicineSort) => void;
  selectedId: string | null;
  hrefFor: (id: Id<"medicines">) => string;
  onOpen: (id: Id<"medicines">) => void;
  /** Table on desktop, stacked rows on a phone. Only one is mounted. */
  desktop: boolean;
};

function tierOf(m: InventoryMedicine, now: number, tiers: AlertTiers) {
  return m.expiryDate === undefined
    ? null
    : (expiryTier(m.expiryDate, now, tiers) as ExpiryTier);
}

function metaOf(m: InventoryMedicine) {
  return [m.strength, formatForm(m.form)].filter(Boolean).join(", ");
}

/** Signed gap between the physical count and the book count, or null when they agree. */
function drift(m: InventoryMedicine) {
  const d = m.actualQuantity - m.onHandQuantity;
  if (d === 0) return null;
  return d > 0 ? `+${formatQuantity(d)}` : `−${formatQuantity(-d)}`;
}

function RowStatus({
  tier,
  low,
}: {
  tier: ExpiryTier | null;
  low: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tier === null ? (
        <span className="text-xs text-muted-foreground">No expiry</span>
      ) : tier === "ok" ? (
        <StatusChip kind="ok" variant="dot" />
      ) : (
        <StatusChip kind={tier} />
      )}
      {low && <StatusChip kind="low" />}
    </div>
  );
}

export function InventoryTable(props: Props) {
  return props.desktop ? <DesktopTable {...props} /> : <StackedRows {...props} />;
}

function DesktopTable({
  medicines,
  now,
  tiers,
  sort,
  sortDisabled,
  onSort,
  selectedId,
  hrefFor,
  onOpen,
}: Props) {
  return (
    <div
      data-inventory-table
      className="overflow-hidden rounded-lg border bg-card shadow-xs [&>div]:max-h-[calc(100dvh-17rem)] [&>div]:min-h-48"
    >
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted [&_th]:bg-muted">
          <TableRow className="hover:bg-transparent">
            <SortHead
              label="Name"
              sortKey="name"
              sort={sort}
              onSort={onSort}
              disabled={sortDisabled}
            />
            <SortHead
              label="On hand"
              sortKey="stock"
              sort={sort}
              onSort={onSort}
              disabled={sortDisabled}
              align="right"
            />
            <TableHead className="label-caps text-right">Actual</TableHead>
            <SortHead
              label="Expiry"
              sortKey="expiry"
              sort={sort}
              onSort={onSort}
              disabled={sortDisabled}
            />
            <TableHead className="label-caps">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medicines.map((m) => {
            const selected = selectedId === m._id;
            const gap = drift(m);
            return (
              <TableRow
                key={m._id}
                aria-selected={selected || undefined}
                data-state={selected ? "selected" : undefined}
                className={cn(
                  "cursor-pointer",
                  selected ? "bg-accent/60 hover:bg-accent/60" : "hover:bg-muted/50",
                )}
                onClick={(e) => {
                  // Links, steppers and inputs handle their own clicks.
                  if ((e.target as HTMLElement).closest("a,button,input")) return;
                  onOpen(m._id);
                }}
              >
                <TableCell className="max-w-[18rem]">
                  <Link
                    href={hrefFor(m._id)}
                    scroll={false}
                    aria-current={selected ? "true" : undefined}
                    className="block truncate rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {m.name}
                  </Link>
                  {metaOf(m) && (
                    <p className="truncate text-xs text-muted-foreground">
                      {metaOf(m)}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <QuantityStepper
                      compact
                      medicineId={m._id}
                      kind="onHand"
                      value={m.onHandQuantity}
                      label={`${m.name} on hand`}
                    />
                  </div>
                </TableCell>
                <TableCell className="font-data text-right text-muted-foreground">
                  {formatQuantity(m.actualQuantity)}
                  {gap && (
                    <span
                      className="ml-1.5 text-xs"
                      title="Difference from the on-hand count"
                    >
                      {gap}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-data whitespace-nowrap">
                  {m.expiryDate !== undefined ? (
                    formatDate(m.expiryDate)
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <RowStatus tier={tierOf(m, now, tiers)} low={isLowStock(m)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function StackedRows({
  medicines,
  now,
  tiers,
  selectedId,
  hrefFor,
}: Props) {
  return (
    <div
      data-inventory-table
      className="divide-y overflow-hidden rounded-lg border bg-card shadow-xs"
    >
      {medicines.map((m) => {
        const tier = tierOf(m, now, tiers);
        const low = isLowStock(m);
        const flagged = (tier && tier !== "ok") || low;
        return (
          <Link
            key={m._id}
            href={hrefFor(m._id)}
            scroll={false}
            aria-current={selectedId === m._id ? "true" : undefined}
            className="focus-card flex min-h-11 items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted active:bg-muted"
          >
            <div className="min-w-0">
              <p className="font-serif text-lg leading-tight">{m.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {metaOf(m)}
                {m.genericName ? ` · ${m.genericName}` : ""}
              </p>
              {flagged && (
                <div className="mt-2">
                  <RowStatus tier={tier && tier !== "ok" ? tier : null} low={low} />
                </div>
              )}
            </div>
            <div className="shrink-0 self-center text-right">
              <p className="font-data text-base font-semibold">
                {formatQuantity(m.onHandQuantity)}
              </p>
              <p className="label-caps">On hand</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/** A column header that drives the page's sort state. */
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
