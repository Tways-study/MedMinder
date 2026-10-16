"use client";

import { CardSkeleton, Page, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Loader2, MailCheck } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type TierKey = "critical" | "warning" | "watch";

const TIER_FIELDS: { key: TierKey; label: string; hint: string }[] = [
  {
    key: "critical",
    label: "Critical",
    hint: "Too late to return. Default 30 days.",
  },
  {
    key: "warning",
    label: "Soon",
    hint: "Still returnable to most suppliers. Default 90 days.",
  },
  {
    key: "watch",
    label: "Watch",
    hint: "Worth planning around. Default 180 days.",
  },
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
      <Page className="max-w-3xl">
        <PageHeader title="Settings" />
        <CardSkeleton count={2} />
      </Page>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
      toast.success("Settings saved");
    } catch (err) {
      const message =
        err instanceof ConvexError
          ? String(err.data)
          : "Could not save. Nothing was changed.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="What counts as urgent, and when to be told."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <p className="label-caps flex items-center gap-2">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><MailCheck className="size-4" strokeWidth={1.75} /></span>
              Weekly digest
            </p>
            <CardTitle>What is on the shelf, once a week</CardTitle>
            <CardDescription>
              A summary of what is expiring, so nothing depends on remembering
              to check.
            </CardDescription>
          </CardHeader>
          <div className="perforation" aria-hidden />
          <CardContent className="flex flex-col gap-5 pt-5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="digest-enabled"
                checked={digestEnabled}
                onCheckedChange={(checked) => setDigestEnabled(!!checked)}
              />
              <label
                htmlFor="digest-enabled"
                className="cursor-pointer text-sm font-medium"
              >
                Send the weekly summary
              </label>
            </div>

            <Field label="Send to" htmlFor="digest-emails">
              <EmailChipInput
                id="digest-emails"
                value={digestEmails}
                onChange={setDigestEmails}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Day" htmlFor="digest-day">
                <Select
                  value={String(digestDay)}
                  onValueChange={(v) => setDigestDay(Number(v))}
                >
                  <SelectTrigger id="digest-day">
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

              <Field label="Hour" htmlFor="digest-hour">
                <Select
                  value={String(digestHour)}
                  onValueChange={(v) => setDigestHour(Number(v))}
                >
                  <SelectTrigger id="digest-hour" className="font-data">
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
              htmlFor="digest-timezone"
            >
              <TimezoneCombobox
                id="digest-timezone"
                value={timezone}
                onChange={setTimezone}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="label-caps">Alert thresholds</p>
            <CardTitle>Expiry alert tiers</CardTitle>
            <CardDescription>
              How many days ahead each warning starts. Each must be sooner than
              the one below it.
            </CardDescription>
          </CardHeader>
          <div className="perforation" aria-hidden />
          <CardContent className="flex flex-col gap-5 pt-5">
            {TIER_FIELDS.map(({ key, label, hint }) => (
              <Field
                key={key}
                label={label}
                hint={hint}
                htmlFor={`tier-${key}`}
              >
                <div className="relative">
                  <Input
                    id={`tier-${key}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    required
                    value={alertTiers[key]}
                    onChange={(e) =>
                      setAlertTiers((t) => ({
                        ...t,
                        [key]: Number(e.target.value),
                      }))
                    }
                    className="font-data pr-16"
                  />
                  <span
                    aria-hidden
                    className="label-caps pointer-events-none absolute inset-y-0 right-3 flex items-center"
                  >
                    DAYS
                  </span>
                </div>
              </Field>
            ))}
          </CardContent>
        </Card>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </Page>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="label-caps">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
