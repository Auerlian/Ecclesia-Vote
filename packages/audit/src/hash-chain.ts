import { createHash } from "node:crypto";
import { canonicalize } from "./jcs";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Genesis link for an election's chain: previous_event_hash = sha256(election_id) (§4.2). */
export function genesisHash(electionId: string): string {
  return sha256Hex(electionId);
}

export interface AuditEventInput {
  eventType: string;
  payload: unknown;
  /** ISO-8601. For ballot_accepted/ballot_replaced this is the BUCKETED time (redline Edit D). */
  createdAtIso: string;
}

export interface ChainedEvent extends AuditEventInput {
  previousEventHash: string;
  eventHash: string;
}

/**
 * The one hash rule (§4.2), implemented identically here, in the Postgres SECURITY DEFINER
 * writer, and in the standalone verifier:
 *
 *   event_hash = sha256( previous_event_hash || JCS(event_payload) || event_type || iso8601(created_at) )
 */
export function computeEventHash(previousEventHash: string, ev: AuditEventInput): string {
  return sha256Hex(previousEventHash + canonicalize(ev.payload) + ev.eventType + ev.createdAtIso);
}

/** Build a chained log from ordered events, starting at the election's genesis link. */
export function buildChain(electionId: string, events: readonly AuditEventInput[]): ChainedEvent[] {
  let previousEventHash = genesisHash(electionId);
  const chain: ChainedEvent[] = [];
  for (const ev of events) {
    const eventHash = computeEventHash(previousEventHash, ev);
    chain.push({ ...ev, previousEventHash, eventHash });
    previousEventHash = eventHash;
  }
  return chain;
}

export interface ChainVerification {
  ok: boolean;
  failedAtIndex?: number;
  reason?: string;
}

/**
 * Re-walk a chain and confirm every link. Returns the first failing index and why. Any mutated
 * payload byte, reordered event, or broken back-link makes this fail (T-INV-4 / WP-02 / WP-08).
 */
export function verifyChain(
  electionId: string,
  events: readonly ChainedEvent[],
): ChainVerification {
  let expectedPrev = genesisHash(electionId);
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]!;
    if (ev.previousEventHash !== expectedPrev) {
      return { ok: false, failedAtIndex: i, reason: "previous_event_hash does not chain" };
    }
    const recomputed = computeEventHash(ev.previousEventHash, ev);
    if (recomputed !== ev.eventHash) {
      return { ok: false, failedAtIndex: i, reason: "event_hash does not match payload" };
    }
    expectedPrev = ev.eventHash;
  }
  return { ok: true };
}
