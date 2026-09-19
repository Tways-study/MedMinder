"use client";

import { Field } from "@/components/medicine-form";
import { CardSkeleton, Page, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmailChipInput } from "@/components/email-chip-input";
import { TimezoneCombobox } from "@/components/timezone-combobox";
import { api } from "@/convex/_generated/api";
import { DEFAULT_ALERT_TIERS } from "@/convex/lib/inventory";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { type ReactNode, useEffect, useRef, useState } from "react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function SettingsPage() {
  const settings = useQuery(api.settings.get);
  const update = useMutation(api.settings.update);

  const [digestEnabled, setDigestEnabled] = useState(true);
  const [digestEmails, setDigestEmails] = useState<string[]>([]);
  const [digestDay, setDigestDay] = useState(1);
  const [digestHour, setDigestHour] = useState(8);
  const [timezone, setTimezone] = useState("Asia/Manila");
  const [alertTiers, setAlertTiers] = useState(DEFAULT_ALERT_TIERS);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync once when settings first load; ignore subsequent reactive updates
  // so in-progress edits are not overwritten.
  const initialized = useRef(false);
  useEffect(() => {
    if (settings && !initialized.current) {
      initialized.current = true;
      setDigestEnabled(settings.digestEnabled);
      setDigestEmails(settings.digestEmails);
      setDigestDay(settings.digestDay);
      setDigestHour(settings.digestHour);
      setTimezone(settings.timezone);
      setAlertTiers(settings.alertTiers);
    }
  }, [settings]);

  if (settings === undefined) {
    return (
      <Page>
        <PageHeader title="Settings" />
        <CardSkeleton count={2} />
      </Page>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await update({
        digestEnabled,
        digestEmails,
        digestDay,
        digestHour,
        timezone,
        alertTiers,
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
        {/* Apple Settings pattern: a header on the canvas, the controls on one white group. */}
        <section className="flex flex-col gap-2">
          <SectionHeader title="Weekly email">
            A summary of what is expiring, so nothing depends on remembering to
            check.
          </SectionHeader>

          <div className="flex flex-col gap-5 rounded-lg bg-card p-4">
            <label className="-mx-4 -mt-4 flex min-h-11 cursor-pointer items-center justify-between gap-3 border-b px-4 py-3 active:bg-pebble/60">
              <span className="text-body">Send the weekly summary</span>
              <Checkbox
                checked={digestEnabled}
                onCheckedChange={(checked) => setDigestEnabled(!!checked)}
              />
            </label>

            <Field label="Send to">
              <EmailChipInput value={digestEmails} onChange={setDigestEmails} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Day">
                <Select
                  value={String(digestDay)}
                  onValueChange={(v) => setDigestDay(Number(v))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Hour">
                <Select
                  value={String(digestHour)}
                  onValueChange={(v) => setDigestHour(Number(v))}
                >
                  <SelectTrigger className="h-11 font-data">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, h) => (
                      <SelectItem
                        key={h}
                        value={String(h)}
                        className="font-data"
                      >
                        {String(h).padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field
              label="Timezone"
              hint="The hour above is read in this timezone."
            >
              <TimezoneCombobox value={timezone} onChange={setTimezone} />
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <SectionHeader title="Expiry alerts">
            How many days ahead each warning starts. Each must be sooner than
            the one below it.
          </SectionHeader>

          <div className="flex flex-col gap-5 rounded-lg bg-card p-4">
            <Field label="Critical" hint="Too late to return. Default 30 days.">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                value={alertTiers.critical}
                onChange={(e) =>
                  setAlertTiers((t) => ({
                    ...t,
                    critical: Number(e.target.value),
                  }))
                }
                className="font-data h-11"
              />
            </Field>

            <Field
              label="Soon"
              hint="Still returnable to most suppliers. Default 90 days."
            >
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                value={alertTiers.warning}
                onChange={(e) =>
                  setAlertTiers((t) => ({
                    ...t,
                    warning: Number(e.target.value),
                  }))
                }
                className="font-data h-11"
              />
            </Field>

            <Field
              label="Watch"
              hint="Worth planning around. Default 180 days."
            >
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                value={alertTiers.watch}
                onChange={(e) =>
                  setAlertTiers((t) => ({
                    ...t,
                    watch: Number(e.target.value),
                  }))
                }
                className="font-data h-11"
              />
            </Field>
          </div>
        </section>

        {error && (
          <p role="alert" className="text-body-sm text-destructive">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="text-body-sm text-tier-ok">
            Settings saved.
          </p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </Page>
  );
}

function SectionHeader({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="px-1">
      <h2 className="font-display text-subheading font-semibold">{title}</h2>
      <p className="mt-0.5 text-body-sm text-muted-foreground">{children}</p>
    </div>
  );
}
