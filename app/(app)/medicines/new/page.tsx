"use client";

import { MedicineForm } from "@/components/medicine-form";
import { Page, PageHeader } from "@/components/page-shell";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";

export default function NewMedicinePage() {
  const router = useRouter();
  const create = useMutation(api.medicines.create);

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
          const id = await create(values);
          router.push(`/medicines/${id}`);
        }}
      />
    </Page>
  );
}
