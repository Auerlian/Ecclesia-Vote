import { randomBytes } from "node:crypto";
import { RECEIPT_MAX_REDRAWS } from "@ecclesia/shared";
import { ASSEMBLED_RECEIPT_REGEX, deriveAssembly } from "./assembly";

export class ReceiptCollisionError extends Error {
  constructor(public readonly attempts: number) {
    super(`Failed to generate a unique receipt phrase after ${attempts} attempts`);
    this.name = "ReceiptCollisionError";
  }
}

/**
 * Uniform random integer in [0, n) from the CSPRNG via rejection sampling (no modulo bias).
 * Used to draw seed bytes / numbers where unbiased selection matters.
 */
export function randomIntBelow(n: number): number {
  if (!Number.isInteger(n) || n <= 0) throw new Error("n must be a positive integer");
  if (n === 1) return 0;
  const bytesNeeded = Math.ceil(Math.log2(n) / 8);
  const maxVal = 2 ** (bytesNeeded * 8);
  const limit = maxVal - (maxVal % n);
  for (;;) {
    const buf = randomBytes(bytesNeeded);
    let v = 0;
    for (let i = 0; i < buf.length; i++) v = v * 256 + (buf[i] ?? 0);
    if (v < limit) return v % n;
  }
}

/** The shape of a canonical receipt: 3 words + 3 two-digit groups (see assembly.ts). */
export const RECEIPT_PHRASE_REGEX = ASSEMBLED_RECEIPT_REGEX;

/** Draw a fresh vote-independent CSPRNG seed for an assembly. */
export function freshSeedHex(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Generate a fresh canonical receipt phrase (redline Edit B / INV-9). The phrase is the canonical
 * value `V` of a randomly seeded assembly — identical in form to what a voter would seal by hand
 * (docs/receipt-design.md). Pure CSPRNG seed, no identity/vote input.
 */
export function generateReceiptPhrase(): string {
  return deriveAssembly(freshSeedHex()).canonical;
}

export type ReceiptTakenCheck = (phrase: string) => boolean;

/**
 * Generate a canonical phrase not already taken for this election (§5.1 collision-redraw loop).
 * Collision is checked on the canonical value, so equivalent skins can never alias two ballots.
 */
export function generateUniqueReceiptPhrase(
  isTaken: ReceiptTakenCheck,
  maxRedraws: number = RECEIPT_MAX_REDRAWS,
): string {
  for (let attempt = 1; attempt <= maxRedraws; attempt++) {
    const phrase = generateReceiptPhrase();
    if (!isTaken(phrase)) return phrase;
  }
  throw new ReceiptCollisionError(maxRedraws);
}
