"use client";

import { MedicineForm } from "@/components/medicine-form";
import { FadeSlideIn } from "@/components/motion";
import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { LabelField, RxLabel } from "@/components/rx-label";
import { StampBadge } from "@/components/stamp-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  DEFAULT_ALERT_TIERS,
  expiryTier,
  formatExpiryDistance,
} from "@/convex/lib/inventory";
import { formatDate, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  Loader2,
  Minus,
  MoreHorizontal,
  Pencil,
  PackageX,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/** Icon and word carry the meaning; colour only reinforces it. */
function varianceState(variance: number) {
  return variance > 0
    ? { cls: "text-tier-ok", label: "Surplus", icon: ArrowUpRight }
    : variance < 0
      ? { cls: "text-tier-critical", label: "Deficit", icon: ArrowDownRight }
      : { cls: "text-muted-foreground", label: "Balanced", icon: Minus };
}

export default function MedicineDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const medicineId = params.id as Id<"medicines">;

  const medicine = useQuery(api.medicines.get, { medicineId });
  const settings = useQuery(api.settings.get);
  const update = useMutation(api.medicines.update);
  const remove = useMutation(api.medicines.remove);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // `deleting` stays true after our own delete commits, so the query going
  // null mid-navigation shows the skeleton rather than "That medicine is gone".
  if (medicine === undefined || (medicine === null && deleting)) {
    return (
      <Page>
        <CardSkeleton count={4} />
      </Page>
    );
  }

  if (medicine === null) {
    return (
      <Page>
        <EmptyState
          icon={PackageX}
          title="That medicine is gone"
          description="It may have been removed on another device."
          action={
            <Button asChild variant="outline">
              <Link href="/medicines">Back to medicines</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  const backLink = (
    <Link
      href="/medicines"
      className="-ml-1 inline-flex w-fit items-center gap-0.5 rounded-sm px-1 py-0.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronLeft aria-hidden className="size-4" />
      Medicines
    </Link>
  );

  if (editing) {
    return (
      <Page>
        <div className="flex flex-col gap-3">
          {backLink}
          <PageHeader
            eyebrow="Amend entry"
            title="Edit medicine"
            description={medicine.name}
          />
        </div>
        <FadeSlideIn>
          <section className="max-w-3xl rounded-lg border bg-card text-card-foreground shadow-xs dark:shadow-none">
            <header className="flex items-center gap-2.5 px-5 py-3 sm:px-6">
              <span aria-hidden className="font-serif text-2xl leading-none text-primary">
                ℞
              </span>
              <p className="label-caps">Amend entry</p>
            </header>
            <div className="perforation" aria-hidden />
            <div className="p-5 sm:p-6">
              <MedicineForm
                initial={medicine}
                submitLabel="Save changes"
                onCancel={() => setEditing(false)}
                onSubmit={async (values) => {
                  try {
                    await update({ medicineId, ...values });
                  } catch (err) {
                    toast.error("Could not save changes");
                    throw err;
                  }
                  toast.success("Changes saved");
                  setEditing(false);
                }}
              />
            </div>
          </section>
        </FadeSlideIn>
      </Page>
    );
  }

  const low = medicine.onHandQuantity <= medicine.reorderPoint;
  const variance = medicine.actualQuantity - medicine.onHandQuantity;
  const tier =
    medicine.expiryDate === undefined
      ? null
      : expiryTier(
          medicine.expiryDate,
          Date.now(),
          settings?.alertTiers ?? DEFAULT_ALERT_TIERS,
        );
  const eyebrow = [medicine.strength, medicine.form]
    .filter(Boolean)
    .join(" · ");
  const shortId = medicine._id.slice(-6).toUpperCase();
  const footer = [
    medicine.genericName,
    medicine.category,
    medicine.sku ? `SKU ${medicine.sku}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
  const vs = varianceState(variance);
  const VarianceIcon = vs.icon;
  const varianceStr =
    variance > 0 ? `+${formatQuantity(variance)}` : formatQuantity(variance);
  const nowMs = Date.now();

  function closeDeleteDialog() {
    setConfirmingDelete(false);
    setConfirmText("");
    setDeleteError(null);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await remove({ medicineId });
      toast.success(`${medicine!.name} removed`);
      router.push("/medicines");
    } catch (err) {
      const message =
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : "Could not remove this medicine.";
      setDeleteError(message);
      toast.error(message);
      setDeleting(false);
    }
  }

  return (
    <Page>
      <h1 className="sr-only">{medicine.name}</h1>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {backLink}
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setConfirmingDelete(true)}
              >
                <Trash2 aria-hidden className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <FadeSlideIn>
        <RxLabel
          density="card"
          eyebrow={eyebrow ? `${eyebrow} · ℞ No. ${shortId}` : `℞ No. ${shortId}`}
          title={medicine.name}
          right={
            <div className="flex flex-col items-end gap-2">
              {tier && (
                <StampBadge
                  tier={tier}
                  label={tier === "ok" ? "In date" : undefined}
                  size="md"
                  seed={medicine._id}
                  animate
                />
              )}
              {low && (
                <StampBadge
                  tier="low"
                  size="md"
                  seed={`${medicine._id}-low`}
                  animate
                />
              )}
            </div>
          }
          footer={footer || undefined}
        >
          <LabelField
            label="Qty on hand"
            value={
              <>
                {formatQuantity(medicine.onHandQuantity)}
                {low && (
                  <span className="mt-0.5 block text-2xs text-tier-warning">
                    At or below reorder point
                  </span>
                )}
              </>
            }
          />
          <LabelField
            label="Actual count"
            value={formatQuantity(medicine.actualQuantity)}
          />
          <LabelField
            label="Variance"
            value={
              <span className={cn("block", vs.cls)}>
                {varianceStr}
                <span className="mt-0.5 flex items-center gap-1 text-2xs font-medium">
                  <VarianceIcon aria-hidden className="size-3.5" />
                  {vs.label}
                </span>
              </span>
            }
          />
          <LabelField
            label="Expires"
            value={
              medicine.expiryDate !== undefined ? (
                <>
                  {formatDate(medicine.expiryDate)}
                  <span className="mt-0.5 block text-2xs text-muted-foreground">
                    {formatExpiryDistance(medicine.expiryDate, nowMs)}
                  </span>
                </>
              ) : (
                "—"
              )
            }
          />
          <LabelField
            label="Reorder at"
            value={formatQuantity(medicine.reorderPoint)}
          />
          <LabelField
            label="Form"
            value={medicine.form}
            mono={false}
            className="capitalize"
          />
          {medicine.strength && (
            <LabelField label="Strength" value={medicine.strength} />
          )}
        </RxLabel>
      </FadeSlideIn>

      {medicine.notes && (
        <FadeSlideIn delay={0.1}>
          <section className="rounded-lg border bg-card text-card-foreground shadow-xs dark:shadow-none">
            <h2 className="label-caps px-4 py-3">Notes</h2>
            <div className="perforation" aria-hidden />
            <p className="whitespace-pre-wrap px-4 py-3 text-sm">
              {medicine.notes}
            </p>
          </section>
        </FadeSlideIn>
      )}

      <Dialog
        open={confirmingDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) closeDeleteDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {medicine.name}?</DialogTitle>
            <DialogDescription>
              This removes the medicine and its stock numbers. It cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              Type <span className="font-data">{medicine.name}</span> to
              confirm
            </span>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              aria-invalid={deleteError ? true : undefined}
            />
          </label>
          {deleteError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText.trim() !== medicine.name || deleting}
              onClick={handleDelete}
            >
              {deleting && <Loader2 className="animate-spin" aria-hidden />}
              {deleting ? "Deleting…" : "Delete medicine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
