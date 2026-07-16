import type { ExpiryTier } from "./inventory";

export type DigestLot = {
  medicineName: string;
  strength?: string;
  lotNumber: string;
  expiryLabel: string;
  expiryDistance: string;
  quantity: number;
  tier: Exclude<ExpiryTier, "ok">;
};

export type DigestLowStock = {
  name: string;
  strength?: string;
  totalQuantity: number;
  reorderPoint: number;
};

const TIER_HEADING: Record<Exclude<ExpiryTier, "ok">, string> = {
  expired: "Expired",
  critical: "Expiring within a month",
  warning: "Expiring within three months",
  watch: "Expiring within six months",
};

const TIER_ORDER: Exclude<ExpiryTier, "ok">[] = [
  "expired",
  "critical",
  "warning",
  "watch",
];

/*
  Colours are inlined and muted. Email clients strip <style> blocks, and this
  lands in a mail app, not the app itself — it borrows the palette without
  pretending to be the dashboard.
*/
const TIER_COLOR: Record<Exclude<ExpiryTier, "ok">, string> = {
  expired: "#7C3350",
  critical: "#A65038",
  warning: "#83642B",
  watch: "#5A6788",
};

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function digestSubject(lots: DigestLot[]): string {
  if (lots.length === 0) return "MedMinder: nothing expiring soon";

  const expired = lots.filter((l) => l.tier === "expired").length;
  const soon = lots.length - expired;

  // The subject line is often all she reads, so it carries the actual counts.
  if (expired > 0 && soon > 0) {
    return `MedMinder: ${expired} expired, ${soon} expiring soon`;
  }
  if (expired > 0) {
    return `MedMinder: ${expired} expired ${expired === 1 ? "lot" : "lots"}`;
  }
  return `MedMinder: ${soon} ${soon === 1 ? "lot" : "lots"} expiring soon`;
}

/** Plain text alongside the HTML: some clients show it, and it always renders. */
export function digestText(
  lots: DigestLot[],
  lowStock: DigestLowStock[],
  appUrl: string,
): string {
  const lines: string[] = ["MedMinder weekly summary", ""];

  if (lots.length === 0) {
    lines.push("No lot on the shelf expires within six months.", "");
  }

  for (const tier of TIER_ORDER) {
    const group = lots.filter((l) => l.tier === tier);
    if (group.length === 0) continue;

    lines.push(`${TIER_HEADING[tier]} (${group.length})`);
    for (const lot of group) {
      const name = [lot.medicineName, lot.strength].filter(Boolean).join(" ");
      lines.push(
        `  - ${name}, lot ${lot.lotNumber}: ${lot.expiryDistance} (${lot.expiryLabel}), ${lot.quantity} on hand`,
      );
    }
    lines.push("");
  }

  if (lowStock.length > 0) {
    lines.push(`Running low (${lowStock.length})`);
    for (const m of lowStock) {
      const name = [m.name, m.strength].filter(Boolean).join(" ");
      lines.push(`  - ${name}: ${m.totalQuantity} left, reorder at ${m.reorderPoint}`);
    }
    lines.push("");
  }

  lines.push(`Open MedMinder: ${appUrl}`);
  return lines.join("\n");
}

export function digestHtml(
  lots: DigestLot[],
  lowStock: DigestLowStock[],
  appUrl: string,
): string {
  const sections: string[] = [];

  if (lots.length === 0) {
    sections.push(
      `<p style="margin:0 0 24px;color:#6F6579;">No lot on the shelf expires within six months.</p>`,
    );
  }

  for (const tier of TIER_ORDER) {
    const group = lots.filter((l) => l.tier === tier);
    if (group.length === 0) continue;

    const rows = group
      .map((lot) => {
        const name = escape(
          [lot.medicineName, lot.strength].filter(Boolean).join(" "),
        );
        return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #E0D5EA;">
              <div style="font-weight:600;color:#2A2434;">${name}</div>
              <div style="font-family:monospace;font-size:13px;color:#6F6579;margin-top:2px;">
                Lot ${escape(lot.lotNumber)} &middot; ${escape(lot.expiryLabel)}
              </div>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #E0D5EA;text-align:right;vertical-align:top;">
              <div style="color:${TIER_COLOR[tier]};font-size:14px;">${escape(lot.expiryDistance)}</div>
              <div style="font-family:monospace;font-size:13px;color:#6F6579;margin-top:2px;">${lot.quantity} on hand</div>
            </td>
          </tr>`;
      })
      .join("");

    sections.push(`
      <h2 style="margin:28px 0 4px;font-size:16px;color:${TIER_COLOR[tier]};">
        ${TIER_HEADING[tier]} (${group.length})
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${rows}
      </table>`);
  }

  if (lowStock.length > 0) {
    const rows = lowStock
      .map((m) => {
        const name = escape([m.name, m.strength].filter(Boolean).join(" "));
        return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #E0D5EA;color:#2A2434;">${name}</td>
            <td style="padding:10px 0;border-bottom:1px solid #E0D5EA;text-align:right;font-family:monospace;font-size:13px;color:#6F6579;">
              ${m.totalQuantity} / ${m.reorderPoint}
            </td>
          </tr>`;
      })
      .join("");

    sections.push(`
      <h2 style="margin:28px 0 4px;font-size:16px;color:#6B4A9E;">
        Running low (${lowStock.length})
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${rows}
      </table>`);
  }

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F7F3F9;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2A2434;">
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:600;">MedMinder</h1>
      <p style="margin:0;color:#6F6579;font-size:14px;">Your weekly shelf summary.</p>

      ${sections.join("")}

      <p style="margin:32px 0 0;">
        <a href="${escape(appUrl)}" style="display:inline-block;background:#6B4A9E;color:#F7F3F9;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;">
          Open MedMinder
        </a>
      </p>
    </div>
  </body>
</html>`;
}
