"use client";

import { DemoVideo } from "@/components/demo-video";
import { LandingShelf } from "@/components/landing-shelf";
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
  ShieldCheck,
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

const headerLink =
  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const footerLink =
  "flex min-h-11 w-fit items-center rounded-md text-sm text-muted-foreground sm:min-h-8 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const PRIVACY = [
  {
    title: "What we store",
    body: "Your email, a hashed password, and the medicine records you add: names, strengths, quantities, expiry dates and notes. MedMinder has no place for patient details, so keep them out of notes.",
  },
  {
    title: "Private by account",
    body: "Every record belongs to the account that created it. No other account can see your shelf.",
  },
  {
    title: "Email",
    body: "We use your email to sign you in. If you turn on the weekly digest, it goes only to the addresses you enter in settings.",
  },
] as const;

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();

  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const accessRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const firstFlow = useRef(true);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // The one authored entrance: the hero lands top to bottom, then the
        // film settles in beside it.
        const tl = gsap.timeline({ defaults: { ease: EASE.out } });
        tl.from("[data-hero]", {
          y: 12,
          autoAlpha: 0,
          duration: DUR.enter,
          stagger: STAGGER * 2,
        });
        tl.from(
          "[data-hero-media]",
          { y: 16, autoAlpha: 0, duration: DUR.enter },
          0.2,
        );

        // Everything below the hero waits to be reached.
        const below = gsap.utils.toArray<HTMLElement>("[data-below]");
        if (below.length) {
          gsap.set(below, { y: 14, autoAlpha: 0 });
          const reveal = (batch: Element[]) =>
            gsap.to(batch, {
              y: 0,
              autoAlpha: 1,
              duration: DUR.enter,
              ease: EASE.out,
              delay: 0.15,
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

  // Either hero door picks its flow, brings the form into view and puts the
  // caret in the email field so the visitor can start typing.
  function openAccess(
    event: React.MouseEvent<HTMLAnchorElement>,
    next: "signIn" | "signUp",
  ) {
    event.preventDefault();
    setFlow(next);
    setError(null);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    accessRef.current?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
    window.setTimeout(
      () => emailRef.current?.focus({ preventScroll: true }),
      reduced ? 0 : 600,
    );
  }

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
    <div
      ref={padRef}
      className="relative overflow-hidden bg-background text-foreground"
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <header
        data-hero
        className="sticky top-0 z-40 border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="font-serif text-2xl font-medium leading-none">
              MedMinder
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <nav
              aria-label="Primary"
              className="mr-2 hidden items-center md:flex"
            >
              <a href="#features" className={headerLink}>
                Features
              </a>
              <a href="#privacy" className={headerLink}>
                Data privacy
              </a>
            </nav>
            <Button asChild variant="ghost">
              <a href="#access" onClick={(e) => openAccess(e, "signIn")}>
                Sign in
              </a>
            </Button>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <a href="#access" onClick={(e) => openAccess(e, "signUp")}>
                Open an account
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero: what this is, and two equal doors in. */}
        <section
          aria-labelledby="hero-title"
          className="relative px-4 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 py-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,7fr)] lg:gap-14 lg:py-24">
            <div className="flex flex-col items-start gap-6 lg:gap-8">
              <h1
                id="hero-title"
                data-hero
                className="text-balance font-serif text-4xl font-medium leading-[1.08] sm:text-5xl lg:text-6xl"
              >
                Know what&rsquo;s on the shelf{" "}
                <em className="pb-1 font-normal italic">before it expires.</em>
              </h1>
              <p
                data-hero
                className="max-w-md text-base leading-relaxed text-muted-foreground lg:text-lg"
              >
                Stock, expiry and reorder tracking for the dispensary. Every
                account keeps its own private shelf.
              </p>
              <div
                data-hero
                className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto sm:min-w-44"
                >
                  <a href="#access" onClick={(e) => openAccess(e, "signIn")}>
                    Sign in
                    <ArrowRight className="size-4" aria-hidden />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto sm:min-w-44"
                >
                  <a href="#access" onClick={(e) => openAccess(e, "signUp")}>
                    Open an account
                  </a>
                </Button>
              </div>
            </div>

            <div data-hero-media className="w-full">
              <DemoVideo />
            </div>
          </div>
        </section>

        {/* Proof: the shelf doing its job, and what else it does. */}
        <section
          id="features"
          aria-labelledby="proof-title"
          className="relative border-t px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
            <div className="flex flex-col gap-10">
              <h2
                id="proof-title"
                data-below
                className="text-balance font-serif text-3xl font-medium leading-[1.15] sm:text-4xl"
              >
                Every lot is stamped by how close it is to expiring.
              </h2>
              <ul className="grid gap-6">
                {FEATURES.map(({ icon: Icon, title, body }) => (
                  <li
                    key={title}
                    data-below
                    className="flex items-baseline gap-4"
                  >
                    <Icon
                      className="size-5 shrink-0 translate-y-1 text-primary"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {title}.
                      </span>{" "}
                      {body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div data-below className="w-full">
              <LandingShelf />
            </div>
          </div>
        </section>

        {/* Access: the form, with a section of its own. */}
        <section
          id="access"
          ref={accessRef}
          aria-labelledby="access-title"
          className="relative border-t px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8">
            <div
              data-pad
              className="w-full rounded-lg border bg-card text-left text-card-foreground shadow-xs"
            >
              <div className="px-6 py-6 text-center sm:px-8">
                <h2
                  id="access-title"
                  data-flow-swap
                  className="font-serif text-4xl font-medium leading-none"
                >
                  {isSignUp ? "Open an account" : "Sign in"}
                </h2>
                <p
                  data-flow-swap
                  className="mt-3 text-sm text-muted-foreground"
                >
                  {isSignUp
                    ? "Each account keeps its own private shelf of medicines."
                    : "Welcome back. Your shelf is as you left it."}
                </p>
              </div>
              <div className="card-divider" aria-hidden />

              <div className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                      <Input
                        ref={emailRef}
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

                  <div className="flex flex-col gap-1.5">
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
                        aria-describedby={
                          isSignUp ? "password-hint" : undefined
                        }
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

                  <div className="pt-1">
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
              className="min-h-11 rounded-md px-3 py-2.5 text-sm font-medium text-primary underline underline-offset-4 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "New here? Open an account"}
            </button>

            <aside
              id="privacy"
              aria-labelledby="privacy-title"
              className="w-full border-t pt-8 text-left"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="size-5 shrink-0 text-primary"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <h3 id="privacy-title" className="text-sm font-semibold">
                  How MedMinder handles your data
                </h3>
              </div>
              <dl className="mt-4 flex flex-col gap-3">
                {PRIVACY.map(({ title, body }) => (
                  <div key={title}>
                    <dt className="text-sm font-medium">{title}</dt>
                    <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {body}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex max-w-sm flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <LogoMark className="size-7" />
                <span className="font-serif text-2xl font-medium leading-none">
                  MedMinder
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Stock, expiry and reorder tracking for the dispensary. Every
                account keeps its own private shelf.
              </p>
            </div>

            <nav aria-label="Product" className="flex flex-col gap-1">
              <h2 className="mb-1 text-sm font-semibold">Product</h2>
              {FEATURES.map(({ title }) => (
                <a key={title} href="#features" className={footerLink}>
                  {title}
                </a>
              ))}
            </nav>

            <nav aria-label="Account" className="flex flex-col gap-1">
              <h2 className="mb-1 text-sm font-semibold">Account</h2>
              <a
                href="#access"
                onClick={(e) => openAccess(e, "signIn")}
                className={footerLink}
              >
                Sign in
              </a>
              <a
                href="#access"
                onClick={(e) => openAccess(e, "signUp")}
                className={footerLink}
              >
                Open an account
              </a>
              <a href="#privacy" className={footerLink}>
                Data privacy
              </a>
            </nav>
          </div>

          <div className="flex flex-col gap-1 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {new Date().getFullYear()} MedMinder</p>
            <p>Built for pharmacies and clinics.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
