"use client";

import {
  MedicineForm,
  type MedicineFormValues,
} from "@/components/medicine-form";
import { QuantityStepper } from "@/components/quantity-stepper";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  type AlertTiers,
  expiryTier,
  formatExpiryDistance,
} from "@/convex/lib/inventory";
import { isLowStock } from "@/convex/lib/medicineFilters";
import { formatDate, formatForm, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Minus,
  PackageX,
  Pencil,
  Trash2,
} from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";

export type Medicine = Omit<Doc<"medicines">, "ownerId">;

export type DrawerState =
  | { kind: "view"; id: string; editing: boolean }
  | { kind: "add" }
  | null;

function isDuplicateError(
  err: unknown,
): err is ConvexError<{ code: string; name: string }> {
  return (
    err instanceof ConvexError &&
    typeof err.data === "object" &&
    err.data !== null &&
    (err.data as Record<string, unknown>).code === "DUPLICATE"
  );
}

/** Icon and word carry the meaning; colour only reinforces it. */
function varianceState(variance: number) {
  return variance > 0
    ? { cls: "text-tier-ok", label: "Surplus", icon: ArrowUpRight }
    : variance < 0
      ? { cls: "text-tier-critical", label: "Deficit", icon: ArrowDownRight }
      : { cls: "text-muted-foreground", label: "Balanced", icon: Minus };
}

