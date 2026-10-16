"use client";

import { LogoMark } from "@/components/logo-mark";
import { StampBadge } from "@/components/stamp-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK, STAGGER } from "@/lib/motion";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ArrowRight,
  CalendarClock,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Scale,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const SAMPLE_SHELF = [
  {
    name: "Amoxicillin 500 mg",
    meta: "Capsule, 42 on hand",
    tier: "critical",
  },
  {
    name: "Salbutamol inhaler",
    meta: "100 mcg, 3 on hand",
    tier: "low",
  },
  {
    name: "Paracetamol 500 mg",
    meta: "Tablet, 380 on hand",
    tier: "ok",
  },
] as const;

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Expiry tiers",
    body: "Warnings that start early and escalate.",
  },
  {
    icon: Scale,
    title: "Book vs. counted",
    body: "See drift against your last physical count.",
  },
  {
    icon: MailCheck,
    title: "Weekly digest",
    body: "A summary in your inbox, on your schedule.",
  },
] as const;

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const padRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: EASE.out } });
        tl.from("[data-brand]", {
          y: 12,
          autoAlpha: 0,
          duration: DUR.enter,
          stagger: STAGGER * 2,
        });
        tl.from(
          "[data-shelf-row]",
          { x: -10, autoAlpha: 0, duration: DUR.base, stagger: STAGGER * 2 },
          "-=0.25",
        );
        tl.from("[data-pad]", { y: 16, autoAlpha: 0, duration: DUR.enter }, 0);
        tl.from(
          "[data-field]",
          { y: 8, autoAlpha: 0, duration: DUR.base, stagger: STAGGER },
          DUR.enter - 0.2,
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
    <main
      ref={padRef}
      className="grid min-h-[100dvh] w-full bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
    >
      {/* Brand panel: solid gentian ink, with a sample record in the product's own label language. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[hsl(262_38%_15%)] p-12 text-white lg:flex xl:p-16">
        <div data-brand className="flex items-center gap-3">
          <LogoMark className="size-9 ring-1 ring-white/25" />
          <span className="font-serif text-3xl font-medium leading-none">
            MedMinder
          </span>
        </div>

        <div className="flex max-w-xl flex-col gap-10">
          <div className="flex flex-col gap-5">
            <h2
              data-brand
              className="font-serif text-5xl font-medium leading-[1.08] xl:text-6xl xl:leading-[1.06]"
            >
              Know what&rsquo;s on the shelf{" "}
              <em className="pb-1 font-normal italic text-[hsl(262_60%_85%)]">
                before it expires.
              </em>
            </h2>
            <p
              data-brand
              className="max-w-md text-base leading-relaxed text-white/80"
            >
              Stock, expiry and reorder tracking for the dispensary. Every
              account keeps its own private shelf.
            </p>
          </div>

          <div
            data-brand
            aria-hidden
            className="max-w-md rounded-lg bg-card text-card-foreground shadow-[0_28px_56px_-20px_hsl(262_60%_4%/0.7)]"
          >
            <div className="flex items-center gap-2.5 px-4 py-3">
              <span className="font-serif text-xl leading-none text-primary">
                ℞
              </span>
              <p className="font-serif text-xl font-medium leading-none">
                On the shelf
              </p>
            </div>
            <div className="card-divider" />
            <ul className="divide-y divide-dashed">
              {SAMPLE_SHELF.map((row) => (
                <li
                  key={row.name}
                  data-shelf-row
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-medium leading-tight">
                      {row.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.meta}
                    </p>
                  </div>
                  <StampBadge tier={row.tier} size="sm" seed={row.name} animate />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="grid gap-3 border-t border-white/15 pt-6">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} data-brand className="flex items-baseline gap-3">
              <Icon
                className="size-4 shrink-0 translate-y-0.5 text-[hsl(262_60%_85%)]"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="text-sm text-white/75">
                <span className="font-medium text-white">{title}.</span> {body}
              </p>
            </li>
          ))}
        </ul>
      </aside>

      {/* Form side. */}
      <section className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div
            data-pad
            className="rounded-lg border bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.05),0_24px_48px_-28px_hsl(262_38%_30%/0.35)]"
          >
            <div className="flex items-center gap-2.5 px-6 py-4 sm:px-8">
              <LogoMark className="size-7" />
              <p className="font-serif text-2xl font-medium leading-none">
                MedMinder
              </p>
            </div>
            <div className="card-divider" aria-hidden />

            <div className="p-6 sm:p-8">
              <h1 className="font-serif text-4xl font-medium leading-none">
                {isSignUp ? "Open an account" : "Sign in"}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {isSignUp
                  ? "Each account keeps its own private shelf of medicines."
                  : "Welcome back. Your shelf is as you left it."}
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-7 flex flex-col gap-4"
              >
                <div data-field className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="pharmacist@example.com"
                      required
                      className="pl-9"
                    />
                  </div>
                </div>

                <div data-field className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        isSignUp ? "new-password" : "current-password"
                      }
                      required
                      className="pl-9 pr-11"
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

                <div data-field className="pt-1">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="group w-full"
                  >
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
                    {!submitting && (
                      <ArrowRight
                        className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                        aria-hidden
                      />
                    )}
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
          </div>

          <button
            type="button"
            onClick={() => {
              setFlow(isSignUp ? "signIn" : "signUp");
              setError(null);
            }}
            className="mx-auto mt-5 block rounded-md px-3 py-2.5 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "New here? Open an account"}
          </button>
        </div>
      </section>
    </main>
  );
}
