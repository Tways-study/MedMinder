"use client";

import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Pill,
} from "lucide-react";

interface DashboardMetricsProps {
  totalMedicines: number;
  onHandUnits: number;
  actualUnits: number;
  alertCount: number;
  lowStockCount: number;
  discrepancyCount: number;
  activeTab: "onHand" | "actual";
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
      {/* Total Stock */}
      <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3.5 shadow-sm transition-all hover:border-orchid/30 hover:shadow">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Stock
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orchid/10 text-orchid">
            <Pill className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-data text-2xl font-bold tracking-tight text-foreground">
            {activeUnits.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">units</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Across {totalMedicines} {totalMedicines === 1 ? "medicine" : "medicines"}
          </p>
        </div>
      </div>

      {/* Expiry Alerts */}
      <div className={cn(
        "flex flex-col justify-between rounded-xl border p-3.5 shadow-sm transition-all hover:shadow",
        alertCount > 0
          ? "border-amber-200 bg-amber-50/50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"
          : "border-border/80 bg-card text-foreground"
      )}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Expiry Watch
          </span>
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            alertCount > 0 ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"
          )}>
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-data text-2xl font-bold tracking-tight">
            {alertCount}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {alertCount === 0 ? "All items in date" : `${alertCount} expiring soon`}
          </p>
        </div>
      </div>

      {/* Low Stock */}
      <div className={cn(
        "flex flex-col justify-between rounded-xl border p-3.5 shadow-sm transition-all hover:shadow",
        lowStockCount > 0
          ? "border-rose-200 bg-rose-50/50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-100"
          : "border-border/80 bg-card text-foreground"
      )}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Running Low
          </span>
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            lowStockCount > 0 ? "bg-rose-500/20 text-rose-600" : "bg-muted text-muted-foreground"
          )}>
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-data text-2xl font-bold tracking-tight">
            {lowStockCount}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {lowStockCount === 0 ? "Above reorder points" : "At or below reorder"}
          </p>
        </div>
      </div>

      {/* Discrepancy Drift */}
      <div className={cn(
        "flex flex-col justify-between rounded-xl border p-3.5 shadow-sm transition-all hover:shadow",
        discrepancyCount > 0
          ? "border-purple-200 bg-purple-50/50 text-purple-950 dark:border-purple-900/50 dark:bg-purple-950/20 dark:text-purple-100"
          : "border-border/80 bg-card text-foreground"
      )}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Count Drift
          </span>
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            discrepancyCount > 0 ? "bg-purple-500/20 text-purple-600" : "bg-muted text-muted-foreground"
          )}>
            <ArrowRightLeft className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="font-data text-2xl font-bold tracking-tight">
            {discrepancyCount}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {discrepancyCount === 0 ? "On hand matches actual" : "Needs reconciliation"}
          </p>
        </div>
      </div>
    </div>
  );
}
