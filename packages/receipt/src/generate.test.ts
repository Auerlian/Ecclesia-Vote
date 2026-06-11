import { describe, expect, it } from "vitest";
import { ADJECTIVES, ANIMALS, NOUNS } from "./wordlists/wordlists";
import { canonicalizeReceipt } from "./assembly";
import {
  generateReceiptPhrase,
  generateUniqueReceiptPhrase,
  randomIntBelow,
  ReceiptCollisionError,
  RECEIPT_PHRASE_REGEX,
} from "./generate";

describe("randomIntBelow", () => {
  it("stays in range and covers the space", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 5000; i++) {
      const v = randomIntBelow(256);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(256);
      seen.add(v);
    }
    expect(seen.size).toBeGreaterThan(200); // not stuck on a few values
  });

  it("rejects non-positive n", () => {
    expect(() => randomIntBelow(0)).toThrow();
    expect(() => randomIntBelow(-3)).toThrow();
  });
});

describe("generateReceiptPhrase", () => {
  it("matches the canonical format, is itself canonical, and draws from the wordlists", () => {
    const adj = new Set(ADJECTIVES);
    const noun = new Set(NOUNS);
    const animal = new Set(ANIMALS);
    for (let i = 0; i < 2000; i++) {
      const phrase = generateReceiptPhrase();
      expect(phrase).toMatch(RECEIPT_PHRASE_REGEX);
      // a system-generated phrase is already canonical (it's the representative of each class)
      expect(canonicalizeReceipt(phrase)).toBe(phrase);
      const [a, n, an] = phrase.split("-");
      expect(adj.has(a!)).toBe(true);
      expect(noun.has(n!)).toBe(true);
      expect(animal.has(an!)).toBe(true);
    }
  });
});

describe("generateUniqueReceiptPhrase", () => {
  it(
    "generates 100k unique receipts for one election with zero post-redraw collisions (WP-05)",
    () => {
      const seen = new Set<string>();
      for (let i = 0; i < 100_000; i++) {
        const phrase = generateUniqueReceiptPhrase((p) => seen.has(p));
        expect(seen.has(phrase)).toBe(false);
        seen.add(phrase);
      }
      expect(seen.size).toBe(100_000);
    },
    30_000,
  );

  it("throws ReceiptCollisionError when everything is taken", () => {
    expect(() => generateUniqueReceiptPhrase(() => true, 5)).toThrow(ReceiptCollisionError);
  });
});

describe("non-derivation property (INV-9 / redline Edit B)", () => {
  it("takes no input — structurally cannot be a function of identity or choice", () => {
    // The strongest guarantee: there is no argument to derive from. (Note: substring tests
    // against words like "no"/"secret" are meaningless here — those are legitimate fragments of
    // dictionary entries; receipt-freeness comes from there being no input at all.)
    expect(generateReceiptPhrase.length).toBe(0);
  });

  it("never contains verbatim identity tokens (emails, names, @, spaces, uppercase)", () => {
    const identities = ["jameslapslie@gmail.com", "Alice Smith", "BOB_JONES", "member-00042"];
    for (let i = 0; i < 20_000; i++) {
      const phrase = generateReceiptPhrase();
      expect(phrase).not.toMatch(/[A-Z@\s_]/); // a real email/name can never appear verbatim
      for (const id of identities) {
        expect(phrase.includes(id), `${phrase} contained ${id}`).toBe(false);
      }
    }
  });

  it("produces high-entropy, non-constant output", () => {
    const sample = Array.from({ length: 5000 }, () => generateReceiptPhrase());
    expect(new Set(sample).size).toBeGreaterThan(4900);
  });
});
