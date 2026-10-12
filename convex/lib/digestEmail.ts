import type { ExpiryTier } from "./inventory";

export type DigestAlert = {
  medicineName: string;
  strength?: string;
  expiryLabel: string;
  expiryDistance: string;
  onHandQuantity: number;
  tier: Exclude<ExpiryTier, "ok">;
};

export type DigestLowStock = {
  name: string;
  strength?: string;
  onHandQuantity: number;
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
  Colours are inlined, using the app's light-theme values. Email clients strip
  <style> blocks and ignore prefers-color-scheme inconsistently, so the email
  is light-only by design.
*/
const COLOR = {
  background: "#FAFAFA",
  card: "#FFFFFF",
  text: "#18181B",
  muted: "#696971",
  border: "#E4E4E7",
  primary: "#6D4AA8",
} as const;

const FONT_SANS =
  "Geist, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO =
  "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const TIER_COLOR: Record<Exclude<ExpiryTier, "ok">, string> = {
  expired: "#B91C1C",
  critical: "#C2410C",
  warning: "#B45309",
  watch: "#0369A1",
};

const TIER_BG: Record<Exclude<ExpiryTier, "ok">, string> = {
  expired: "#FEF2F2",
  critical: "#FFF7ED",
  warning: "#FFFBEB",
  watch: "#F0F9FF",
};

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function digestSubject(alerts: DigestAlert[]): string {
  if (alerts.length === 0) return "MedMinder: nothing expiring soon";

  const expired = alerts.filter((a) => a.tier === "expired").length;
  const soon = alerts.length - expired;

  // The subject line is often all she reads, so it carries the actual counts.
  if (expired > 0 && soon > 0) {
    return `MedMinder: ${expired} expired, ${soon} expiring soon`;
  }
  if (expired > 0) {
    return `MedMinder: ${expired} expired ${expired === 1 ? "medicine" : "medicines"}`;
  }
  return `MedMinder: ${soon} ${soon === 1 ? "medicine" : "medicines"} expiring soon`;
}

/** Plain text alongside the HTML: some clients show it, and it always renders. */
export function digestText(
  alerts: DigestAlert[],
  lowStock: DigestLowStock[],
  appUrl: string,
): string {
  const lines: string[] = ["MedMinder weekly summary", ""];

  if (alerts.length === 0) {
    lines.push("Nothing on the shelf expires within six months.", "");
  }

  for (const tier of TIER_ORDER) {
    const group = alerts.filter((a) => a.tier === tier);
    if (group.length === 0) continue;

    lines.push(`${TIER_HEADING[tier]} (${group.length})`);
    for (const alert of group) {
      const name = [alert.medicineName, alert.strength].filter(Boolean).join(" ");
      lines.push(
        `  - ${name}: ${alert.expiryDistance} (${alert.expiryLabel}), ${alert.onHandQuantity} on hand`,
      );
    }
    lines.push("");
  }

  if (lowStock.length > 0) {
    lines.push(`Running low (${lowStock.length})`);
    for (const m of lowStock) {
      const name = [m.name, m.strength].filter(Boolean).join(" ");
      lines.push(`  - ${name}: ${m.onHandQuantity} left, reorder at ${m.reorderPoint}`);
    }
    lines.push("");
  }

  lines.push(`Open MedMinder: ${appUrl}`);
  return lines.join("\n");
}

export function digestHtml(
  alerts: DigestAlert[],
  lowStock: DigestLowStock[],
  appUrl: string,
): string {
  const sections: string[] = [];

  if (alerts.length === 0) {
    sections.push(
      `<p style="margin:0 0 24px;color:${COLOR.muted};">Nothing on the shelf expires within six months.</p>`,
    );
  }

  for (const tier of TIER_ORDER) {
    const group = alerts.filter((a) => a.tier === tier);
    if (group.length === 0) continue;

    const rows = group
      .map((alert) => {
        const name = escape(
          [alert.medicineName, alert.strength].filter(Boolean).join(" "),
        );
        return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid ${COLOR.border};">
              <div style="font-weight:600;color:${COLOR.text};">${name}</div>
              <div style="font-family:${FONT_MONO};font-size:13px;color:${COLOR.muted};margin-top:2px;">
                ${escape(alert.expiryLabel)}
              </div>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid ${COLOR.border};text-align:right;vertical-align:top;">
              <div style="color:${TIER_COLOR[tier]};font-size:14px;">${escape(alert.expiryDistance)}</div>
              <div style="font-family:${FONT_MONO};font-size:13px;color:${COLOR.muted};margin-top:2px;">${alert.onHandQuantity} on hand</div>
            </td>
          </tr>`;
      })
      .join("");

    sections.push(`
      <h2 style="margin:28px 0 4px;font-size:16px;">
        <span style="display:inline-block;background:${TIER_BG[tier]};color:${TIER_COLOR[tier]};padding:3px 10px;border-radius:6px;">
          ${TIER_HEADING[tier]} (${group.length})
        </span>
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
            <td style="padding:10px 0;border-bottom:1px solid ${COLOR.border};color:${COLOR.text};">${name}</td>
            <td style="padding:10px 0;border-bottom:1px solid ${COLOR.border};text-align:right;font-family:${FONT_MONO};font-size:13px;color:${COLOR.muted};">
              ${m.onHandQuantity} / ${m.reorderPoint}
            </td>
          </tr>`;
      })
      .join("");

    sections.push(`
      <h2 style="margin:28px 0 4px;font-size:16px;color:${COLOR.primary};">
        Running low (${lowStock.length})
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${rows}
      </table>`);
  }

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px 12px;background:${COLOR.background};">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:8px;font-family:${FONT_SANS};color:${COLOR.text};">
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:600;">MedMinder</h1>
      <p style="margin:0;color:${COLOR.muted};font-size:14px;">Your weekly shelf summary.</p>

      ${sections.join("")}

      <p style="margin:32px 0 0;">
        <a href="${escape(appUrl)}" style="display:inline-block;background:${COLOR.primary};color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;">
          Open MedMinder
        </a>
      </p>
    </div>
  </body>
</html>`;
}
