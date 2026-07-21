"use client";

import { cn } from "@/lib/utils";
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
    <div className="rounded-lg border bg-card p-4">
      <p className="label-field">{label}</p>
      <p className={cn("font-data mt-1 text-2xl font-medium leading-none", valueClass)}>
        {typeof value === "number" ? formatQuantity(value) : value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
