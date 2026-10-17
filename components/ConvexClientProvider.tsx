"use client";

import { ScrollSync } from "@/components/scroll-sync";
import { Toaster } from "@/components/ui/sonner";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  verbose: process.env.NODE_ENV !== "production",
});

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <ScrollSync>{children}</ScrollSync>
      <Toaster richColors closeButton position="top-center" />
    </ConvexAuthNextjsProvider>
  );
}
