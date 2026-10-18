import type { Config } from "tailwindcss";

const tier = (name: string) => ({
  DEFAULT: `hsl(var(--tier-${name}))`,
  bg: `hsl(var(--tier-${name}-bg))`,
  border: `hsl(var(--tier-${name}-border))`,
});

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
        // Sign-in canvas only (DESIGN.md "Landing exception").
        landing: {
          DEFAULT: "hsl(var(--landing))",
          deep: "hsl(var(--landing-deep))",
          ink: "hsl(var(--landing-ink))",
          "ink-strong": "hsl(var(--landing-ink-strong))",
        },
        // Expiry severity ramp: fg (DEFAULT), bg, border per tier.
        tier: {
          expired: tier("expired"),
          critical: tier("critical"),
          warning: tier("warning"),
          watch: tier("watch"),
          ok: tier("ok"),
        },
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        landing: "0 28px 56px -20px hsl(var(--landing-deep) / 0.7)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
