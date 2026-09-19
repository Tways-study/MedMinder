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
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-5 py-12">
      {/*
        Apple-ID-style: the mark, one line naming the task, and the form on a
        single white surface. No glow, no shadow — the frost canvas and the
        white panel are enough to say where to look.
      */}
      <div className="w-full max-w-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
        <div className="flex flex-col items-center gap-4 text-center">
          <LogoMark className="h-12 w-12" color="hsl(var(--primary))" />
          <div>
            <h1 className="font-display text-title font-semibold">
              {flow === "signUp" ? "Create your account" : "Sign in to MedMinder"}
            </h1>
            <p className="mx-auto mt-2 max-w-[32ch] text-body font-light text-muted-foreground">
              {flow === "signUp"
                ? "Each account gets its own private pharmacy inventory."
                : "Medicine inventory and expiry tracking for your pharmacy."}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 rounded-lg bg-card p-5 sm:p-6"
        >
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
    </main>
  );
}
