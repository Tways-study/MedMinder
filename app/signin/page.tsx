"use client";

import { DemoVideo } from "@/components/demo-video";
import { LandingShelf, PillField } from "@/components/landing-shelf";
import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExpandCollapse, useAlertIn } from "@/components/motion";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
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
  const errorRef = useRef<HTMLParagraphElement>(null);
  const firstFlow = useRef(true);

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
          "[data-pad]",
          { y: 16, autoAlpha: 0, duration: DUR.enter },
          0.18,
        );
        tl.from(
          "[data-field]",
          { y: 8, autoAlpha: 0, duration: DUR.base, stagger: STAGGER },
          DUR.enter - 0.1,
        );

        // Ambient: the pill field drifts one tile, seamlessly, over a minute.
        gsap.to("[data-drift]", {
          x: -96,
          y: -96,
          duration: 70,
          ease: "none",
          repeat: -1,
        });

        // The sample shelf and feature list wait for the form to land (on a
        // phone they sit below the fold and wait to be reached).
        const below = gsap.utils.toArray<HTMLElement>("[data-below]");
        if (below.length) {
          gsap.set(below, { y: 14, autoAlpha: 0 });
          const reveal = (batch: Element[]) =>
            gsap.to(batch, {
              y: 0,
              autoAlpha: 1,
              duration: DUR.enter,
              ease: EASE.out,
              delay: 0.25,
              stagger: STAGGER * 2,
              overwrite: "auto",
              clearProps: "transform,opacity,visibility",
            });
          ScrollTrigger.batch(below, {
            start: "top 94%",
            once: true,
            onEnter: reveal,
            onLeave: reveal,
          });
        }
      });
      return () => mm.revert();
    },
    { scope: padRef },
  );

  // Sign in <-> Open an account: the changed words rise in, so the swap reads
  // as a state change rather than a flicker. Not on first render.
  useGSAP(
    () => {
      if (firstFlow.current) {
        firstFlow.current = false;
        return;
      }
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-flow-swap]",
          { y: 6, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: DUR.base,
            ease: EASE.out,
            stagger: 0.04,
            clearProps: "transform,opacity,visibility",
          },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [flow], scope: padRef },
  );

  // A failed attempt: the message drops in and the card gives one short
  // sideways nudge, the way a rejected form says no.
  useAlertIn(errorRef, error !== null);
  useGSAP(
    () => {
      if (error === null) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-pad]",
          { x: 0 },
          {
            keyframes: { x: [-6, 5, -3, 0] },
            duration: 0.32,
            ease: "none",
            clearProps: "transform",
          },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [error], scope: padRef },
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const { signingIn } = await signIn("password", {
        email: String(form.get("email")),
        password: String(form.get("password")),
        flow,
      });
      // A resolved signIn that did not sign in is a failure too; without this
      // the push to "/" is bounced back by middleware and nothing is shown.
      if (!signingIn) throw new Error("Not signed in");
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
      className="relative min-h-[100dvh] overflow-hidden bg-landing px-4 py-10 text-primary-foreground sm:px-8 sm:py-14 lg:flex lg:items-center"
    >
      <PillField />

      <div className="relative mx-auto grid w-full max-w-6xl gap-14 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:items-center lg:gap-16 xl:gap-24">
        {/* The promise and the form, on one axis. */}
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 text-center lg:mx-0 lg:max-w-none lg:items-start lg:text-left">
          <div data-brand className="flex items-center gap-3">
            <LogoMark className="size-9 ring-1 ring-primary-foreground/25" />
            <span className="font-serif text-3xl font-medium leading-none">
              MedMinder
            </span>
          </div>

          <div className="flex flex-col items-center gap-4 lg:items-start">
            <p
              data-brand
              className="font-serif text-4xl font-medium leading-[1.1] sm:text-5xl"
            >
              Know what&rsquo;s on the shelf{" "}
              <em className="pb-1 font-normal italic text-landing-ink">
                before it expires.
              </em>
            </p>
            <p
              data-brand
              className="max-w-sm text-base leading-relaxed text-primary-foreground/80"
            >
              Stock, expiry and reorder tracking for the dispensary. Every
              account keeps its own private shelf.
            </p>
          </div>

          <div
            data-pad
            className="w-full max-w-md rounded-lg bg-card text-left text-card-foreground shadow-landing"
          >
            <div className="px-6 py-5 text-center sm:px-8">
              <h1
                data-flow-swap
                className="font-serif text-4xl font-medium leading-none"
              >
                {isSignUp ? "Open an account" : "Sign in"}
              </h1>
              <p data-flow-swap className="mt-3 text-sm text-muted-foreground">
                {isSignUp
                  ? "Each account keeps its own private shelf of medicines."
                  : "Welcome back. Your shelf is as you left it."}
              </p>
            </div>
            <div className="card-divider" aria-hidden />

            <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  <ExpandCollapse open={isSignUp}>
                    <p
                      id="password-hint"
                      className="pt-0.5 text-xs text-muted-foreground"
                    >
                      At least 10 characters.
                    </p>
                  </ExpandCollapse>
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
                    <p
                      ref={errorRef}
                      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
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
            className="-mt-2 rounded-md lg:-ml-3 px-3 py-2.5 text-sm font-medium text-landing-ink-strong underline underline-offset-4 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "New here? Open an account"}
          </button>
        </div>

        {/* What a shelf looks like, and what the app does. */}
        <div className="mx-auto flex w-full max-w-md flex-col gap-8 border-t border-primary-foreground/15 pt-12 lg:max-w-xl lg:border-t-0 lg:pt-0">
          <LandingShelf />

          <ul className="grid gap-4 text-left">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} data-below className="flex items-baseline gap-3">
                <Icon
                  className="size-4 shrink-0 translate-y-0.5 text-landing-ink"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="text-sm text-primary-foreground/75">
                  <span className="font-medium text-primary-foreground">
                    {title}.
                  </span>{" "}
                  {body}
                </p>
              </li>
            ))}
          </ul>

          <DemoVideo />
        </div>
      </div>
    </main>
  );
}
