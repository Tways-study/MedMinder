"use node";

import { v } from "convex/values";
import nodemailer from "nodemailer";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import type { DigestContents } from "./digest";

/**
 * Hourly tick. Sends only to owners whose wall clock says it is time.
 *
 * Convex crons are fixed UTC, but each owner's schedule is theirs to move, so
 * the decision has to be made per owner per tick rather than baked into the
 * cron. MedMinder is multi-tenant, so one tick may send to several owners,
 * each their own digest scoped to their own inventory.
 *
 * Sends over Gmail SMTP via an App Password, so this has to be a Node action
 * ("use node" above) — nodemailer opens a real SMTP/TLS socket, which isn't
 * available in Convex's default V8 isolate runtime. Node actions can't share
 * a file with queries or mutations, which is why this is split out of
 * digest.ts rather than living alongside `contents`/`markSent`.
 */
export const maybeSend = internalAction({
  args: { force: v.optional(v.boolean()) },
  returns: v.string(),
  handler: async (ctx, { force }) => {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      console.error(
        "GMAIL_USER/GMAIL_APP_PASSWORD are not set on this deployment, so digests cannot send. " +
          "Set them with: npx convex env set GMAIL_USER you@gmail.com " +
          "and npx convex env set GMAIL_APP_PASSWORD xxxx-xxxx-xxxx-xxxx",
      );
      return "Skipped: Gmail credentials are not set.";
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    const owners: Id<"users">[] = await ctx.runQuery(internal.digest.ownerIds, {});
    const sent: string[] = [];

    for (const ownerId of owners) {
      const digest: DigestContents = await ctx.runQuery(internal.digest.contents, {
        ownerId,
      });

      if (!force && !digest.due) continue;
      if (digest.email === null) continue;

      await transporter.sendMail({
        from: `"MedMinder" <${gmailUser}>`,
        to: digest.email,
        subject: digest.subject,
        html: digest.html,
        text: digest.text,
      });

      await ctx.runMutation(internal.digest.markSent, { ownerId, at: Date.now() });
      sent.push(`${digest.email}: ${digest.subject}`);
    }

    return sent.length === 0 ? "Nothing due." : `Sent to ${sent.join("; ")}`;
  },
});
