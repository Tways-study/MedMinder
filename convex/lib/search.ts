import type { ExpiryStatus } from "./medicineFilters";

/**
 * One letter matches most of the shelf, which reads as "search is broken"
 * rather than "search is working" — so a query needs two characters first.
 */
export const MIN_SEARCH_LENGTH = 2;

type Searchable = {
  name: string;
  genericName?: string;
  sku?: string;
};

/** Trimmed, lowercased query, or null when it is too short to search. */
export function normalizeQuery(q: string): string | null {
  const needle = q.trim().toLowerCase();
  return needle.length >= MIN_SEARCH_LENGTH ? needle : null;
}

function startsAWord(haystack: string, needle: string): boolean {
  return haystack.split(/[^a-z0-9]+/).some((word) => word.startsWith(needle));
}

/**
 * How well a medicine matches a normalized query — lower is better, null is no
 * match. The brand name is what's on the box in hand, so name matches outrank
 * generic-name and SKU matches; mid-word text still matches, but last.
 */
export function matchRank(medicine: Searchable, needle: string): number | null {
  const name = medicine.name.toLowerCase();
  if (name === needle) return 0;
  if (name.startsWith(needle)) return 1;
  if (startsAWord(name, needle)) return 2;

  const others = [medicine.genericName, medicine.sku]
    .filter((h): h is string => h !== undefined)
    .map((h) => h.toLowerCase());
  if (others.some((h) => startsAWord(h, needle))) return 3;

  if ([name, ...others].some((h) => h.includes(needle))) return 4;
  return null;
}

/**
 * Status words a person might type into the search bar, mapped to the filter
 * they mean. Includes the labels the app shows ("soon", "in date") alongside
 * the words people say out loud ("warning", "good").
 */
const STATUS_WORDS: Array<[string[], ExpiryStatus | "low"]> = [
  [["no", "expiry"], "none"],
  [["in", "date"], "ok"],
  [["low", "stock"], "low"],
  [["expired"], "expired"],
  [["critical"], "critical"],
  [["soon"], "warning"],
  [["warning"], "warning"],
  [["watch"], "watch"],
  [["good"], "ok"],
  [["undated"], "none"],
  [["low"], "low"],
];

export type ParsedSearch = {
  /** The name/generic/SKU query, or null when too short to search. */
  text: string | null;
  statuses: ExpiryStatus[];
  lowStock: boolean;
};

/**
 * Splits a search-bar query into status words and the text to match against
 * names, so "critical amox" finds critical Amoxicillin. Only whole words
 * count, so "watchful" or "low-dose" still search as text.
 */
export function parseSearch(q: string): ParsedSearch {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const statuses: ExpiryStatus[] = [];
  let lowStock = false;
  const rest: string[] = [];

  for (let i = 0; i < words.length; ) {
    const hit = STATUS_WORDS.find(([phrase]) =>
      phrase.every((w, j) => words[i + j] === w),
    );
    if (hit === undefined) {
      rest.push(words[i]);
      i += 1;
      continue;
    }
    const [phrase, status] = hit;
    if (status === "low") lowStock = true;
    else if (!statuses.includes(status)) statuses.push(status);
    i += phrase.length;
  }

  return { text: normalizeQuery(rest.join(" ")), statuses, lowStock };
}
