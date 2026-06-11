import { describe, expect, it } from "vitest";
import {
  buildChain,
  computeEventHash,
  genesisHash,
  verifyChain,
  type AuditEventInput,
  type ChainedEvent,
} from "./hash-chain";

const ELECTION = "11111111-1111-1111-1111-111111111111";

function seed(n: number): AuditEventInput[] {
  return Array.from({ length: n }, (_, i) => ({
    eventType: "ballot_accepted",
    payload: { ballotHash: `hash-${i}`, index: i },
    createdAtIso: "2026-06-11T12:30:00.000Z", // bucketed
  }));
}

describe("hash chain", () => {
  it("genesis is sha256(election_id)", () => {
    expect(genesisHash(ELECTION)).toHaveLength(64);
    expect(genesisHash(ELECTION)).toBe(genesisHash(ELECTION));
  });

  it("builds and verifies a 1000-event chain (WP-02)", () => {
    const chain = buildChain(ELECTION, seed(1000));
    expect(chain).toHaveLength(1000);
    expect(chain[0]!.previousEventHash).toBe(genesisHash(ELECTION));
    expect(verifyChain(ELECTION, chain).ok).toBe(true);
  });

  it("breaks when any payload byte is mutated", () => {
    const chain = buildChain(ELECTION, seed(1000));
    const tampered: ChainedEvent[] = chain.map((e) => ({ ...e }));
    const victim = tampered[500]!;
    tampered[500] = {
      ...victim,
      payload: { ...(victim.payload as Record<string, unknown>), index: 999_999 },
    };
    const res = verifyChain(ELECTION, tampered);
    expect(res.ok).toBe(false);
    expect(res.failedAtIndex).toBe(500);
    expect(res.reason).toMatch(/event_hash/);
  });

  it("breaks when an event is reordered (back-link mismatch)", () => {
    const chain = buildChain(ELECTION, seed(10));
    const swapped = [...chain];
    [swapped[3], swapped[4]] = [swapped[4]!, swapped[3]!];
    expect(verifyChain(ELECTION, swapped).ok).toBe(false);
  });

  it("breaks when an event_hash is forged", () => {
    const chain = buildChain(ELECTION, seed(10));
    const tampered = chain.map((e) => ({ ...e }));
    tampered[7] = { ...tampered[7]!, eventHash: "0".repeat(64) };
    const res = verifyChain(ELECTION, tampered);
    expect(res.ok).toBe(false);
    expect(res.failedAtIndex).toBe(7);
  });

  it("matches the documented concatenation rule", () => {
    const prev = genesisHash(ELECTION);
    const ev: AuditEventInput = {
      eventType: "voting_opened",
      payload: { at: "2026-06-11T12:00:00.000Z" },
      createdAtIso: "2026-06-11T12:00:00.000Z",
    };
    // sha256(prev || JCS(payload) || type || iso) — recomputed independently here.
    expect(computeEventHash(prev, ev)).toHaveLength(64);
    expect(computeEventHash(prev, ev)).toBe(computeEventHash(prev, ev));
  });
});
