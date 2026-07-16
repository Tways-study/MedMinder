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
        orchid: "hsl(var(--orchid))",
        amethyst: "hsl(var(--amethyst))",
        // Expiry severity ramp. Paired fg/bg so a badge can never be assembled
        // from a mismatched combination. `stripe` is the text-free variant and
        // is the only one free to order itself by lightness.
        tier: {
          expired: {
            DEFAULT: "hsl(var(--tier-expired-fg))",
            bg: "hsl(var(--tier-expired-bg))",
            stripe: "hsl(var(--stripe-expired))",
          },
          critical: {
            DEFAULT: "hsl(var(--tier-critical-fg))",
            bg: "hsl(var(--tier-critical-bg))",
            stripe: "hsl(var(--stripe-critical))",
          },
          warning: {
            DEFAULT: "hsl(var(--tier-warning-fg))",
            bg: "hsl(var(--tier-warning-bg))",
            stripe: "hsl(var(--stripe-warning))",
          },
          watch: {
            DEFAULT: "hsl(var(--tier-watch-fg))",
            bg: "hsl(var(--tier-watch-bg))",
            stripe: "hsl(var(--stripe-watch))",
          },
          ok: {
            DEFAULT: "hsl(var(--tier-ok-fg))",
            bg: "hsl(var(--tier-ok-bg))",
            stripe: "hsl(var(--stripe-ok))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-petrona)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-karla)", "ui-sans-serif", "system-ui", "sans-serif"],
        data: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
