"use client";

import { MedicineForm, type MedicineFormValues } from "@/components/medicine-form";
import { Page, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { ConvexError } from "convex/values";
import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

function isDuplicateError(err: unknown): err is ConvexError<{ code: string; name: string }> {
  return (
    err instanceof ConvexError &&
    typeof err.data === "object" &&
    err.data !== null &&
    (err.data as Record<string, unknown>).code === "DUPLICATE"
  );
}

export default function NewMedicinePage() {
  const router = useRouter();
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
      router.push(`/medicines/${id}`);
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
    <Page>
      <PageHeader
        title="Add medicine"
        subtitle="Lots and expiry dates come in later, with each delivery."
      />
      <MedicineForm
        submitLabel="Add medicine"
        onCancel={() => router.back()}
        onSubmit={async (values) => {
          try {
            const id = await create(values);
            router.push(`/medicines/${id}`);
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

      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setForceError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Already in your inventory</DialogTitle>
            <DialogDescription>
              A medicine named &ldquo;{duplicateName}&rdquo; already exists. Do you want to add it
              anyway?
            </DialogDescription>
          </DialogHeader>
          {forceError && (
            <p role="alert" className="text-sm text-destructive">
              {forceError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={forceSaving}>
              Cancel
            </Button>
            <Button onClick={handleForceCreate} disabled={forceSaving}>
              {forceSaving ? "Adding…" : "Add anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
