// SERVER-ONLY demo data layer. Drives the UI from the REAL MockEngine + receipt/tally/audit
// packages, so every page shows genuine artifacts (real receipts, a real tally, a real audit
// bundle the standalone verifier accepts) without needing a database. v0.2 swaps this module for
// Supabase-backed queries. Do not import from a Client Component (pulls in node:crypto/fs).

import type { AuditBundle } from "@ecclesia/audit";
import { MockEngine, type EngineElectionConfig } from "@ecclesia/ballot-engine";
import { canonicalizeReceipt } from "@ecclesia/receipt";
import {
  receiptLookupResponseSchema,
  type ReceiptLookupResponse,
  type Selection,
} from "@ecclesia/shared";
import { PRESIDENT_CANDIDATES } from "./candidates";

export const DEMO_ORG_SLUG = "demo-society";
export const DEMO_ORG_NAME = "Demo Society";

/** Bylaws referendum — yes/no. */
export const DEMO_ELECTION_ID = "0de70000-0000-4000-8000-00000000d3m0";
/** Presidential election — multiple choice across four candidates. */
export const PRESIDENT_ELECTION_ID = "0de70000-0000-4000-8000-0000000e1ec7";

/** Vote-link tokens (demo stand-ins for real credential links). */
export const VOTE_TOKENS: Record<string, string> = {
  "demo-token": DEMO_ELECTION_ID,
  "president-token": PRESIDENT_ELECTION_ID,
};

export interface DemoElection {
  bundle: AuditBundle;
  eligible: number;
  exampleReceipt: string;
  replacedReceipt: string | null;
  /** Token for /vote/[token] links. */
  voteToken: string;
}

export interface DemoData {
  elections: Record<string, DemoElection>;
}

let demoPromise: Promise<DemoData> | null = null;

const sel = (v: "yes" | "no" | "abstain"): Selection =>
  v === "abstain" ? { kind: "abstain" } : { kind: "yes_no", value: v };
const pick = (optionId: string): Selection => ({ kind: "single", optionId });

async function buildElection(
  engine: MockEngine,
  cfg: EngineElectionConfig,
  eligible: number,
  plan: Selection[],
  voteToken: string,
  revote?: { voterIndex: number; selection: Selection },
): Promise<DemoElection> {
  const ref = await engine.createElection(cfg);
  const batch = await engine.issueCredentials(ref, eligible);
  const enc = await engine.getClientEncryptor(ref);

  for (let i = 0; i < plan.length; i++) {
    await engine.castBallot(ref, {
      publicCredential: batch.credentials[i]!.publicCredential,
      signature: "demo",
      encrypted: enc.encrypt(plan[i]!),
    });
  }
  // Optionally one voter changes their mind — the wall shows their first receipt struck through.
  if (revote) {
    await engine.castBallot(ref, {
      publicCredential: batch.credentials[revote.voterIndex]!.publicCredential,
      signature: "demo",
      encrypted: enc.encrypt(revote.selection),
    });
  }

  const bundle = await engine.buildVerificationArtifacts(ref);
  const current = bundle.board.find((b) => !b.isReplaced) ?? null;
  const replaced = bundle.board.find((b) => b.isReplaced) ?? null;
  return {
    bundle,
    eligible,
    exampleReceipt: current?.receiptPhrase ?? "",
    replacedReceipt: replaced?.receiptPhrase ?? null,
    voteToken,
  };
}

async function build(): Promise<DemoData> {
  const engine = new MockEngine();
  const now = Date.now();
  const hour = 3_600_000;

  const bylaws = await buildElection(
    engine,
    {
      electionId: DEMO_ELECTION_ID,
      organisationSlug: DEMO_ORG_SLUG,
      title: "Adopt the proposed new bylaws?",
      voteType: "yes_no",
      options: [],
      allowAbstain: true,
      allowRevote: true,
      votingOpensAt: new Date(now - 3 * hour).toISOString(),
      votingClosesAt: new Date(now + 6 * hour).toISOString(),
    },
    20,
    (
      [
        "yes",
        "yes",
        "no",
        "yes",
        "abstain",
        "no",
        "yes",
        "no",
        "yes",
        "yes",
        "no",
        "abstain",
        "yes",
        "no",
        "yes",
        "yes",
      ] as const
    ).map(sel),
    "demo-token",
    { voterIndex: 0, selection: sel("no") },
  );

  const president = await buildElection(
    engine,
    {
      electionId: PRESIDENT_ELECTION_ID,
      organisationSlug: DEMO_ORG_SLUG,
      title: "Society President — Spring Election",
      voteType: "multiple_choice",
      options: PRESIDENT_CANDIDATES.map((c, position) => ({
        optionId: c.optionId,
        label: c.name,
        position,
      })),
      allowAbstain: true,
      allowRevote: true,
      votingOpensAt: new Date(now - 26 * hour).toISOString(),
      votingClosesAt: new Date(now + 51 * hour).toISOString(),
    },
    24,
    [
      pick("cand-aisha"),
      pick("cand-ben"),
      pick("cand-aisha"),
      pick("cand-chloe"),
      pick("cand-aisha"),
      pick("cand-dev"),
      pick("cand-ben"),
      pick("cand-aisha"),
      pick("cand-chloe"),
      pick("cand-aisha"),
      pick("cand-ben"),
      pick("cand-aisha"),
      { kind: "abstain" },
      pick("cand-aisha"),
      pick("cand-ben"),
      pick("cand-chloe"),
      pick("cand-aisha"),
      pick("cand-ben"),
    ],
    "president-token",
    { voterIndex: 1, selection: pick("cand-aisha") },
  );

  return {
    elections: {
      [DEMO_ELECTION_ID]: bylaws,
      [PRESIDENT_ELECTION_ID]: president,
    },
  };
}

export function getDemo(): Promise<DemoData> {
  if (!demoPromise) demoPromise = build();
  return demoPromise;
}

/** Election for an id, falling back to the bylaws referendum for unknown ids. */
export async function getDemoElection(electionId: string): Promise<DemoElection> {
  const { elections } = await getDemo();
  return elections[electionId] ?? elections[DEMO_ELECTION_ID]!;
}

/** All demo elections in display order (soonest-closing first). */
export async function getDemoElections(): Promise<DemoElection[]> {
  const { elections } = await getDemo();
  return Object.values(elections).sort(
    (a, b) =>
      new Date(a.bundle.election.votingClosesAt).getTime() -
      new Date(b.bundle.election.votingClosesAt).getTime(),
  );
}

/**
 * INV-2 — inclusion status ONLY. Returns included / included_replaced / not_found and nothing
 * else, validated against the closed schema from @ecclesia/shared. There is no code path here
 * that could return, encode, or correlate with a vote choice.
 */
export async function lookupReceipt(
  electionId: string,
  phrase: string,
): Promise<ReceiptLookupResponse> {
  const { bundle } = await getDemoElection(electionId);
  // Canonicalize the query so any equivalent skin the voter assembled finds the canonical entry.
  const needle = canonicalizeReceipt(phrase) ?? phrase.trim().toLowerCase();
  const entry = bundle.board.find((b) => b.receiptPhrase === needle);
  const status = !entry ? "not_found" : entry.isReplaced ? "included_replaced" : "included";
  return receiptLookupResponseSchema.parse({ status });
}
