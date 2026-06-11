import { describe, expect, it } from "vitest";
import {
  ASSEMBLED_RECEIPT_REGEX,
  assembleDisplay,
  canonicalizeReceipt,
  deriveAssembly,
  NUMBER_SLOTS,
  WORD_SLOTS,
} from "./assembly";

function cartesian(slots: string[][]): string[][] {
  return slots.reduce<string[][]>(
    (acc, opts) => acc.flatMap((prefix) => opts.map((o) => [...prefix, o])),
    [[]],
  );
}

const SEED = "0123456789abcdef0123456789abcdef";

describe("deriveAssembly", () => {
  it("is deterministic for a seed", () => {
    const a = deriveAssembly(SEED);
    const b = deriveAssembly(SEED);
    expect(a.canonical).toBe(b.canonical);
    expect(a.slots.map((s) => s.options)).toEqual(b.slots.map((s) => s.options));
  });

  it("produces 6 slots (3 words + 3 numbers), 4 skins each", () => {
    const { slots } = deriveAssembly(SEED);
    expect(slots).toHaveLength(WORD_SLOTS + NUMBER_SLOTS);
    expect(slots.filter((s) => s.kind === "word")).toHaveLength(3);
    expect(slots.filter((s) => s.kind === "number")).toHaveLength(3);
    for (const s of slots) expect(s.options).toHaveLength(4);
  });

  it("canonical matches the assembled-receipt format", () => {
    expect(deriveAssembly(SEED).canonical).toMatch(ASSEMBLED_RECEIPT_REGEX);
  });

  it("different seeds almost always give different canonicals", () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(deriveAssembly(`seed-${i}`).canonical);
    expect(set.size).toBeGreaterThan(990);
  });
});

describe("the equivalence invariant (docs/receipt-design.md §8.1)", () => {
  it("ALL 4096 pick combinations canonicalize to the same V", () => {
    const { slots, canonical } = deriveAssembly(SEED);
    const combos = cartesian(slots.map((s) => s.options));
    expect(combos).toHaveLength(4 ** 6);
    for (const combo of combos) {
      expect(canonicalizeReceipt(assembleDisplay(combo))).toBe(canonical);
    }
  });

  it("holds across many seeds (sampled)", () => {
    for (let i = 0; i < 50; i++) {
      const { slots, canonical } = deriveAssembly(`s-${i}`);
      // sample one random-ish combo per slot rather than all 4096 each time
      const pick = slots.map((s, idx) => s.options[(i + idx) % 4]!);
      expect(canonicalizeReceipt(assembleDisplay(pick))).toBe(canonical);
    }
  });
});

describe("canonicalizeReceipt", () => {
  it("is idempotent on a canonical receipt (§8.2)", () => {
    const { canonical } = deriveAssembly(SEED);
    expect(canonicalizeReceipt(canonical)).toBe(canonical);
  });

  it("accepts case-insensitively and trims", () => {
    const { canonical } = deriveAssembly(SEED);
    expect(canonicalizeReceipt(`  ${canonical.toUpperCase()}  `)).toBe(canonical);
  });

  it("rejects structurally invalid input", () => {
    expect(canonicalizeReceipt("nonsense")).toBeNull();
    expect(canonicalizeReceipt("not-a-real-word-99-99-99")).toBeNull();
    expect(canonicalizeReceipt("silver-river-otter-4-4-4")).toBeNull(); // 1-digit numbers
  });
});
