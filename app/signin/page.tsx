"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK, STAGGER } from "@/lib/motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Rendered after mount so server and client markup match.
  const [today, setToday] = useState<string | null>(null);
  const padRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToday(
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
        .format(new Date())
        .toUpperCase(),
    );
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out } });
        tl.from("[data-pad]", { y: 16, autoAlpha: 0, duration: DUR.enter });
        tl.from(
          "[data-field]",
          { y: 8, autoAlpha: 0, duration: DUR.base, stagger: STAGGER },
          "-=0.2",
        );
      });
      return () => mm.revert();
    },
    { scope: padRef },
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      await signIn("password", {
        email: String(form.get("email")),
        password: String(form.get("password")),
        flow,
      });
      router.push("/");
    } catch {
      setError(
        flow === "signUp"
          ? "Couldn't create your account. The email may already be registered, or the password is shorter than 10 characters."
          : "Invalid email or password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isSignUp = flow === "signUp";

  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div ref={padRef} className="relative w-full max-w-sm">
        <div
          data-pad
          className="rounded-lg border bg-card shadow-xs dark:shadow-none"
        >
          <div className="flex items-center justify-between gap-3 px-6 py-3 sm:px-8">
            <p className="label-caps flex items-center gap-2 text-foreground">
              <span
                aria-hidden
                className="font-serif text-lg normal-case leading-none tracking-normal"
              >
                ℞
              </span>
              MedMinder
            </p>
            <p className="label-caps tabular-nums">
              No. 0001
              <span className="ml-2 inline-block min-w-[6.5rem] text-right">
                {today ?? " "}
              </span>
            </p>
          </div>
          <div className="perforation" aria-hidden />

          <div className="p-6 sm:p-8">
            <h1 className="font-serif text-3xl leading-none sm:text-4xl">
              {isSignUp ? "Open an account" : "Sign in"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignUp
                ? "Each account keeps its own private shelf of medicines."
                : "Welcome back. Your shelf is as you left it."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div data-field className="flex flex-col gap-1.5">
                <label htmlFor="email" className="label-caps">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="pharmacist@example.com"
                  required
                />
              </div>

              <div data-field className="flex flex-col gap-1.5">
                <label htmlFor="password" className="label-caps">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isSignUp ? "new-password" : "current-password"
                    }
                    required
                    className="pr-11"
                    aria-describedby={isSignUp ? "password-hint" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
                {isSignUp && (
                  <p
                    id="password-hint"
                    className="text-xs text-muted-foreground"
                  >
                    At least 10 characters.
                  </p>
                )}
              </div>

              <div data-field>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting && (
                    <Loader2 className="animate-spin" aria-hidden />
                  )}
                  {submitting
                    ? isSignUp
                      ? "Creating account…"
                      : "Signing in…"
                    : isSignUp
                      ? "Create account"
                      : "Sign in"}
                </Button>
              </div>

              <div role="alert">
                {error && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
            </form>
          </div>

          <div className="px-6 pb-5 sm:px-8">
            <div className="border-t border-dashed border-border pt-2">
              <p className="label-caps">Dispensed by MedMinder</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFlow(isSignUp ? "signIn" : "signUp");
            setError(null);
          }}
          className="mx-auto mt-4 block rounded-md px-3 py-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Open one"}
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Track. Manage. Never Run Out.
        </p>
      </div>
    </main>
  );
}
