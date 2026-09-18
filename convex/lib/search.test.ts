import { describe, expect, it } from "vitest";
import { MIN_SEARCH_LENGTH, matchRank, normalizeQuery, parseSearch } from "./search";

const amox = { name: "Amoxicillin", genericName: "Amoxicillin trihydrate", sku: "AMX-500" };
const coAmox = { name: "Co-Amoxiclav", genericName: undefined, sku: undefined };
const biogesic = { name: "Biogesic", genericName: "Paracetamol", sku: "BIO-500" };

describe("normalizeQuery", () => {
  it("trims and lowercases", () => {
    expect(normalizeQuery("  AMOX ")).toBe("amox");
  });

  it(`returns null below ${MIN_SEARCH_LENGTH} characters`, () => {
    expect(normalizeQuery("a")).toBeNull();
    expect(normalizeQuery("  b  ")).toBeNull();
    expect(normalizeQuery("")).toBeNull();
  });
});

describe("matchRank", () => {
  it("ranks an exact name match best", () => {
    expect(matchRank(amox, "amoxicillin")).toBe(0);
  });

  it("ranks a name prefix above a later word in the name", () => {
    expect(matchRank(amox, "amox")).toBeLessThan(matchRank(coAmox, "amox")!);
  });

  it("ranks a word start above a mid-word substring", () => {
    expect(matchRank(biogesic, "para")).toBeLessThan(matchRank(amox, "cillin")!);
  });

  it("still matches mid-word text in name, generic name, or SKU", () => {
    expect(matchRank(amox, "cillin")).not.toBeNull();
    expect(matchRank(biogesic, "cetam")).not.toBeNull();
    expect(matchRank(biogesic, "o-50")).not.toBeNull();
  });

  it("returns null when nothing matches", () => {
    expect(matchRank(biogesic, "zzz")).toBeNull();
  });
});

describe("parseSearch", () => {
  it("passes plain text through as the text query", () => {
    expect(parseSearch("amox")).toEqual({ text: "amox", statuses: [], lowStock: false });
  });

  it("pulls status words out of the query", () => {
    expect(parseSearch("expired")).toEqual({
      text: null,
      statuses: ["expired"],
      lowStock: false,
    });
    expect(parseSearch("Critical amox")).toEqual({
      text: "amox",
      statuses: ["critical"],
      lowStock: false,
    });
  });

  it("accepts several statuses and the words the app shows", () => {
    expect(parseSearch("expired critical soon watch").statuses).toEqual([
      "expired",
      "critical",
      "warning",
      "watch",
    ]);
    expect(parseSearch("in date").statuses).toEqual(["ok"]);
    expect(parseSearch("no expiry").statuses).toEqual(["none"]);
  });

  it("reads 'low stock' and 'low' as the low-stock filter", () => {
    expect(parseSearch("low stock para")).toEqual({
      text: "para",
      statuses: [],
      lowStock: true,
    });
    expect(parseSearch("low").lowStock).toBe(true);
  });

  it("only takes whole words, so names containing a status word still search", () => {
    expect(parseSearch("watchful").text).toBe("watchful");
    expect(parseSearch("low-dose").text).toBe("low-dose");
  });

  it("applies the minimum length to what is left after status words", () => {
    expect(parseSearch("critical a")).toEqual({
      text: null,
      statuses: ["critical"],
      lowStock: false,
    });
  });
});
