"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/logo-mark";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      await signIn("password", {
        email: String(form.get("email")),
        password: String(form.get("password")),
        flow,
      });
      router.push("/");
    } catch {
      // errors suppressed
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] w-full md:grid-cols-2">
      {/*
        The brand carries the left panel on its own color, not a card on a
        canvas: gentian violet at full strength, the mark, and the tagline
        that's already on the app icon. Left plain on purpose — the ribbon
        mark's proportions (a deliberately tight gap between the cross and
        the loops, fine at icon size) don't hold up stretched into a large
        watermark, so the color carries the panel by itself instead.
      */}
      <div className="flex flex-col items-center justify-center gap-4 bg-primary px-8 py-10 text-center text-primary-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-4 motion-safe:duration-700 sm:py-12 md:items-start md:gap-5 md:px-16 md:py-0 md:text-left">
        <LogoMark className="h-12 w-12 shrink-0 md:h-14 md:w-14" />

        <div>
          <p className="font-display text-large-title font-semibold">MedMinder</p>
          <p className="mt-2 text-body text-primary-foreground/85">
            Track. Manage. Never Run Out.
          </p>
        </div>

        <p className="max-w-[30ch] text-body-sm text-primary-foreground/80">
          Stock, expiry, and reorder points — tracked in one place, with a
          weekly digest so nothing slips through.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-5 py-10 sm:px-8 sm:py-12">
        <div className="w-full max-w-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-700 motion-safe:delay-150">
          <h1 className="font-display text-title font-semibold">
            {flow === "signUp" ? "Create your account" : "Sign in"}
          </h1>
          <p className="mt-2 text-body text-muted-foreground">
            {flow === "signUp"
              ? "Each account gets its own private pharmacy inventory."
              : "Welcome back — pick up where you left off."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="label-field">Email</span>
              <Input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="pharmacist@example.com"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="label-field">Password</span>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    flow === "signUp" ? "new-password" : "current-password"
                  }
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeClosedIcon className="h-4 w-4" />
                  ) : (
                    <EyeOpenIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {flow === "signUp" && (
                <span className="text-footnote text-muted-foreground">
                  At least 10 characters.
                </span>
              )}
            </label>

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting
                ? "Working…"
                : flow === "signUp"
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setFlow(flow === "signUp" ? "signIn" : "signUp");
            }}
            className="mx-auto mt-6 block rounded-full px-3 py-2 text-body-sm text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {flow === "signUp"
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </main>
  );
}
