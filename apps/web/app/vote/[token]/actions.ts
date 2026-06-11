"use server";

import { deriveAssembly, freshSeedHex, mascotSvg } from "@ecclesia/receipt";

/**
 * Begin the receipt-assembly ceremony. Returns a fresh vote-independent seed (server CSPRNG) plus
 * the mascot for its canonical value. The client derives the same options + canonical from the seed
 * (deterministic). The voter's later pick among equivalent skins never changes the canonical, so it
 * is never a channel (docs/receipt-design.md). Non-persisted demo.
 */
export async function beginCeremony(): Promise<{ seedHex: string; mascot: string }> {
  const seedHex = freshSeedHex();
  const canonical = deriveAssembly(seedHex).canonical;
  return { seedHex, mascot: mascotSvg(canonical, 110) };
}
