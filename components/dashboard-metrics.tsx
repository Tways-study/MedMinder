"use client";

import { cn } from "@/lib/utils";
import { HoverScale, RollingNumber } from "@/components/motion";
import { formatQuantity } from "@/lib/format";

interface DashboardMetricsProps {
  totalMedicines: number;
  onHandUnits: number;
  actualUnits: number;
  alertCount: number;
  lowStockCount: number;
  discrepancyCount: number;
  activeTab: "onHand" | "actual";
}

function MetricTile({
  label,
  value,
  note,
  valueClass,
}: {
  label: string;
  value: string | number;
  note: string;
  valueClass?: string;
}) {
  return (
    <HoverScale scale={1.012} className="relative hover:z-10">
      <div className="h-full bg-card p-4 transition-colors duration-100 ease-out hover:bg-pebble/30">
        <p className="label-field">{label}</p>
        <p className={cn("font-data mt-1 text-title font-semibold", valueClass)}>
          {typeof value === "number" ? (
            <RollingNumber value={value} format={formatQuantity} />
          ) : (
            value
          )}
        </p>
        <p className="mt-1 text-caption text-muted-foreground">{note}</p>
      </div>
    </HoverScale>
  );
}

export function DashboardMetrics({
  totalMedicines,
  onHandUnits,
  actualUnits,
  alertCount,
  lowStockCount,
  discrepancyCount,
  activeTab,
}: DashboardMetricsProps) {
  const activeUnits = activeTab === "onHand" ? onHandUnits : actualUnits;

  return (
    // One grouped block, not four cards: the 1px gap over a hairline-coloured
    // backing draws the dividers, so the tiles read as a single summary.
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-4">
      <MetricTile
        label="Total stock"
        value={activeUnits}
        note={`${formatQuantity(totalMedicines)} ${totalMedicines === 1 ? "medicine" : "medicines"}`}
      />
      <MetricTile
        label="Expiry watch"
        value={alertCount}
        note={alertCount === 0 ? "All items in date" : "Expiring soon"}
        valueClass={alertCount > 0 ? "text-tier-warning" : undefined}
      />
      <MetricTile
        label="Running low"
        value={lowStockCount}
        note={lowStockCount === 0 ? "Above reorder points" : "At or below reorder"}
        valueClass={lowStockCount > 0 ? "text-tier-critical" : undefined}
      />
      <MetricTile
        label="Count drift"
        value={discrepancyCount}
        note={discrepancyCount === 0 ? "On hand matches actual" : "Needs reconciliation"}
        valueClass={discrepancyCount > 0 ? "text-tier-watch" : undefined}
      />
    </div>
  );
}
