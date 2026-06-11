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

export const DEMO_ELECTION_ID = "0de70000-0000-4000-8000-00000000d3m0";
export const DEMO_ORG_SLUG = "demo-society";
const ELIGIBLE = 20;

export interface DemoData {
  bundle: AuditBundle;
  eligible: number;
  exampleReceipt: string;
  replacedReceipt: string | null;
}

let demoPromise: Promise<DemoData> | null = null;

async function build(): Promise<DemoData> {
  const engine = new MockEngine();
  const cfg: EngineElectionConfig = {
    electionId: DEMO_ELECTION_ID,
    organisationSlug: DEMO_ORG_SLUG,
    title: "Adopt the proposed new bylaws?",
    voteType: "yes_no",
    options: [],
    allowAbstain: true,
    allowRevote: true,
    votingOpensAt: new Date(Date.now() - 3_600_000).toISOString(),
    votingClosesAt: new Date(Date.now() + 6 * 3_600_000).toISOString(),
  };
  const ref = await engine.createElection(cfg);
  const batch = await engine.issueCredentials(ref, ELIGIBLE);
  const enc = await engine.getClientEncryptor(ref);

  const sel = (v: "yes" | "no" | "abstain"): Selection =>
    v === "abstain" ? { kind: "abstain" } : { kind: "yes_no", value: v };
  const plan: Array<"yes" | "no" | "abstain"> = [
    "yes", "yes", "no", "yes", "abstain", "no", "yes", "no",
    "yes", "yes", "no", "abstain", "yes", "no", "yes", "yes",
  ];

  for (let i = 0; i < plan.length; i++) {
    await engine.castBallot(ref, {
      publicCredential: batch.credentials[i]!.publicCredential,
      signature: "demo",
      encrypted: enc.encrypt(sel(plan[i]!)),
    });
  }
  // One voter changes their mind — the board will show their first receipt struck through.
  await engine.castBallot(ref, {
    publicCredential: batch.credentials[0]!.publicCredential,
    signature: "demo",
    encrypted: enc.encrypt(sel("no")),
  });

  const bundle = await engine.buildVerificationArtifacts(ref);
  const current = bundle.board.find((b) => !b.isReplaced) ?? null;
  const replaced = bundle.board.find((b) => b.isReplaced) ?? null;
  return {
    bundle,
    eligible: ELIGIBLE,
    exampleReceipt: current?.receiptPhrase ?? "",
    replacedReceipt: replaced?.receiptPhrase ?? null,
  };
}

export function getDemo(): Promise<DemoData> {
  if (!demoPromise) demoPromise = build();
  return demoPromise;
}

/**
 * INV-2 — inclusion status ONLY. Returns included / included_replaced / not_found and nothing
 * else, validated against the closed schema from @ecclesia/shared. There is no code path here
 * that could return, encode, or correlate with a vote choice.
 */
export async function lookupReceipt(phrase: string): Promise<ReceiptLookupResponse> {
  const { bundle } = await getDemo();
  // Canonicalize the query so any equivalent skin the voter assembled finds the canonical entry.
  const needle = canonicalizeReceipt(phrase) ?? phrase.trim().toLowerCase();
  const entry = bundle.board.find((b) => b.receiptPhrase === needle);
  const status = !entry ? "not_found" : entry.isReplaced ? "included_replaced" : "included";
  return receiptLookupResponseSchema.parse({ status });
}
