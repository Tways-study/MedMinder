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
