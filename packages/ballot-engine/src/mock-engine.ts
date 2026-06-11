import { randomBytes } from "node:crypto";
import { ENGINE_IDS, bucketIso, type SecurityClass, type Selection } from "@ecclesia/shared";
import {
  buildBundle,
  buildChain,
  canonicalize,
  sha256Hex,
  type AuditBundle,
  type AuditEventInput,
  type BundleBallot,
  type BundleBoardEntry,
} from "@ecclesia/audit";
import { generateUniqueReceiptPhrase } from "@ecclesia/receipt";
import { tally, type TallyResult } from "@ecclesia/tally";
import type {
  BallotAcceptance,
  BallotEngine,
  ClientEncryptorBundle,
  CredentialBatch,
  EncryptedBallot,
  EngineElectionConfig,
  EngineElectionRef,
  SignedBallot,
  AuditReveal,
} from "./types";

interface StoredBallot {
  anonymousBallotId: string;
  publicCredential: string;
  payload: { engineId: string; selection: Selection; nonce: string };
  ballotHash: string;
  receiptPhrase: string; // internal only — NEVER exported alongside the payload (Edit B)
  isReplaced: boolean;
  replacedByBallotId: string | null;
  acceptedAtIso: string;
}

interface StoredElection {
  config: EngineElectionConfig;
  publicCredentials: Set<string>;
  ballots: StoredBallot[];
  takenReceipts: Set<string>;
  events: AuditEventInput[];
}

function hex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * MockEngine — PROTOTYPE security class (§3.4). No real encryption or signatures: the "ciphertext"
 * is the plaintext selection plus a nonce, and "signatures" are accepted without verification.
 * It exists to prove the UX and data flows, and to produce a complete audit bundle the standalone
 * verifier can check end-to-end without a database. A persistent prototype-security banner must be
 * shown whenever this engine is active.
 */
export class MockEngine implements BallotEngine {
  readonly engineId = ENGINE_IDS.mock;
  readonly securityClass: SecurityClass = "PROTOTYPE";

  private readonly store = new Map<string, StoredElection>();

  private get(ref: EngineElectionRef): StoredElection {
    const e = this.store.get(ref.electionId);
    if (!e) throw new Error(`unknown election ${ref.electionId}`);
    return e;
  }

  async createElection(config: EngineElectionConfig): Promise<EngineElectionRef> {
    this.store.set(config.electionId, {
      config,
      publicCredentials: new Set(),
      ballots: [],
      takenReceipts: new Set(),
      events: [
        {
          eventType: "election_created",
          payload: { electionId: config.electionId, voteType: config.voteType },
          createdAtIso: new Date().toISOString(),
        },
      ],
    });
    return { engineId: this.engineId, electionId: config.electionId };
  }

  async issueCredentials(ref: EngineElectionRef, voterCount: number): Promise<CredentialBatch> {
    const e = this.get(ref);
    const credentials = Array.from({ length: voterCount }, () => {
      const privateCredential = hex(24);
      const publicCredential = sha256Hex(privateCredential); // public = H(private); one-way
      e.publicCredentials.add(publicCredential);
      return { publicCredential, privateCredential };
    });
    e.events.push({
      eventType: "credentials_issued",
      payload: { count: voterCount }, // count only — no PII, no per-voter linkage (§4.2)
      createdAtIso: new Date().toISOString(),
    });
    return { electionId: ref.electionId, credentials };
  }

  async getClientEncryptor(ref: EngineElectionRef): Promise<ClientEncryptorBundle> {
    const engineId = this.engineId;
    return {
      engineId,
      electionId: ref.electionId,
      encrypt(selection: Selection): EncryptedBallot {
        const nonce = hex(16);
        const payload = { engineId, selection, nonce };
        return { payload, ballotHash: sha256Hex(canonicalize(payload)) };
      },
    };
  }

  async auditBallot(
    _ref: EngineElectionRef,
    ballot: EncryptedBallot,
    _revealToken: string,
  ): Promise<AuditReveal> {
    // Benaloh challenge: reveal the randomness and confirm the commitment. In the mock the payload
    // is plaintext, so we read the selection and nonce straight out and recompute the hash. The
    // audited ballot is discarded by the caller and never cast — which is exactly why revealing it
    // can never prove a *cast* vote's content (§0.1).
    const payload = ballot.payload as { engineId: string; selection: Selection; nonce: string };
    const recomputed = sha256Hex(canonicalize(payload));
    return {
      ballotHash: ballot.ballotHash,
      revealedRandomness: { nonce: payload.nonce },
      claimedPlaintext: payload.selection,
      verified: recomputed === ballot.ballotHash,
    };
  }

