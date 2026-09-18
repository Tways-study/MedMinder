import { AppNav } from "@/components/app-nav";
import { LogoMark } from "@/components/logo-mark";
import { CardSkeleton, Page } from "@/components/page-shell";
import { RedirectToSignIn } from "@/components/redirect-to-sign-in";
import { Glow } from "@/components/ui/glow";
import { UserMenu } from "@/components/UserMenu";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] sm:pl-56">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <Glow variant="top" className="opacity-20 blur-3xl" />
      </div>
      <header className="flex items-center justify-between gap-4 px-5 pb-3 pt-5">
        {/*
          The wordmark used to reuse .label-field, the 11px uppercase caption
          class built for field names on a dispensing label. Right class,
          wrong job: a persistent header needs to read as a mark, not a caption.
        */}
        <Link
          href="/"
          className="focus-card flex items-center gap-2 font-display text-xl font-medium tracking-tight"
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
