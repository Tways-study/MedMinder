/** Shared motion tokens (GSAP). Seconds, not ms. */
export const DUR = { micro: 0.16, base: 0.28, enter: 0.45 } as const;

export const EASE = {
  out: "power3.out",
  inOut: "power2.inOut",
  stamp: "back.out(2.2)",
} as const;

/** Per-item stagger, in seconds. */
export const STAGGER = 0.04;

/** The only media query under which motion runs. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
