import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isValidQuantity } from "./inventory";

/**
 * Every function that touches inventory calls this first.
 *
 * MedMinder is single-account, but "there is only one user" is not an access
 * control decision — without this, an unauthenticated caller could read the
 * pharmacy's whole inventory straight off the public deployment URL.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not signed in.");
  }
  return userId;
}

/**
 * Quantities arrive from hand-typed forms. `v.number()` accepts NaN, Infinity
 * and negatives, any of which would silently corrupt a batch balance, so every
 * quantity is range-checked before it reaches the database.
 */
export function assertQuantity(value: number, field: string): number {
  if (!isValidQuantity(value)) {
    throw new ConvexError(
      `${field} must be a whole number of units, zero or more.`,
    );
  }
  return value;
}

/** Expiry dates are compared against now, so a NaN date would silently never alert. */
export function assertTimestamp(value: number, field: string): number {
  if (!Number.isFinite(value)) {
    throw new ConvexError(`${field} must be a valid date.`);
  }
  return value;
}

export function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ConvexError(`${field} is required.`);
  }
  return trimmed;
}
