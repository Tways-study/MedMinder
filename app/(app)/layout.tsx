"use client";

// <Authenticated>/<AuthLoading>/<Unauthenticated> read Convex's client-side
// auth context, so this layout needs a client boundary. Without it, Next
// bundles the context read into the server graph, where React's
// "react-server" export condition has no createContext — the build fails
// with "TypeError: d.createContext is not a function" while collecting page
// data, on whichever page the bundler happens to process first.
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
    <div className="min-h-[100dvh] md:pl-60">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Mobile top bar; on desktop the sidebar carries the brand and account. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur md:hidden">
        <Link
          href="/"
          className="focus-card -ml-1 flex items-center gap-2 rounded-md px-1 py-1"
        >
          <LogoMark className="size-7" />
          <span className="font-serif text-xl leading-none tracking-tight">
            MedMinder
          </span>
          <span
            aria-hidden
            className="font-serif text-base leading-none text-muted-foreground"
          >
            ℞
          </span>
        </Link>
        <UserMenu />
      </header>

      {/*
        Signing out flips Convex auth to unauthenticated before the redirect
        to /signin lands. Without this gate, the still-mounted page below
        keeps querying protected data, its requireAuth() calls throw, and
        the app crashes instead of just going blank for a beat.

        pb-24 clears the fixed bottom tab bar on a phone.
      */}
      <div
        id="main-content"
        tabIndex={-1}
        className="pb-24 outline-none md:pb-8"
      >
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
