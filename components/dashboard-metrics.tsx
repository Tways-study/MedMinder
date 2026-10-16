"use client";

import { RollingNumber } from "@/components/motion";
import { LabelField, RxLabel } from "@/components/rx-label";
import { tierClasses } from "@/components/tier-badge";
import { formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Boxes,
  Clock,
  Scale,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

interface DashboardMetricsProps {
  totalMedicines: number;
  onHandUnits: number;
  actualUnits: number;
  alertCount: number;
  lowStockCount: number;
  discrepancyCount: number;
  activeTab: "onHand" | "actual";
  /** Right slot of the label header (e.g. the On hand / Actual toggle). */
  right?: ReactNode;
}

function MetricValue({
  label,
  icon: Icon,
  value,
  note,
  tintClass,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  note: string;
  /** Tier foreground class; applied to icon and value only when set (non-zero alerts). */
  tintClass?: string;
}) {
  return (
    <LabelField
      label={label}
      mono={false}
      value={
        <>
          <span
            className={cn(
              "font-data flex items-center gap-1.5 text-2xl font-semibold leading-none lg:text-3xl",
              tintClass,
            )}
          >
            {tintClass && (
              <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            )}
            <RollingNumber
              value={value}
              format={formatQuantity}
              countUpOnMount
            />
          </span>
          <span className="mt-1.5 block text-xs text-muted-foreground">
            {note}
          </span>
        </>
      }
    />
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
  right,
}: DashboardMetricsProps) {
  const activeUnits = activeTab === "onHand" ? onHandUnits : actualUnits;

  return (
    <RxLabel
      title="Shelf report"
      right={right}
      footer={`${formatQuantity(totalMedicines)} ${totalMedicines === 1 ? "medicine" : "medicines"} on the shelf, counting ${activeTab === "onHand" ? "on hand" : "actual"}.`}
    >
      <MetricValue
        label="Total stock"
        icon={Boxes}
        value={activeUnits}
        note="Units counted"
      />
      <MetricValue
        label="Expiry watch"
        icon={Clock}
        value={alertCount}
        note={alertCount === 0 ? "All items in date" : "Expiring soon"}
        tintClass={alertCount > 0 ? tierClasses("warning").fg : undefined}
      />
      <MetricValue
        label="Running low"
        icon={AlertTriangle}
        value={lowStockCount}
        note={
          lowStockCount === 0 ? "Above reorder points" : "At or below reorder"
        }
        tintClass={lowStockCount > 0 ? tierClasses("critical").fg : undefined}
      />
      <MetricValue
        label="Count drift"
        icon={Scale}
        value={discrepancyCount}
        note={
          discrepancyCount === 0
            ? "On hand matches actual"
            : "Needs reconciliation"
        }
        tintClass={discrepancyCount > 0 ? tierClasses("watch").fg : undefined}
      />
    </RxLabel>
  );
}
