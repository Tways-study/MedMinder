import { AppNav } from "@/components/app-nav";
import { UserMenu } from "@/components/UserMenu";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] sm:pl-56">
      <header className="flex items-center justify-between gap-4 px-5 pb-2 pt-5">
        <p className="label-field">MedMinder</p>
        <UserMenu />
      </header>

      {/* pb-20 clears the fixed bottom bar on a phone. */}
      <div className="pb-20 sm:pb-8">{children}</div>

      <AppNav />
    </div>
  );
}
