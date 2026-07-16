import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { DEFAULT_ALERT_TIERS } from "./lib/inventory";

const MIN_PASSWORD_LENGTH = 10;

const PharmacyPassword = Password({
  validatePasswordRequirements: (password: string) => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ConvexError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PharmacyPassword],
  callbacks: {
    /**
     * MedMinder is a single-account app, but it lives on a public URL. Without
     * this, the Password provider's sign-up flow would let anyone who finds it
     * create an account and read the pharmacy's inventory.
     *
     * The first account to sign up claims the app; afterwards only that account
     * can sign in.
     */
    async createOrUpdateUser(ctx, { existingUserId, profile }) {
      if (existingUserId !== null) return existingUserId;

      const existingUser = await ctx.db.query("users").first();
      if (existingUser !== null) {
        throw new ConvexError(
          "This MedMinder already has an account. Sign in instead.",
        );
      }

      const email = profile.email;
      if (typeof email !== "string" || email.length === 0) {
        throw new ConvexError("An email address is required.");
      }

      const userId = await ctx.db.insert("users", { email });

      // Seed settings now so the digest has somewhere to send to, and so the
      // rest of the app can assume a settings row exists.
      await ctx.db.insert("settings", {
        digestEnabled: true,
        digestEmail: email,
        digestDay: 1,
        digestHour: 8,
        timezone: "Asia/Manila",
        alertTiers: DEFAULT_ALERT_TIERS,
      });

      return userId;
    },
  },
});
