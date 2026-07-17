"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { LogoMark } from "@/components/logo-mark";
import { Glow } from "@/components/ui/glow";
import { ArrowRightIcon } from "@radix-ui/react-icons";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const claimed = useQuery(api.users.isClaimed);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Until we know whether an account exists, we can't tell the pharmacist
  // whether she's setting up or signing in.
  const flow = claimed === false ? "signUp" : "signIn";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      await signIn("password", {
        email: String(form.get("email")),
        password: String(form.get("password")),
        flow,
      });
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : flow === "signUp"
            ? "Could not create the account. Check the details and try again."
            : "That email and password don't match an account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/*
        Previously a two-panel split: a solid purple hero block plus a
        separate white card. The glow sat on top of that same purple, so it
        barely read as an effect: a purple bloom on a purple field. On the
        page's own light background, the same bloom is a distinct, visible
        event, which is the point of using it. One card now carries the whole
        screen, and the glow lives in the space around it, the way the
        component's own reference usage does.

        The two ring circles from the split-panel version are gone: with the
        glow finally visible for what it is, adding a second decorative
        device on top would be competing for the same attention, not adding
        to it.
      */}
      <Glow
        variant="center"
        aria-hidden
        className="pointer-events-none opacity-80 blur-3xl"
      />

      <div className="relative w-full max-w-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-700">
        <div className="rounded-lg border bg-card p-6 shadow-lg shadow-primary/10 sm:p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <LogoMark className="h-11 w-11" color="hsl(var(--primary))" />
            <div>
              <p className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
                MedMinder
              </p>
              <p className="mx-auto mt-2 max-w-[30ch] text-sm text-muted-foreground">
                Medicine inventory and expiry tracking for community
                pharmacies.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t pt-6">
            {/* Names the task: the brand block above already said who this is. */}
            <h1 className="min-h-8 font-display text-xl font-medium tracking-tight">
              {claimed === undefined
                ? " "
                : flow === "signUp"
                  ? "Set up your account"
                  : "Sign in"}
            </h1>
            <p className="min-h-10 text-sm text-muted-foreground">
              {claimed === undefined
                ? " "
                : flow === "signUp"
                  ? "This is a single-account app, so the first account claims it."
                  : "Enter your pharmacy inventory."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="label-field">Email</span>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="pharmacist@example.com"
                required
                disabled={claimed === undefined}
                className="h-11 border-transparent bg-secondary placeholder:text-muted-foreground"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="label-field">Password</span>
              <Input
                name="password"
                type="password"
                autoComplete={
                  flow === "signUp" ? "new-password" : "current-password"
                }
                required
                disabled={claimed === undefined}
                className="h-11 border-transparent bg-secondary"
              />
              {flow === "signUp" && (
                <span className="text-xs text-muted-foreground">
                  At least 10 characters.
                </span>
              )}
            </label>

            {error !== null && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting || claimed === undefined}
              className="h-11"
            >
              {submitting ? (
                "Working…"
              ) : flow === "signUp" ? (
                "Create account"
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Sign in
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
