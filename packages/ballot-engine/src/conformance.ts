import { canonicalize, sha256Hex, verifyChain } from "@ecclesia/audit";
import { tally } from "@ecclesia/tally";
import type { Selection } from "@ecclesia/shared";
import type { BallotEngine, EngineElectionConfig } from "./types";

/**
 * Shared engine conformance kit (§3.4, WP-05). Any engine — MockEngine now, BeleniosEngine in
 * v0.2 — must pass this. It is framework-agnostic: it throws on the first failed check and
 * returns the list of checks that passed. It also encodes redline Edit B as a hard requirement:
 * a conforming bundle keeps receipts off ballot records and ballot hashes off the board.
 */
export interface ConformanceReport {
  checks: string[];
}

export function sampleYesNoConfig(
  electionId = "22222222-2222-2222-2222-222222222222",
): EngineElectionConfig {
  return {
    electionId,
    organisationSlug: "demo-society",
    title: "Adopt the new bylaws?",
    voteType: "yes_no",
    options: [],
    allowAbstain: true,
    allowRevote: true,
    votingOpensAt: "2026-06-01T09:00:00.000Z",
    votingClosesAt: "2026-06-08T17:00:00.000Z",
  };
}

export function sampleMultipleChoiceConfig(
  electionId = "44444444-4444-4444-4444-444444444444",
): EngineElectionConfig {
  return {
    electionId,
    organisationSlug: "demo-society",
    title: "Which venue for the AGM?",
    voteType: "multiple_choice",
    options: [
      { optionId: "opt-hall", label: "Village Hall", position: 0 },
      { optionId: "opt-library", label: "Library", position: 1 },
      { optionId: "opt-online", label: "Online", position: 2 },
    ],
    allowAbstain: true,
    allowRevote: true,
    votingOpensAt: "2026-06-01T09:00:00.000Z",
    votingClosesAt: "2026-06-08T17:00:00.000Z",
  };
}

export async function assertEngineConformance(
  engine: BallotEngine,
  config: EngineElectionConfig,
): Promise<ConformanceReport> {
  const checks: string[] = [];
  const ok = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error(`engine conformance failed: ${msg}`);
    checks.push(msg);
  };

  ok(typeof engine.engineId === "string" && engine.engineId.length > 0, "engineId present");
  ok(
    engine.securityClass === "PROTOTYPE" || engine.securityClass === "E2E_VERIFIABLE",
    "securityClass valid",
  );

  const ref = await engine.createElection(config);
  ok(ref.electionId === config.electionId, "createElection echoes electionId");

  const batch = await engine.issueCredentials(ref, 5);
  ok(batch.credentials.length === 5, "issued the requested credential count");
  ok(new Set(batch.credentials.map((c) => c.publicCredential)).size === 5, "public creds unique");
  ok(
    batch.credentials.every((c) => c.publicCredential !== c.privateCredential),
    "public credential differs from private",
  );

  const sel: Selection =
    config.voteType === "yes_no"
      ? { kind: "yes_no", value: "yes" }
      : { kind: "single", optionId: config.options[0]!.optionId };

  const enc = await engine.getClientEncryptor(ref);
  const e1 = enc.encrypt(sel);
  const e2 = enc.encrypt(sel);
  ok(e1.ballotHash !== e2.ballotHash, "encryption is randomised (distinct hash per encryption)");
  ok(e1.ballotHash === sha256Hex(canonicalize(e1.payload)), "ballotHash = sha256(JCS(payload))");

  const reveal = await engine.auditBallot(ref, e1, "audit-token");
  ok(reveal.verified, "Benaloh audit verifies the commitment");
  ok(
    JSON.stringify(reveal.claimedPlaintext) === JSON.stringify(sel),
    "Benaloh audit reveals the chosen selection",
  );

  const cred = batch.credentials[0]!;
  const cast1 = await engine.castBallot(ref, {
    publicCredential: cred.publicCredential,
    signature: "mock-signature",
    encrypted: enc.encrypt(sel),
  });
  ok(cast1.replacedBallotId === null, "first cast replaces nothing");

  let rejectedUnknown = false;
  try {
    await engine.castBallot(ref, {
      publicCredential: "not-an-issued-credential",
      signature: "x",
      encrypted: enc.encrypt(sel),
    });
  } catch {
    rejectedUnknown = true;
  }
  ok(rejectedUnknown, "cast with an unissued credential is rejected");

  const second: Selection =
    config.voteType === "yes_no" ? { kind: "yes_no", value: "no" } : sel;
  const cast2 = await engine.castBallot(ref, {
    publicCredential: cred.publicCredential,
    signature: "mock-signature",
    encrypted: enc.encrypt(second),
  });
  ok(cast2.replacedBallotId === cast1.anonymousBallotId, "revote replaces the prior ballot (INV-3)");

  const result = await engine.closeAndTally(ref);
  ok(result.accepted === 1, "tally counts one current ballot per credential (replaced excluded)");

  const bundle = await engine.buildVerificationArtifacts(ref);
  ok(verifyChain(config.electionId, bundle.auditChain).ok, "bundle audit chain verifies");
  ok(
    bundle.ballots.every((b) => !("receiptPhrase" in b)),
    "Edit B: ballot records carry no receipt phrase",
  );
  ok(
    bundle.board.every((entry) => !("ballotHash" in entry)),
    "Edit B: board entries carry no ballot hash",
  );

  const recomputed = tally({
    voteType: bundle.election.voteType,
    optionIds: bundle.election.options.map((o) => o.optionId),
    selections: bundle.ballots
      .filter((b) => !b.isReplaced)
      .map((b) => (b.payload as { selection: Selection }).selection),
  });
  ok(
    sha256Hex(canonicalize(recomputed)) === sha256Hex(canonicalize(bundle.tally)),
    "recomputed tally equals published tally (INV-6)",
  );
  ok(bundle.manifest.tallyHash === sha256Hex(canonicalize(bundle.tally)), "manifest tally hash ok");
  ok(
    bundle.manifest.ballotsHash === sha256Hex(canonicalize(bundle.ballots)),
    "manifest ballots hash ok",
  );

  return { checks };
}
