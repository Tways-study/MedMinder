import { redirect } from "next/navigation";

// A medicine opens in the Inventory page's side panel; this keeps old links alive.
export default async function MedicineRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/?m=${encodeURIComponent(id)}`);
}
