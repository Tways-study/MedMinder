import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // The accent as text or outline (orchid); --primary is the same hue as a fill.
        link: "hsl(var(--link))",
        frost: "hsl(var(--frost))",
        pebble: "hsl(var(--pebble))",
        // Expiry severity ramp. Paired fg/bg so a badge can never be assembled
        // from a mismatched combination.
        tier: {
          expired: {
            DEFAULT: "hsl(var(--tier-expired-fg))",
            bg: "hsl(var(--tier-expired-bg))",
          },
          critical: {
            DEFAULT: "hsl(var(--tier-critical-fg))",
            bg: "hsl(var(--tier-critical-bg))",
          },
          warning: {
            DEFAULT: "hsl(var(--tier-warning-fg))",
            bg: "hsl(var(--tier-warning-bg))",
          },
          watch: {
            DEFAULT: "hsl(var(--tier-watch-fg))",
            bg: "hsl(var(--tier-watch-bg))",
          },
          ok: {
            DEFAULT: "hsl(var(--tier-ok-fg))",
            bg: "hsl(var(--tier-ok-bg))",
          },
        },
      },
      // No elevation on surfaces. The one exception is chrome that floats over
      // content — menus, popovers, dialogs — which needs separation to read.
      boxShadow: {
        float: "0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.04)",
      },
      // Two shapes only: 8px surfaces, full pills for anything pressed.
      borderRadius: {
        sm: "var(--radius)",
        md: "var(--radius)",
        lg: "var(--radius)",
        xl: "var(--radius)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },
      // Tracking is size-specific: tighter as type grows, never one value for
      // every size. Leading runs the other way — loose for body, tight for titles.
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1.33", letterSpacing: "-0.01em" }],
        footnote: ["0.8125rem", { lineHeight: "1.38", letterSpacing: "-0.006em" }],
        "body-sm": ["0.875rem", { lineHeight: "1.43", letterSpacing: "-0.016em" }],
        body: ["1.0625rem", { lineHeight: "1.47", letterSpacing: "-0.022em" }],
        subheading: ["1.3125rem", { lineHeight: "1.24", letterSpacing: "-0.012em" }],
        title: ["1.75rem", { lineHeight: "1.14", letterSpacing: "-0.014em" }],
        "large-title": ["2.125rem", { lineHeight: "1.12", letterSpacing: "-0.024em" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
