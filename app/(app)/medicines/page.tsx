import { redirect } from "next/navigation";

// Inventory now lives at "/". Kept so old links and bookmarks still land there.
export default function MedicinesRedirect() {
  redirect("/");
}
