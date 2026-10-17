import { redirect } from "next/navigation";

// Adding a medicine is a panel on the Inventory page now.
export default function NewMedicineRedirect() {
  redirect("/?add=1");
}
