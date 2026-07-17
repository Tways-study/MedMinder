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
    <main className="grid min-h-[100dvh] w-full lg:grid-cols-2">
      {/*
        This is the app's only public-facing screen (no marketing site exists),
        so it's the one place a first impression happens. It previously used
        none of the apothecary system built for the rest of MedMinder, which is
        the real reason it read as bare: generic shadcn defaults, not a
        deliberately flat choice.

        The gradient is two shades already in the palette (orchid, amethyst),
        not an invented AI-purple glow: this app's purple carries specific
        intent (gentian violet, an actual pharmacy antiseptic dye), so a
        confident purple panel here is brand-consistent rather than a default.
      */}
      <div className="relative flex items-center overflow-hidden bg-primary px-8 py-12 text-primary-foreground lg:px-16 lg:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 12% 8%, hsl(var(--amethyst)) 0%, transparent 55%), radial-gradient(140% 110% at 100% 100%, hsl(var(--orchid)) 0%, transparent 60%)",
          }}
        />
        <div className="relative motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-4 motion-safe:duration-700">
          <LogoMark className="h-10 w-10 sm:h-11 sm:w-11" color="hsl(var(--paper))" />
          <p className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
            MedMinder
          </p>
          <p className="mt-3 max-w-[34ch] text-sm text-primary-foreground/85 sm:text-base">
            Medicine inventory and expiry tracking for community pharmacies.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 lg:py-16">
        <div className="w-full max-w-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
          <div className="rounded-lg border bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-2">
              {/*
                Names the task rather than repeating the wordmark: on mobile the
                brand banner above already shows "MedMinder" in the same
                viewport, so a second one here would be pure repetition.
              */}
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
                <span className="text-sm font-medium">Email</span>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={claimed === undefined}
                  className="h-11"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Password</span>
                <Input
                  name="password"
                  type="password"
                  autoComplete={
                    flow === "signUp" ? "new-password" : "current-password"
                  }
                  required
                  disabled={claimed === undefined}
                  className="h-11"
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
                {submitting
                  ? "Working…"
                  : flow === "signUp"
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
