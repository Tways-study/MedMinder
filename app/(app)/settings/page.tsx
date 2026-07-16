"use client";

import { Field } from "@/components/medicine-form";
import { CardSkeleton, Page, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// The zones a community pharmacy is plausibly in, plus whatever the browser says.
const ZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

const selectClass = cn(
  "h-11 rounded-sm border border-input bg-background px-3 text-sm",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export default function SettingsPage() {
  const settings = useQuery(api.settings.get);
  const update = useMutation(api.settings.update);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (settings === undefined) {
    return (
      <Page>
        <PageHeader title="Settings" />
        <CardSkeleton count={2} />
      </Page>
    );
  }

  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zones = [...new Set([...ZONES, browserZone, settings?.timezone].filter(Boolean))];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await update({
        digestEnabled: data.get("digestEnabled") === "on",
        digestEmail: String(data.get("digestEmail")),
        digestDay: Number(data.get("digestDay")),
        digestHour: Number(data.get("digestHour")),
        timezone: String(data.get("timezone")),
        alertTiers: {
          critical: Number(data.get("critical")),
          warning: Number(data.get("warning")),
          watch: Number(data.get("watch")),
        },
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : "Could not save. Nothing was changed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Settings"
        subtitle="What counts as urgent, and when to be told."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-medium">Weekly email</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A summary of what is expiring, so nothing depends on remembering to
              check.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <input
              type="checkbox"
              name="digestEnabled"
              defaultChecked={settings?.digestEnabled ?? true}
              className="h-5 w-5 accent-primary"
            />
            <span className="text-sm font-medium">Send the weekly summary</span>
          </label>

          <Field label="Send to">
            <Input
              name="digestEmail"
              type="email"
              required
              defaultValue={settings?.digestEmail}
              className="h-11"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Day">
              <select
                name="digestDay"
                defaultValue={settings?.digestDay ?? 1}
                className={selectClass}
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Hour">
              <select
                name="digestHour"
                defaultValue={settings?.digestHour ?? 8}
                className={cn(selectClass, "font-data")}
              >
                {Array.from({ length: 24 }).map((_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Timezone" hint="The hour above is read in this timezone.">
            <select
              name="timezone"
              defaultValue={settings?.timezone ?? "Asia/Manila"}
              className={selectClass}
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                  {z === browserZone ? " (this device)" : ""}
                </option>
              ))}
            </select>
          </Field>
        </section>

        <section className="flex flex-col gap-5 border-t pt-6">
          <div>
            <h2 className="font-display text-lg font-medium">Expiry alerts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              How many days ahead each warning starts. Each must be sooner than
              the one below it.
            </p>
          </div>

          <Field
            label="Critical"
            hint="Too late to return. Default 30 days."
          >
            <Input
              name="critical"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              defaultValue={settings?.alertTiers.critical ?? 30}
              className="font-data h-11"
            />
          </Field>

          <Field label="Soon" hint="Still returnable to most suppliers. Default 90 days.">
            <Input
              name="warning"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              defaultValue={settings?.alertTiers.warning ?? 90}
              className="font-data h-11"
            />
          </Field>

          <Field label="Watch" hint="Worth planning around. Default 180 days.">
            <Input
              name="watch"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              defaultValue={settings?.alertTiers.watch ?? 180}
              className="font-data h-11"
            />
          </Field>
        </section>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="text-sm text-tier-ok">
            Settings saved.
          </p>
        )}

        <Button type="submit" disabled={saving} className="h-11">
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </Page>
  );
}
