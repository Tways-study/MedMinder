"use client";

import { CountLineCard } from "@/components/count-line-card";
import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { variance } from "@/convex/lib/inventory";
import { formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useState } from "react";

type Scope =
  | { kind: "all" }
  | { kind: "category"; category: string }
  | { kind: "medicine"; medicineId: Id<"medicines"> };

export default function CountPage() {
  const session = useQuery(api.counts.current);
  const categories = useQuery(api.counts.categories);
  const start = useMutation(api.counts.start);
  const saveLine = useMutation(api.counts.saveLine);
  const complete = useMutation(api.counts.complete);
  const discard = useMutation(api.counts.discard);

  const [values, setValues] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ posted: number; skipped: number } | null>(
    null,
  );

  if (session === undefined || categories === undefined) {
    return (
      <Page>
        <PageHeader title="Count" />
        <CardSkeleton count={3} />
      </Page>
    );
  }

  if (result) {
    return (
      <Page>
        <PageHeader title="Count posted" />
        <div className="rounded-lg border bg-card p-5">
          <p>
            {formatQuantity(result.posted)}{" "}
            {result.posted === 1 ? "lot" : "lots"} corrected to what you counted.
          </p>
          {result.skipped > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {formatQuantity(result.skipped)}{" "}
              {result.skipped === 1 ? "lot was" : "lots were"} left uncounted and
              were not changed.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setResult(null)}>Start another count</Button>
          <Button asChild variant="outline">
            <Link href="/medicines">Back to medicines</Link>
          </Button>
        </div>
      </Page>
    );
  }

  // No count open: choose what to walk.
  if (session === null) {
    const begin = async (scope: Scope) => {
      setError(null);
      setBusy(true);
      try {
        await start({ scope });
        setValues({});
        setRevealed({});
      } catch (err) {
        setError(
          err instanceof ConvexError
            ? String(err.data)
            : "Could not start the count.",
        );
      } finally {
        setBusy(false);
      }
    };

    return (
      <Page>
        <PageHeader
          title="Count"
          subtitle="Walk the shelf and record what is actually there."
        />

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-medium">What are you counting?</h2>

          <Button
            onClick={() => begin({ kind: "all" })}
            disabled={busy}
            className="h-12 justify-start"
          >
            Everything on the shelf
          </Button>

          {categories.length > 0 && (
            <>
              <p className="label-field mt-2">Or one shelf</p>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="secondary"
                  disabled={busy}
                  className="h-12 justify-start"
                  onClick={() => begin({ kind: "category", category })}
                >
                  {category}
                </Button>
              ))}
            </>
          )}
        </section>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <p className="rounded-lg border border-dashed bg-card/50 p-4 text-sm text-muted-foreground">
          The system&rsquo;s figure stays hidden until you have entered yours. A
          count that can see the answer tends to agree with it.
        </p>
      </Page>
    );
  }

  const lines = session.lines;
  const entered = lines.filter((l) => (values[l.batchId] ?? "") !== "").length;
  const differences = lines.filter((l) => {
    const raw = values[l.batchId];
    if (!raw) return false;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 && n !== l.expectedQty;
  }).length;

  const handleBlur = async (batchId: string, expectedQty: number) => {
    const raw = values[batchId];
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) return;

    setRevealed((prev) => ({ ...prev, [batchId]: true }));
    try {
      await saveLine({
        sessionId: session._id,
        batchId: batchId as Id<"batches">,
        countedQty: n,
      });
    } catch (err) {
      setError(
        err instanceof ConvexError ? String(err.data) : "Could not save that count.",
      );
    }
  };

  return (
    <Page>
      <PageHeader
        title="Counting"
        subtitle={
          session.scope.kind === "all"
            ? "Everything on the shelf"
            : session.scope.kind === "category"
              ? session.scope.category
              : "One medicine"
        }
      />

      <div className="sticky top-0 z-10 -mx-5 border-b bg-background/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm">
            <span className="font-data font-medium">{entered}</span>
            <span className="text-muted-foreground"> of {lines.length} counted</span>
          </p>
          {differences > 0 && (
            <p className="text-sm font-medium text-tier-expired">
              {differences} {differences === 1 ? "difference" : "differences"}
            </p>
          )}
        </div>
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuenow={entered}
          aria-valuemin={0}
          aria-valuemax={lines.length}
          aria-label="Lots counted"
        >
          <div
            className={cn("h-full bg-primary transition-all")}
            style={{ width: `${(entered / lines.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {lines.map((line) => (
          <div key={line.batchId} onBlur={() => handleBlur(line.batchId, line.expectedQty)}>
            <CountLineCard
              line={line}
              value={values[line.batchId] ?? ""}
              revealed={revealed[line.batchId] ?? false}
              onChange={(v) =>
                setValues((prev) => ({ ...prev, [line.batchId]: v }))
              }
              onReason={async (reason) => {
                const raw = values[line.batchId];
                if (!raw) return;
                await saveLine({
                  sessionId: session._id,
                  batchId: line.batchId as Id<"batches">,
                  countedQty: Number(raw),
                  reason: reason
                    ? (reason as "damaged" | "expired" | "miscount" | "unrecorded_sale" | "other")
                    : undefined,
                });
              }}
            />
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t pt-5">
        <Button
          disabled={busy || entered === 0}
          className="h-12"
          onClick={async () => {
            setError(null);
            setBusy(true);
            try {
              const res = await complete({ sessionId: session._id });
              setResult(res);
              setValues({});
              setRevealed({});
            } catch (err) {
              setError(
                err instanceof ConvexError
                  ? String(err.data)
                  : "Could not post the count.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {entered === 0
            ? "Count at least one lot"
            : `Post ${entered} ${entered === 1 ? "count" : "counts"}`}
        </Button>

        {entered < lines.length && entered > 0 && (
          <p className="text-sm text-muted-foreground">
            {lines.length - entered} uncounted{" "}
            {lines.length - entered === 1 ? "lot" : "lots"} will be left as they
            are.
          </p>
        )}

        <Button
          variant="outline"
          className="h-11"
          disabled={busy}
          onClick={async () => {
            await discard({ sessionId: session._id });
            setValues({});
            setRevealed({});
          }}
        >
          Discard this count
        </Button>
      </div>
    </Page>
  );
}
