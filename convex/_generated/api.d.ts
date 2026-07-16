/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as batches from "../batches.js";
import type * as counts from "../counts.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as deliveries from "../deliveries.js";
import type * as devReset from "../devReset.js";
import type * as digest from "../digest.js";
import type * as http from "../http.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_digest from "../lib/digest.js";
import type * as lib_digestEmail from "../lib/digestEmail.js";
import type * as lib_guards from "../lib/guards.js";
import type * as lib_inventory from "../lib/inventory.js";
import type * as medicines from "../medicines.js";
import type * as migrations from "../migrations.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  batches: typeof batches;
  counts: typeof counts;
  crons: typeof crons;
  dashboard: typeof dashboard;
  deliveries: typeof deliveries;
  devReset: typeof devReset;
  digest: typeof digest;
  http: typeof http;
  "lib/dates": typeof lib_dates;
  "lib/digest": typeof lib_digest;
  "lib/digestEmail": typeof lib_digestEmail;
  "lib/guards": typeof lib_guards;
  "lib/inventory": typeof lib_inventory;
  medicines: typeof medicines;
  migrations: typeof migrations;
  seed: typeof seed;
  settings: typeof settings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
