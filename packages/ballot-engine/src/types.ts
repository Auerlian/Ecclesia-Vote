import type { Selection, SecurityClass, VoteType } from "@ecclesia/shared";
import type { TallyResult } from "@ecclesia/tally";
import type { AuditBundle } from "@ecclesia/audit";

/** Configuration the engine needs to run an election (a subset of the DB election row, §3.4). */
export interface EngineElectionConfig {
  electionId: string;
  organisationSlug: string;
  title: string;
  voteType: VoteType;
  options: { optionId: string; label: string; position: number }[];
  allowAbstain: boolean;
  allowRevote: boolean;
  votingOpensAt: string;
  votingClosesAt: string;
}

export interface EngineElectionRef {
  engineId: string;
  electionId: string;
}

/**
 * A credential pair. The PRIVATE part is delivered to the voter (out of band, via the credauth
 * zone — §3.5); the server stores only the PUBLIC part. INV-1: the public part is never persisted
 * beside voter identity.
 */
export interface Credential {
  publicCredential: string;
  privateCredential: string;
}
export interface CredentialBatch {
  electionId: string;
  credentials: Credential[];
}

/** What the client commits to: the stored payload and its hash. In v0.1 the payload is plaintext
 *  (mock); in v0.2 it is ciphertext. ballotHash = sha256(JCS(payload)) either way. */
export interface EncryptedBallot {
  payload: unknown;
  ballotHash: string;
}

/** The encryptor that runs in the voter's browser (§6.1 step 3). */
export interface ClientEncryptorBundle {
  engineId: string;
  electionId: string;
  encrypt(selection: Selection): EncryptedBallot;
}

/** A ballot signed with the voter's private credential and submitted on CAST (§6.1 step 5). */
export interface SignedBallot {
  publicCredential: string;
  signature: string;
  encrypted: EncryptedBallot;
}

export interface BallotAcceptance {
  anonymousBallotId: string;
  ballotHash: string;
  acceptedAt: string;
  replacedBallotId: string | null;
}

/** Result of a Benaloh challenge (§0.1, §6.1 step 4). The audited ballot is then DISCARDED. */
export interface AuditReveal {
  ballotHash: string;
  revealedRandomness: unknown;
  claimedPlaintext: Selection;
  /** True iff re-deriving the commitment from the revealed randomness reproduces ballotHash. */
  verified: boolean;
}

/**
 * The single interface all cryptographic ballot handling goes through (INV-5). v0.1 ships
 * MockEngine (PROTOTYPE); v0.2 a BeleniosEngine (E2E_VERIFIABLE) implementing the same shape.
 */
export interface BallotEngine {
  readonly engineId: string;
  readonly securityClass: SecurityClass;

  createElection(config: EngineElectionConfig): Promise<EngineElectionRef>;
  issueCredentials(ref: EngineElectionRef, voterCount: number): Promise<CredentialBatch>;
  getClientEncryptor(ref: EngineElectionRef): Promise<ClientEncryptorBundle>;
  castBallot(ref: EngineElectionRef, ballot: SignedBallot): Promise<BallotAcceptance>;
  auditBallot(
    ref: EngineElectionRef,
    ballot: EncryptedBallot,
    revealToken: string,
  ): Promise<AuditReveal>;
  closeAndTally(ref: EngineElectionRef): Promise<TallyResult>;
  buildVerificationArtifacts(ref: EngineElectionRef): Promise<AuditBundle>;
}
