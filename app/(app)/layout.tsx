import { AppNav } from "@/components/app-nav";
import { UserMenu } from "@/components/UserMenu";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] sm:pl-56">
      <header className="flex items-center justify-between gap-4 px-5 pb-3 pt-5">
        {/*
          The wordmark used to reuse .label-field, the 11px uppercase caption
          class built for field names on a dispensing label. Right class,
          wrong job: a persistent header needs to read as a mark, not a caption.
        */}
        <Link
          href="/"
          className="focus-card font-display text-xl font-medium tracking-tight"
        >
          MedMinder
        </Link>
        <UserMenu />
      </header>

      {/* pb-20 clears the fixed bottom bar on a phone. */}
      <div className="pb-20 sm:pb-8">{children}</div>

      <AppNav />
    </div>
  );
}
