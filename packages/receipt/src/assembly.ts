import { ADJECTIVES, ANIMALS, NOUNS } from "./wordlists/wordlists";

/**
 * Voter-assembled receipts (docs/receipt-design.md).
 *
 * The voter picks one of 4 equivalent "skins" per slot. Every skin in a slot decodes to the same
 * class, so all 4^6 pick combinations canonicalize to the SAME value V — the voter assembles a skin
 * of a value the system already fixed (vote-independent). The board stores canonical V; search
 * canonicalizes any skin back to V. No crypto import here on purpose: this runs in the browser and
 * in Node, and the security comes from the *seed* (CSPRNG, supplied by the caller), not from this
 * deterministic derivation.
 */

const WORD_LISTS: readonly (readonly string[])[] = [ADJECTIVES, NOUNS, ANIMALS];
export const WORD_SKINS = 4;
export const WORD_CLASSES = 256 / WORD_SKINS; // 64
export const NUMBER_SKINS = 4;
export const NUMBER_CLASSES = 25; // 100 two-digit codes / 4
export const WORD_SLOTS = WORD_LISTS.length; // 3
export const NUMBER_SLOTS = 3;

export const ASSEMBLED_RECEIPT_REGEX =
  /^[a-z]{3,10}-[a-z]{3,10}-[a-z]{3,10}-\d{2}-\d{2}-\d{2}$/;

// --- deterministic seeded PRNG (pure JS, browser + node) --------------------

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function prngFromSeed(seedHex: string): () => number {
  const seed = xmur3(seedHex);
  return mulberry32(seed());
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const twoDigit = (n: number): string => String(n).padStart(2, "0");

// --- decode (seed-independent: search uses this, no seed needed) ------------

function wordClass(slot: number, word: string): number | null {
  const idx = WORD_LISTS[slot]!.indexOf(word.toLowerCase());
  return idx < 0 ? null : Math.floor(idx / WORD_SKINS);
}
function wordRep(slot: number, cls: number): string {
  return WORD_LISTS[slot]![cls * WORD_SKINS]!;
}
function numberClass(code: string): number | null {
  if (!/^\d{2}$/.test(code)) return null;
  const n = Number(code);
  if (n > NUMBER_CLASSES * NUMBER_SKINS - 1) return null;
  return Math.floor(n / NUMBER_SKINS);
}
function numberRep(cls: number): string {
  return twoDigit(cls * NUMBER_SKINS);
}

// --- public API -------------------------------------------------------------

export interface AssemblySlot {
  kind: "word" | "number";
  /** The 4 equivalent skins, shuffled for display. Every one decodes to the same class. */
  options: string[];
}

export interface ReceiptAssembly {
  slots: AssemblySlot[];
  /** What the board stores. Independent of which skins the voter ends up picking. */
  canonical: string;
}

/**
 * Derive the assembly UI (4 shuffled skins per slot) and the canonical receipt from a
 * vote-independent CSPRNG seed. Deterministic: server and client derive the same thing.
 */
export function deriveAssembly(seedHex: string): ReceiptAssembly {
  const rand = prngFromSeed(seedHex);
  const slots: AssemblySlot[] = [];
  const canonicalParts: string[] = [];

  for (let s = 0; s < WORD_SLOTS; s++) {
    const cls = Math.floor(rand() * WORD_CLASSES);
    const skins = WORD_LISTS[s]!.slice(cls * WORD_SKINS, cls * WORD_SKINS + WORD_SKINS);
    slots.push({ kind: "word", options: shuffle([...skins], rand) });
    canonicalParts.push(wordRep(s, cls));
  }
  for (let s = 0; s < NUMBER_SLOTS; s++) {
    const cls = Math.floor(rand() * NUMBER_CLASSES);
    const base = cls * NUMBER_SKINS;
    const skins = [base, base + 1, base + 2, base + 3].map(twoDigit);
    slots.push({ kind: "number", options: shuffle(skins, rand) });
    canonicalParts.push(numberRep(cls));
  }

  return { slots, canonical: canonicalParts.join("-") };
}

/** Join a voter's chosen skins into the displayed receipt string. */
export function assembleDisplay(picks: readonly string[]): string {
  return picks.join("-");
}

/**
 * Canonicalize any skin combination (or an already-canonical receipt) back to V. Returns null if
 * the input isn't a structurally valid assembled receipt. Seed-independent — this is all the
 * receipt search needs.
 */
export function canonicalizeReceipt(input: string): string | null {
  const parts = input.trim().toLowerCase().split("-");
  if (parts.length !== WORD_SLOTS + NUMBER_SLOTS) return null;

  const out: string[] = [];
  for (let s = 0; s < WORD_SLOTS; s++) {
    const cls = wordClass(s, parts[s]!);
    if (cls === null) return null;
    out.push(wordRep(s, cls));
  }
  for (let s = 0; s < NUMBER_SLOTS; s++) {
    const cls = numberClass(parts[WORD_SLOTS + s]!);
    if (cls === null) return null;
    out.push(numberRep(cls));
  }
  return out.join("-");
}
