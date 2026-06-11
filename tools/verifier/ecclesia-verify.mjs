#!/usr/bin/env node
// ecclesia-verify — recompute an Ecclesia Vote election result from a published audit bundle,
// with ZERO dependency on the application code or database (§3.2, WP-08). Only Node built-ins.
//
// It deliberately re-implements JCS canonicalisation, SHA-256 hashing, and the tally — if our
// app and this independent tool disagree, the published artifacts are authoritative (INV-6).
//
//   ecclesia-verify <bundle-directory>
//
// Exit 0 iff every check passes; non-zero otherwise, naming the failing check.

import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// --- independent primitives -------------------------------------------------

const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");

/** RFC 8785 (JCS) for the integer+string payload domain. Mirror of @ecclesia/audit. */
export function canonicalize(value) {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "boolean") return value ? "true" : "false";
  if (t === "string") return JSON.stringify(value);
  if (t === "number") {
    if (!Number.isFinite(value)) throw new Error("JCS: non-finite number");
    if (!Number.isInteger(value)) throw new Error("JCS: non-integer number");
    return Object.is(value, -0) ? "0" : String(value);
  }
  if (t === "object") {
    if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
    const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  throw new Error(`JCS: unsupported type ${t}`);
}

/** Independent re-implementation of @ecclesia/tally. */
export function tally(voteType, optionIds, selections) {
  const counts = new Map();
  const optionSet = new Set(optionIds);
  let abstain = 0;
  let spoiled = 0;
  let effectiveBallots = 0;

  if (voteType === "yes_no") {
    counts.set("no", 0);
    counts.set("yes", 0);
  } else {
    for (const id of optionIds) counts.set(id, 0);
  }
  const bump = (id) => counts.set(id, (counts.get(id) ?? 0) + 1);

  for (const sel of selections) {
    if (sel && sel.kind === "abstain") {
      abstain++;
      continue;
    }
    if (voteType === "yes_no") {
      if (sel && sel.kind === "yes_no") {
        bump(sel.value);
        effectiveBallots++;
      } else spoiled++;
    } else if (voteType === "multiple_choice") {
      if (sel && sel.kind === "single" && optionSet.has(sel.optionId)) {
        bump(sel.optionId);
        effectiveBallots++;
      } else spoiled++;
    } else if (voteType === "approval") {
      if (sel && sel.kind === "approval") {
        const unique = [...new Set((sel.optionIds ?? []).filter((id) => optionSet.has(id)))];
        if (unique.length === 0) spoiled++;
        else {
          for (const id of unique) bump(id);
          effectiveBallots++;
        }
      } else spoiled++;
    }
  }

  const options = [...counts.entries()]
    .map(([optionId, votes]) => ({ optionId, votes }))
    .sort((a, b) => (a.optionId < b.optionId ? -1 : a.optionId > b.optionId ? 1 : 0));

  return { voteType, accepted: selections.length, abstain, spoiled, effectiveBallots, options };
}

// --- verification -----------------------------------------------------------

function readJson(dir, name) {
  return JSON.parse(readFileSync(join(dir, name), "utf8"));
}

/**
 * Verify a bundle directory. Returns { ok, checks: [{ name, ok, detail }] }. Never throws on a
 * verification failure (only on a genuinely unreadable bundle).
 */
export function verifyBundle(dir) {
  const checks = [];
  const record = (name, ok, detail) => checks.push({ name, ok, detail: ok ? undefined : detail });

  let election, credentials, ballots, board, auditChain, tallyResult, manifest;
  try {
    election = readJson(dir, "election.json");
    credentials = readJson(dir, "credentials.json");
    ballots = readJson(dir, "ballots.json");
    board = readJson(dir, "board.json");
    auditChain = readJson(dir, "audit_chain.json");
    tallyResult = readJson(dir, "tally.json");
    manifest = readJson(dir, "manifest.json");
  } catch (e) {
    return { ok: false, checks: [{ name: "read bundle files", ok: false, detail: String(e) }] };
  }

  // 1. Audit hash chain.
  {
    let expectedPrev = sha256Hex(election.electionId);
    let chainOk = true;
    let failAt = -1;
    for (let i = 0; i < auditChain.length; i++) {
      const ev = auditChain[i];
      const recomputed = sha256Hex(
        ev.previousEventHash + canonicalize(ev.payload) + ev.eventType + ev.createdAtIso,
      );
      if (ev.previousEventHash !== expectedPrev || recomputed !== ev.eventHash) {
        chainOk = false;
        failAt = i;
        break;
      }
      expectedPrev = ev.eventHash;
    }
    record("audit hash chain intact", chainOk, `chain broke at event index ${failAt}`);
  }

  // 2. Every ballot hash equals sha256(JCS(payload)).
  {
    const bad = ballots.filter((b) => sha256Hex(canonicalize(b.payload)) !== b.ballotHash);
    record("ballot hashes valid", bad.length === 0, `${bad.length} ballot(s) have a wrong hash`);
  }

  // 3. Every ballot's credential is in the issued set.
  {
    const issued = new Set(credentials.map((c) => c.publicCredential));
    const orphan = ballots.filter((b) => !issued.has(b.publicCredential));
    record("ballot credentials issued", orphan.length === 0, `${orphan.length} unknown credential(s)`);
  }

  // 4. Recompute the tally from the ballots and compare to the published tally (INV-6).
  {
    const optionIds = (election.options ?? []).map((o) => o.optionId);
    const selections = ballots.filter((b) => !b.isReplaced).map((b) => b.payload?.selection);
    const recomputed = tally(election.voteType, optionIds, selections);
    const match = canonicalize(recomputed) === canonicalize(tallyResult);
    record("recomputed tally matches published", match, "recomputed result differs from tally.json");
  }

  // 5. Manifest artifact hashes.
  record(
    "manifest election hash",
    manifest.electionHash === sha256Hex(canonicalize(election)),
    "election.json hash mismatch",
  );
  record(
    "manifest ballots hash",
    manifest.ballotsHash === sha256Hex(canonicalize(ballots)),
    "ballots.json hash mismatch",
  );
  record(
    "manifest tally hash",
    manifest.tallyHash === sha256Hex(canonicalize(tallyResult)),
    "tally.json hash mismatch",
  );

  // 6. Receipt-freeness structure (redline Edit B): receipts and payloads share no join key.
  record(
    "no receipt phrase on ballot records (Edit B)",
    ballots.every((b) => !("receiptPhrase" in b)),
    "a ballot record leaked a receipt phrase",
  );
  record(
    "no ballot hash on the board (Edit B)",
    board.every((e) => !("ballotHash" in e)),
    "a board entry leaked a ballot hash",
  );

  return { ok: checks.every((c) => c.ok), checks };
}

// --- CLI --------------------------------------------------------------------

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("usage: ecclesia-verify <bundle-directory>");
    process.exit(2);
  }
  const { ok, checks } = verifyBundle(dir);
  for (const c of checks) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.ok ? "" : ` — ${c.detail}`}`);
  }
  console.log(ok ? "\nOK — every check passed." : "\nFAILED — see the FAIL line(s) above.");
  process.exit(ok ? 0 : 1);
}

// Run only when invoked as a script (handles the bin symlink); stay silent when imported.
const invokedPath = process.argv[1] ? realpathSync(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main();
}
