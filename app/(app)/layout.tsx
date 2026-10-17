"use client";

// <Authenticated>/<AuthLoading>/<Unauthenticated> read Convex's client-side
// auth context, so this layout needs a client boundary. Without it, Next
// bundles the context read into the server graph, where React's
// "react-server" export condition has no createContext — the build fails
// with "TypeError: d.createContext is not a function" while collecting page
// data, on whichever page the bundler happens to process first.
import { AppShell } from "@/components/app-shell";
import { CardSkeleton, Page } from "@/components/page-shell";
import { RedirectToSignIn } from "@/components/redirect-to-sign-in";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
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
    </AppShell>
  );
}
