"use client";

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
  Pill,
  Scale,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SAMPLE_SHELF = [
  {
    name: "Amoxicillin 500 mg",
    meta: "Capsule · 42 on hand",
    tier: "critical",
  },
  {
    name: "Salbutamol inhaler",
    meta: "100 mcg · 3 on hand",
    tier: "low",
  },
  {
    name: "Paracetamol 500 mg",
    meta: "Tablet · 380 on hand",
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
  // Rendered after mount so server and client markup match.
  const [today, setToday] = useState<string | null>(null);
  const padRef = useRef<HTMLElement>(null);

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
      {/* Brand panel: what the product does, in the product's own label language. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,hsl(262_42%_20%)_0%,hsl(262_38%_30%)_55%,hsl(262_36%_38%)_100%)] p-12 text-white lg:flex xl:p-16">
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-8 select-none font-serif text-[26rem] leading-none text-white/[0.06]"
        >
          ℞
        </span>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(0_0%_100%/0.09)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom_right,black,transparent_70%)]"
        />

        <div data-brand className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/25">
            <Pill className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="font-serif text-2xl leading-none tracking-tight">
            MedMinder
          </span>
        </div>

        <div className="relative flex max-w-xl flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h2
              data-brand
              className="font-serif text-5xl leading-[1.05] tracking-tight xl:text-6xl"
            >
              Know what&rsquo;s on the shelf before it expires.
            </h2>
            <p data-brand className="max-w-md text-base text-white/80">
              Stock, expiry and reorder tracking for the dispensary. Every
              account keeps its own private shelf.
            </p>
          </div>

          <div
            data-brand
            aria-hidden
            className="max-w-md -rotate-1 rounded-lg bg-card text-card-foreground shadow-[0_24px_48px_-16px_hsl(262_60%_8%/0.55)]"
          >
            <div className="flex items-center justify-between px-4 py-2.5">
              <p className="label-caps flex items-center gap-2 text-foreground">
                <span className="font-serif text-base normal-case leading-none tracking-normal">
                  ℞
                </span>
                On the shelf
              </p>
              <p className="label-caps">Sample</p>
            </div>
            <div className="perforation" />
            <ul className="divide-y divide-dashed">
              {SAMPLE_SHELF.map((row) => (
                <li
                  key={row.name}
                  data-shelf-row
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-serif text-lg leading-tight">
                      {row.name}
                    </p>
                    <p className="label-caps mt-0.5 normal-case tracking-normal">
                      {row.meta}
                    </p>
                  </div>
                  <StampBadge
                    tier={row.tier}
                    size="sm"
                    seed={row.name}
                    animate
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ul className="relative grid grid-cols-3 gap-6 border-t border-white/15 pt-6">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} data-brand className="flex flex-col gap-1.5">
              <Icon className="size-5 text-white/90" aria-hidden />
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs leading-relaxed text-white/75">{body}</p>
            </li>
          ))}
        </ul>
      </aside>

      {/* Form side. */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-3xl"
        />

        <div className="relative w-full max-w-sm">
          <div
            data-pad
            className="rounded-lg border bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.05),0_24px_48px_-24px_hsl(262_38%_47%/0.35)]"
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
                  {today ?? " "}
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

              <form
                onSubmit={handleSubmit}
                className="mt-7 flex flex-col gap-4"
              >
                <div data-field className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="label-caps">
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
                  <label htmlFor="password" className="label-caps">
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
                    className="group w-full shadow-sm"
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
            className="mx-auto mt-5 block rounded-md px-3 py-2 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Open one"}
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Track. Manage. Never Run Out.
          </p>
        </div>
      </section>
    </main>
  );
}