export function MedicineDrawer({
  state,
  medicines,
  tiers,
  now,
  desktop,
  onClose,
  onEdit,
  onStopEdit,
  onSaved,
}: {
  state: DrawerState;
  /** The whole inventory; `undefined` while it loads. */
  medicines: Medicine[] | undefined;
  tiers: AlertTiers;
  now: number;
  desktop: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onStopEdit: (id: string) => void;
  /** After a create, so the page can open the new record. */
  onSaved: (id: Id<"medicines">) => void;
}) {
  const open = state !== null;
  const medicine =
    state?.kind === "view"
      ? medicines?.find((m) => m._id === state.id)
      : undefined;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} modal={!desktop}>
      <SheetContent
        modal={!desktop}
        belowTopBar
        // Beside the list the panel is a companion, not a modal: clicks on the
        // table and top bar must reach their targets instead of dismissing it.
        onInteractOutside={(e) => {
          if (desktop) e.preventDefault();
        }}
        onOpenAutoFocus={(e) => {
          // Land on the panel itself rather than a stepper that happens to be first.
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
        tabIndex={-1}
      >
        {state?.kind === "add" && (
          <AddPanel onClose={onClose} onSaved={onSaved} />
        )}

        {state?.kind === "view" && medicines === undefined && <PanelSkeleton />}

        {state?.kind === "view" && medicines !== undefined && !medicine && (
          <GonePanel onClose={onClose} />
        )}

        {state?.kind === "view" && medicine && state.editing && (
          <EditPanel
            medicine={medicine}
            onDone={() => onStopEdit(medicine._id)}
          />
        )}

        {state?.kind === "view" && medicine && !state.editing && (
          <ViewPanel
            medicine={medicine}
            tiers={tiers}
            now={now}
            onEdit={() => onEdit(medicine._id)}
            onDeleted={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PanelHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="shrink-0 border-b px-5 pb-4 pt-5 pr-14">
      <SheetTitle className="font-serif text-2xl font-medium leading-tight">
        {title}
      </SheetTitle>
      {description ? (
        <SheetDescription className="mt-1 text-sm text-muted-foreground">
          {description}
        </SheetDescription>
      ) : (
        <SheetDescription className="sr-only">{title}</SheetDescription>
      )}
      {children}
    </header>
  );
}

function PanelSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4 p-5">
      <SheetTitle className="sr-only">Loading medicine</SheetTitle>
      <SheetDescription className="sr-only">Loading</SheetDescription>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function GonePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-start gap-4 p-5 pr-14">
      <PackageX
        aria-hidden
        className="size-8 text-muted-foreground"
        strokeWidth={1.5}
      />
      <div>
        <SheetTitle className="font-serif text-2xl font-medium">
          That medicine is gone
        </SheetTitle>
        <SheetDescription className="mt-1 text-sm text-muted-foreground">
          It may have been removed on another device.
        </SheetDescription>
      </div>
      <Button variant="outline" onClick={onClose}>
        Back to inventory
      </Button>
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="label-caps">{label}</dt>
      <dd className="mt-1.5 text-sm">{children}</dd>
    </div>
  );
}

function ViewPanel({
  medicine,
  tiers,
  now,
  onEdit,
  onDeleted,
}: {
  medicine: Medicine;
  tiers: AlertTiers;
  now: number;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const remove = useMutation(api.medicines.remove);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const low = isLowStock(medicine);
  const tier =
    medicine.expiryDate === undefined
      ? null
      : expiryTier(medicine.expiryDate, now, tiers);
  const variance = medicine.actualQuantity - medicine.onHandQuantity;
  const vs = varianceState(variance);
  const VarianceIcon = vs.icon;
  const varianceStr =
    variance > 0 ? `+${formatQuantity(variance)}` : formatQuantity(variance);
  const meta = [medicine.strength, formatForm(medicine.form)]
    .filter(Boolean)
    .join(", ");
  const details: Array<[string, string]> = [
    ["Generic name", medicine.genericName],
    ["Category", medicine.category],
    ["SKU", medicine.sku],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  function closeConfirm() {
    setConfirming(false);
    setConfirmText("");
    setDeleteError(null);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await remove({ medicineId: medicine._id });
      toast.success(`${medicine.name} removed`);
      closeConfirm();
      onDeleted();
    } catch (err) {
      const message =
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : "Could not remove this medicine.";
      setDeleteError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PanelHeader title={medicine.name} description={meta || undefined}>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {tier ? (
            <StatusChip kind={tier} />
          ) : (
            <span className="text-xs text-muted-foreground">No expiry set</span>
          )}
          {low && <StatusChip kind="low" />}
        </div>
      </PanelHeader>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
          <Stat label="On hand">
            <QuantityStepper
              medicineId={medicine._id}
              kind="onHand"
              value={medicine.onHandQuantity}
              label={`${medicine.name} on hand`}
              compact
            />
          </Stat>
          <Stat label="Actual count">
            <QuantityStepper
              medicineId={medicine._id}
              kind="actual"
              value={medicine.actualQuantity}
              label={`${medicine.name} actual count`}
              compact
            />
          </Stat>

          <Stat label="Variance">
            <span className={cn("flex items-center gap-1.5", vs.cls)}>
              <VarianceIcon aria-hidden className="size-4" strokeWidth={1.75} />
              <span className="font-data">{varianceStr}</span>
              <span className="text-xs font-medium">{vs.label}</span>
            </span>
          </Stat>
          <Stat label="Reorder at">
            <span className="font-data">
              {formatQuantity(medicine.reorderPoint)}
            </span>
            {low && (
              <span className="mt-0.5 block text-xs text-tier-warning">
                At or below reorder point
              </span>
            )}
          </Stat>

          <Stat label="Expires">
            {medicine.expiryDate !== undefined ? (
              <>
                <span className="font-data">
                  {formatDate(medicine.expiryDate)}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {formatExpiryDistance(medicine.expiryDate, now)}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )}
          </Stat>
        </dl>

        {details.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t pt-5">
            {details.map(([label, value]) => (
              <Stat key={label} label={label}>
                <span className={label === "SKU" ? "font-data" : undefined}>
                  {value}
                </span>
              </Stat>
            ))}
          </dl>
        )}

        {medicine.notes && (
          <div className="mt-6 border-t pt-5">
            <h3 className="label-caps">Notes</h3>
            <p className="mt-1.5 whitespace-pre-wrap text-sm">
              {medicine.notes}
            </p>
          </div>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t px-5 py-3">
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirming(true)}
        >
          <Trash2 aria-hidden />
          Delete
        </Button>
        <Button variant="outline" onClick={onEdit}>
          <Pencil aria-hidden />
          Edit
        </Button>
      </footer>

      <Dialog
        open={confirming}
        onOpenChange={(o) => {
          if (!o && !deleting) closeConfirm();
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
              Type <span className="font-data">{medicine.name}</span> to confirm
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
              onClick={closeConfirm}
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
    </>
  );
}

function EditPanel({
  medicine,
  onDone,
}: {
  medicine: Medicine;
  onDone: () => void;
}) {
  const update = useMutation(api.medicines.update);
  return (
    <>
      <PanelHeader title="Edit medicine" description={medicine.name} />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <MedicineForm
          initial={medicine}
          submitLabel="Save changes"
          onCancel={onDone}
          onSubmit={async (values) => {
            try {
              await update({ medicineId: medicine._id, ...values });
            } catch (err) {
              toast.error("Could not save changes");
              throw err;
            }
            toast.success("Changes saved");
            onDone();
          }}
        />
      </div>
    </>
  );
}

function AddPanel({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (id: Id<"medicines">) => void;
}) {
  const create = useMutation(api.medicines.create);
  const pendingValuesRef = useRef<MedicineFormValues | null>(null);
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [forceSaving, setForceSaving] = useState(false);
  const [forceError, setForceError] = useState<string | null>(null);

  async function handleForceCreate() {
    if (!pendingValuesRef.current) return;
    setForceSaving(true);
    setForceError(null);
    try {
      const id = await create({ ...pendingValuesRef.current, force: true });
      setShowDialog(false);
      toast.success("Medicine added");
      onSaved(id);
    } catch (err) {
      setForceError(
        err instanceof ConvexError && typeof err.data === "string"
          ? err.data
          : "Could not add medicine. Please try again.",
      );
    } finally {
      setForceSaving(false);
    }
  }

  return (
    <>
      <PanelHeader
        title="Add medicine"
        description="Name it, set the stock and the expiry."
      />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <MedicineForm
          submitLabel="Add medicine"
          onCancel={onClose}
          onSubmit={async (values) => {
            try {
              const id = await create(values);
              toast.success("Medicine added");
              onSaved(id);
            } catch (err) {
              if (isDuplicateError(err)) {
                pendingValuesRef.current = values;
                setDuplicateName(err.data.name);
                setShowDialog(true);
              } else {
                throw err;
              }
            }
          }}
        />
      </div>

      <Dialog
        open={showDialog}
        onOpenChange={(o) => {
          setShowDialog(o);
          if (!o) setForceError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Already in your inventory</DialogTitle>
            <DialogDescription>
              A medicine named &ldquo;{duplicateName}&rdquo; already exists. Do
              you want to add it anyway?
            </DialogDescription>
          </DialogHeader>
          {forceError && (
            <p role="alert" className="text-sm text-destructive">
              {forceError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={forceSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleForceCreate} disabled={forceSaving}>
              {forceSaving && <Loader2 className="animate-spin" aria-hidden />}
              {forceSaving ? "Adding…" : "Add anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
