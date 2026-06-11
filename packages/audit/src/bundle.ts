import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PROTOTYPE_DISCLAIMER, type SecurityClass, type VoteType } from "@ecclesia/shared";
import type { TallyResult } from "@ecclesia/tally";
import type { ChainedEvent } from "./hash-chain";
import { canonicalize } from "./jcs";
import { sha256Hex } from "./hash-chain";

export interface BundleElection {
  electionId: string;
  organisationSlug: string;
  title: string;
  voteType: VoteType;
  options: { optionId: string; label: string; position: number }[];
  allowAbstain: boolean;
  allowRevote: boolean;
  votingOpensAt: string;
  votingClosesAt: string;
  engineId: string;
  securityClass: SecurityClass;
  disclaimer: string;
}

export interface BundleCredential {
  publicCredential: string;
  status: "active" | "revoked";
}

/**
 * A ballot record for the verifier. Deliberately carries NO `receiptPhrase` (redline Edit B):
 * receipts live only in `board`, with no join key back to a payload, so a coercer who learns a
 * receipt cannot read the (plaintext, in v0.1) vote.
 */
export interface BundleBallot {
  anonymousBallotId: string;
  publicCredential: string;
  payload: unknown;
  ballotHash: string;
  isReplaced: boolean;
  replacedByBallotId: string | null;
}

/** Inclusion-only board entry. No ballotHash, no payload (redline Edit B / INV-2). */
export interface BundleBoardEntry {
  receiptPhrase: string;
  isReplaced: boolean;
}

export interface BundleAuditEvent extends ChainedEvent {}

export interface BundleManifest {
  /** The three artifact hashes published on the results page (§6.2). */
  electionHash: string;
  ballotsHash: string;
  tallyHash: string;
  hashChainHead: string;
  generatedAt: string;
  verifier: string;
}

export interface AuditBundle {
  election: BundleElection;
  credentials: BundleCredential[];
  ballots: BundleBallot[];
  board: BundleBoardEntry[];
  auditChain: BundleAuditEvent[];
  tally: TallyResult;
  manifest: BundleManifest;
}

export interface BuildBundleParts {
  election: Omit<BundleElection, "disclaimer">;
  credentials: BundleCredential[];
  ballots: BundleBallot[];
  board: BundleBoardEntry[];
  auditChain: BundleAuditEvent[];
  tally: TallyResult;
  generatedAt?: string;
}

const byString = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Assemble a canonical bundle: credentials sorted by value (destroys issuance order, §3.3),
 * ballots sorted by hash (destroys arrival order, redline Edit D), board sorted by phrase.
 * Computes the three artifact hashes over JCS so the verifier reproduces them exactly.
 */
export function buildBundle(parts: BuildBundleParts): AuditBundle {
  const election: BundleElection = { ...parts.election, disclaimer: PROTOTYPE_DISCLAIMER };
  const credentials = [...parts.credentials].sort((a, b) =>
    byString(a.publicCredential, b.publicCredential),
  );
  const ballots = [...parts.ballots].sort((a, b) => byString(a.ballotHash, b.ballotHash));
  const board = [...parts.board].sort((a, b) => byString(a.receiptPhrase, b.receiptPhrase));

  const manifest: BundleManifest = {
    electionHash: sha256Hex(canonicalize(election)),
    ballotsHash: sha256Hex(canonicalize(ballots)),
    tallyHash: sha256Hex(canonicalize(parts.tally)),
    hashChainHead: parts.auditChain.at(-1)?.eventHash ?? "",
    generatedAt: parts.generatedAt ?? new Date().toISOString(),
    verifier: "ecclesia-verify <bundle-dir>",
  };

  return { election, credentials, ballots, board, auditChain: parts.auditChain, tally: parts.tally, manifest };
}

const README = `# Ecclesia Vote — audit bundle

${PROTOTYPE_DISCLAIMER}

This directory is everything a third party needs to recompute this election's result without
touching our database or app code.

## Verify it

    npx ecclesia-verify <this-directory>

Exit code 0 means every check passed:
  - the audit hash chain is intact (audit_chain.json),
  - every ballot's hash equals sha256(JCS(payload)) (ballots.json),
  - every ballot's public credential is in the issued set (credentials.json),
  - the recomputed tally equals the published tally (tally.json),
  - the three artifact hashes match manifest.json.

## Files
  election.json      Election configuration and options.
  credentials.json   Public credential set (sorted; no link to voter identity).
  ballots.json       Anonymous ballot records. NOTE: no receipt phrases here, by design.
  board.json         Receipt phrases for inclusion checks. NOTE: no ballot hashes / payloads.
  audit_chain.json   Append-only, hash-linked event log.
  tally.json         Published result.
  manifest.json      Artifact hashes + chain head.

If our published result and the recomputed result disagree, the recomputed result is
authoritative (INV-6).
`;

/** Write a bundle to a directory as the canonical set of JSON files + README (§6.2). */
export function writeBundleDir(dir: string, bundle: AuditBundle): void {
  mkdirSync(dir, { recursive: true });
  const write = (name: string, data: unknown) =>
    writeFileSync(join(dir, name), JSON.stringify(data, null, 2) + "\n", "utf8");
  write("election.json", bundle.election);
  write("credentials.json", bundle.credentials);
  write("ballots.json", bundle.ballots);
  write("board.json", bundle.board);
  write("audit_chain.json", bundle.auditChain);
  write("tally.json", bundle.tally);
  write("manifest.json", bundle.manifest);
  writeFileSync(join(dir, "README.md"), README, "utf8");
}
