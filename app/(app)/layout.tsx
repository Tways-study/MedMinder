import { AppNav } from "@/components/app-nav";
import { LogoMark } from "@/components/logo-mark";
import { CardSkeleton, Page } from "@/components/page-shell";
import { RedirectToSignIn } from "@/components/redirect-to-sign-in";
import { UserMenu } from "@/components/UserMenu";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] sm:pl-56">
      {/*
        A translucent bar pinned to the top: content scrolls under it and stays
        faintly visible, so the page never feels cut off by chrome.
      */}
      <header className="material sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-2">
        <Link
          href="/"
          className="focus-card flex items-center gap-2 rounded-full py-1 pr-2 text-body font-semibold"
        >
          <LogoMark className="h-6 w-6" color="hsl(var(--primary))" />
          MedMinder
        </Link>
        <UserMenu />
      </header>

      {/*
        Signing out flips Convex auth to unauthenticated before the redirect
        to /signin lands. Without this gate, the still-mounted page below
        keeps querying protected data, its requireAuth() calls throw, and
        the app crashes instead of just going blank for a beat.

        pb-20 clears the fixed bottom bar on a phone.
      */}
      <div className="pb-20 sm:pb-8">
        <AuthLoading>
          <Page>
            <CardSkeleton />
          </Page>
        </AuthLoading>
        <Authenticated>{children}</Authenticated>
        <Unauthenticated>
          <RedirectToSignIn />
        </Unauthenticated>
      </div>

      {/* The nav queries nothing, so it stays put outside the auth gate. */}
      <AppNav />
    </div>
  );
}
