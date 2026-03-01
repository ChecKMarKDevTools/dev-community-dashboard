import { describe, it, expect } from "vitest";
import { POSITIVE_WORDS, NEGATIVE_WORDS } from "./sentiment-keywords";

describe("sentiment-keywords", () => {
  it("exports POSITIVE_WORDS as a non-empty Set", () => {
    expect(POSITIVE_WORDS).toBeInstanceOf(Set);
    expect(POSITIVE_WORDS.size).toBeGreaterThan(0);
  });

  it("exports NEGATIVE_WORDS as a non-empty Set", () => {
    expect(NEGATIVE_WORDS).toBeInstanceOf(Set);
    expect(NEGATIVE_WORDS.size).toBeGreaterThan(0);
  });

  it("has no overlap between positive and negative keywords", () => {
    for (const word of POSITIVE_WORDS) {
      expect(NEGATIVE_WORDS.has(word)).toBe(false);
    }
  });

  it("contains expected positive keywords", () => {
    expect(POSITIVE_WORDS.has("awesome")).toBe(true);
    expect(POSITIVE_WORDS.has("helpful")).toBe(true);
  });

  it("contains expected negative keywords", () => {
    expect(NEGATIVE_WORDS.has("terrible")).toBe(true);
    expect(NEGATIVE_WORDS.has("bug")).toBe(true);
  });
});
