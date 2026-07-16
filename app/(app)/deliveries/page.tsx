"use client";

import {
  CardSkeleton,
  EmptyState,
  Page,
  PageHeader,
} from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/format";
import { useQuery } from "convex/react";
import Link from "next/link";

export default function DeliveriesPage() {
  const deliveries = useQuery(api.deliveries.listRecent, {});

  return (
    <Page>
      <PageHeader
        title="Deliveries"
        subtitle="The only thing that adds stock. Counts correct it afterwards."
        action={
          <Button asChild>
            <Link href="/deliveries/new">Log</Link>
          </Button>
        }
      />

      {deliveries === undefined && <CardSkeleton count={2} />}

      {deliveries && deliveries.length === 0 && (
        <EmptyState
          title="No deliveries logged"
          body="Log a delivery when stock arrives. Each lot you enter starts its own expiry clock."
          action={
            <Button asChild className="mt-1">
              <Link href="/deliveries/new">Log a delivery</Link>
            </Button>
          }
        />
      )}

      {deliveries && deliveries.length > 0 && (
        <ul className="flex flex-col gap-3">
          {deliveries.map((d) => (
            <li
              key={d._id}
              className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-display text-lg font-medium leading-snug">
                  {d.supplier}
                </p>
                {d.invoiceRef && (
                  <p className="font-data mt-0.5 text-sm text-muted-foreground">
                    {d.invoiceRef}
                  </p>
                )}
              </div>
              <p className="font-data shrink-0 whitespace-nowrap text-sm text-muted-foreground">
                {formatDate(d.receivedDate)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
