"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

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
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">MedMinder</h1>
        <p className="text-sm text-muted-foreground">
          {claimed === undefined
            ? " "
            : flow === "signUp"
              ? "Set up the pharmacy account. This is a single-account app — the first account claims it."
              : "Sign in to your pharmacy inventory."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={claimed === undefined}
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

        <Button type="submit" disabled={submitting || claimed === undefined}>
          {submitting
            ? "Working…"
            : flow === "signUp"
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