  async castBallot(ref: EngineElectionRef, ballot: SignedBallot): Promise<BallotAcceptance> {
    const e = this.get(ref);
    if (!e.publicCredentials.has(ballot.publicCredential)) {
      throw new Error("credential is not in the issued set for this election");
    }
    // NOTE: window enforcement (INV-8) is the Edge Function's job, server-side; the engine only
    // owns credential validity and the one-current-ballot-per-credential rule (INV-3).

    const current = e.ballots.find(
      (b) => b.publicCredential === ballot.publicCredential && !b.isReplaced,
    );
    let replacedBallotId: string | null = null;
    if (current) {
      if (!e.config.allowRevote) throw new Error("re-voting is disabled and a ballot already exists");
      current.isReplaced = true; // retire BEFORE inserting new (mirrors DB ordering, INV-3/INV-4)
      replacedBallotId = current.anonymousBallotId;
    }

    const payload = ballot.encrypted.payload as StoredBallot["payload"];
    const stored: StoredBallot = {
      anonymousBallotId: hex(16),
      publicCredential: ballot.publicCredential,
      payload,
      ballotHash: ballot.encrypted.ballotHash,
      receiptPhrase: generateUniqueReceiptPhrase((p) => e.takenReceipts.has(p)),
      isReplaced: false,
      replacedByBallotId: null,
      acceptedAtIso: bucketIso(new Date()),
    };
    e.takenReceipts.add(stored.receiptPhrase);
    e.ballots.push(stored);
    if (current) current.replacedByBallotId = stored.anonymousBallotId;

    if (replacedBallotId) {
      e.events.push({
        eventType: "ballot_replaced",
        payload: { oldBallotHash: current!.ballotHash, newBallotHash: stored.ballotHash },
        createdAtIso: bucketIso(new Date()),
      });
    }
    e.events.push({
      eventType: "ballot_accepted",
      payload: { ballotHash: stored.ballotHash },
      createdAtIso: bucketIso(new Date()),
    });

    return {
      anonymousBallotId: stored.anonymousBallotId,
      ballotHash: stored.ballotHash,
      acceptedAt: stored.acceptedAtIso,
      replacedBallotId,
    };
  }

  async closeAndTally(ref: EngineElectionRef): Promise<TallyResult> {
    const e = this.get(ref);
    const selections = e.ballots.filter((b) => !b.isReplaced).map((b) => b.payload.selection);
    const result = tally({
      voteType: e.config.voteType,
      optionIds: e.config.options.map((o) => o.optionId),
      selections,
    });
    e.events.push({
      eventType: "voting_closed",
      payload: { acceptedBallots: selections.length },
      createdAtIso: new Date().toISOString(),
    });
    e.events.push({
      eventType: "tally_computed",
      payload: { tallyHash: sha256Hex(canonicalize(result)) },
      createdAtIso: new Date().toISOString(),
    });
    return result;
  }

  async buildVerificationArtifacts(ref: EngineElectionRef): Promise<AuditBundle> {
    const e = this.get(ref);
    const result = await this.closeAndTally(ref);

    const ballots: BundleBallot[] = e.ballots.map((b) => ({
      anonymousBallotId: b.anonymousBallotId,
      publicCredential: b.publicCredential,
      payload: b.payload,
      ballotHash: b.ballotHash,
      isReplaced: b.isReplaced,
      replacedByBallotId: b.replacedByBallotId,
      // deliberately NO receiptPhrase here (Edit B)
    }));
    const board: BundleBoardEntry[] = e.ballots.map((b) => ({
      receiptPhrase: b.receiptPhrase,
      isReplaced: b.isReplaced,
      // deliberately NO ballotHash here (Edit B)
    }));

    return buildBundle({
      election: {
        electionId: e.config.electionId,
        organisationSlug: e.config.organisationSlug,
        title: e.config.title,
        voteType: e.config.voteType,
        options: e.config.options,
        allowAbstain: e.config.allowAbstain,
        allowRevote: e.config.allowRevote,
        votingOpensAt: e.config.votingOpensAt,
        votingClosesAt: e.config.votingClosesAt,
        engineId: this.engineId,
        securityClass: this.securityClass,
      },
      credentials: [...e.publicCredentials].map((publicCredential) => ({
        publicCredential,
        status: "active" as const,
      })),
      ballots,
      board,
      auditChain: buildChain(e.config.electionId, e.events),
      tally: result,
    });
  }
}
