import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ADJECTIVES, ANIMALS, FROZEN_WORDLIST_SHA256, LIST_SIZE, NOUNS } from "./wordlists";

const LISTS = { ADJECTIVES, NOUNS, ANIMALS };

describe("frozen wordlists (§5.1)", () => {
  it("each list has exactly 256 entries (one seed byte per slot)", () => {
    expect(LIST_SIZE).toBe(256);
    for (const [name, list] of Object.entries(LISTS)) {
      expect(list, name).toHaveLength(256);
    }
  });

  it("entries are unique within each list", () => {
    for (const [name, list] of Object.entries(LISTS)) {
      expect(new Set(list).size, name).toBe(list.length);
    }
  });

  it("entries are lowercase a-z, 3-10 letters (no profanity surface, no punctuation)", () => {
    for (const [name, list] of Object.entries(LISTS)) {
      for (const w of list) {
        expect(w, `${name}:${w}`).toMatch(/^[a-z]{3,10}$/);
      }
    }
  });

  it("matches the committed frozen hash (T-INV-9: no silent mid-election change)", () => {
    const canonical = JSON.stringify({ ADJECTIVES, NOUNS, ANIMALS });
    const recomputed = createHash("sha256").update(canonical).digest("hex");
    expect(recomputed).toBe(FROZEN_WORDLIST_SHA256);
  });
});
