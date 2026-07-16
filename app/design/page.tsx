import { BatchCard } from "@/components/batch-card";
import { TierBadge } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_ALERT_TIERS,
  type ExpiryTier,
  expiryTier,
  formatExpiryDistance,
} from "@/convex/lib/inventory";

/*
  Design system review screen. Temporary: it exists so the system can be judged
  on real components with real pharmacy data before feature screens are built on
  top of it. Delete once the dashboard lands.
*/

const NOW = new Date("2026-07-16T00:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;
const at = (days: number) => NOW + days * DAY;

const fmt = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const SHELF = [
  {
    medicineName: "Amoxicillin",
    strength: "500 mg",
    form: "capsule",
    lotNumber: "AMX-4471B",
    quantity: 24,
    expiry: at(-12),
  },
  {
    medicineName: "Salbutamol",
    strength: "100 mcg",
    form: "inhaler",
    lotNumber: "SLB-9032",
    quantity: 6,
    expiry: at(20),
  },
  {
    medicineName: "Mefenamic acid",
    strength: "500 mg",
    form: "tablet",
    lotNumber: "MFA-1180",
    quantity: 140,
    expiry: at(62),
  },
  {
    medicineName: "Losartan potassium",
    strength: "50 mg",
    form: "tablet",
    lotNumber: "LOS-2264A",
    quantity: 312,
    expiry: at(150),
  },
  {
    medicineName: "Paracetamol",
    strength: "500 mg",
    form: "tablet",
    lotNumber: "PCM-7719",
    quantity: 480,
    expiry: at(730),
  },
];

const TIER_ORDER: ExpiryTier[] = [
  "expired",
  "critical",
  "warning",
  "watch",
  "ok",
];

const SWATCHES = [
  { name: "paper", var: "--paper", note: "page" },
  { name: "surface", var: "--surface", note: "cards" },
  { name: "lilac", var: "--lilac", note: "panels" },
  { name: "hairline", var: "--hairline", note: "dividers" },
  { name: "input-line", var: "--input-line", note: "field borders" },
  { name: "amethyst", var: "--amethyst", note: "secondary" },
  { name: "orchid", var: "--orchid", note: "primary" },
  { name: "ink", var: "--ink", note: "text" },
];

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-medium">{title}</h2>
        {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 p-5 pb-24">
      <header className="flex flex-col gap-2 border-b pb-6">
        <p className="label-field">Design system</p>
        <h1 className="font-display text-3xl font-medium leading-tight">
          MedMinder
        </h1>
        <p className="text-muted-foreground">
          Purple pastel apothecary. Anchored on gentian violet, a real pharmacy
          dye, so the colour comes from the shelf rather than the trend.
        </p>
      </header>

      <Section
        title="Type"
        note="Petrona for headings, Karla for reading, Plex Mono for anything compared down a column."
      >
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-5">
          <p className="font-display text-2xl font-medium leading-tight">
            Losartan potassium
          </p>
          <p className="max-w-[60ch]">
            Two lots of the same drug can sit on one shelf months apart. Counting
            happens at the shelf, on a phone, one-handed.
          </p>
          <p className="font-data text-sm">LOS-2264A · 12 Dec 2026 · 312</p>
        </div>
      </Section>

      <Section
        title="Palette"
        note="Every text pairing is measured against the surface it sits on, not eyeballed."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SWATCHES.map((s) => (
            <div key={s.name} className="flex flex-col gap-1.5">
              <div
                className="h-14 rounded-sm border"
                style={{ background: `hsl(var(${s.var}))` }}
              />
              <div>
                <p className="font-data text-xs">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Expiry tiers"
        note="Ordered plum to sage. Colour never carries the meaning alone: every badge has an icon and a word, so it survives greyscale."
      >
        <div className="flex flex-wrap gap-2">
          {TIER_ORDER.map((tier) => (
            <TierBadge key={tier} tier={tier} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {SHELF.map((b) => (
            <TierBadge
              key={b.lotNumber}
              tier={expiryTier(b.expiry, NOW, DEFAULT_ALERT_TIERS)}
            >
              {formatExpiryDistance(b.expiry, NOW)}
            </TierBadge>
          ))}
        </div>
      </Section>

      <Section
        title="Batch card"
        note="A lot rendered as the dispensing label it already is: ruled fields, stamped lot and expiry, severity down the binding edge."
      >
        <div className="flex flex-col gap-3">
          {SHELF.map((b) => (
            <BatchCard
              key={b.lotNumber}
              medicineName={b.medicineName}
              strength={b.strength}
              form={b.form}
              lotNumber={b.lotNumber}
              expiryLabel={fmt(b.expiry)}
              expiryDistance={formatExpiryDistance(b.expiry, NOW)}
              quantity={b.quantity}
              tier={expiryTier(b.expiry, NOW, DEFAULT_ALERT_TIERS)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Controls"
        note="Sized for a thumb at a shelf, not a mouse at a desk."
      >
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-5">
          <div className="flex flex-wrap gap-3">
            <Button>Log delivery</Button>
            <Button variant="secondary">Start count</Button>
            <Button variant="outline">Cancel</Button>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Counted quantity</span>
            <Input
              inputMode="numeric"
              placeholder="0"
              className="font-data h-12 text-base"
            />
            <span className="text-xs text-muted-foreground">
              What you counted on the shelf, not what the system expects.
            </span>
          </label>
        </div>
      </Section>
    </main>
  );
}
