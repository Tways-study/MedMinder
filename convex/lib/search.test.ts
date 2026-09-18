import { describe, expect, it } from "vitest";
import { MIN_SEARCH_LENGTH, matchRank, normalizeQuery } from "./search";

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
