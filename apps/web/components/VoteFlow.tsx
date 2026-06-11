"use client";

import Link from "next/link";
import { useState } from "react";
import { ReceiptAssembly } from "./ReceiptAssembly";

type Choice = "yes" | "no" | "abstain";
type Stage = "choose" | "challenge" | "audited" | "assemble" | "receipt";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randHex(n: number): string {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const LABEL: Record<Choice, string> = { yes: "Yes", no: "No", abstain: "Abstain" };

export function VoteFlow({
  title,
  boardHref,
  beginCeremony,
}: {
  title: string;
  boardHref: string;
  beginCeremony: () => Promise<{ seedHex: string; mascot: string }>;
}) {
  const [stage, setStage] = useState<Stage>("choose");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [commit, setCommit] = useState<{ nonce: string; hash: string } | null>(null);
  const [audit, setAudit] = useState<{ nonce: string; recomputed: string; ok: boolean } | null>(null);
  const [ceremony, setCeremony] = useState<{ seedHex: string; mascot: string } | null>(null);
  const [receipt, setReceipt] = useState<{ display: string; canonical: string; mascot: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function encrypt(c: Choice) {
    const nonce = randHex(16);
    const hash = await sha256Hex(JSON.stringify({ selection: c, nonce }));
    setChoice(c);
    setCommit({ nonce, hash });
    setAudit(null);
    setStage("challenge");
  }
  async function doAudit() {
    if (!commit || !choice) return;
    const recomputed = await sha256Hex(JSON.stringify({ selection: choice, nonce: commit.nonce }));
    setAudit({ nonce: commit.nonce, recomputed, ok: recomputed === commit.hash });
    setStage("audited");
  }
  async function doCast() {
    setBusy(true);
    const c = await beginCeremony();
    setCeremony(c);
    setBusy(false);
    setStage("assemble");
  }

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>

      {stage === "choose" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Select your choice. It is encrypted in your browser before anything is sent.</p>
          <div className="flex flex-wrap gap-2">
            {(["yes", "no", "abstain"] as Choice[]).map((c) => (
              <button key={c} onClick={() => encrypt(c)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:border-ink">
                {LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "challenge" && commit && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Your ballot is encrypted and committed. <strong>Cast</strong> it, or <strong>audit</strong> it to
            check the encryption — you decide after it is committed, so the system can't cheat selectively.
          </p>
          <p className="hashmono">commitment = {commit.hash}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={doCast} disabled={busy} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {busy ? "Preparing…" : "Cast this ballot"}
            </button>
            <button onClick={doAudit} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">
              Audit this ballot (test the system)
            </button>
          </div>
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer">What is this?</summary>
            A Benaloh challenge. Auditing reveals the randomness so you can confirm the ciphertext encodes
            your choice. Audited ballots are discarded and never counted — which is why a cast ballot can
            never be proven to anyone.
          </details>
        </div>
      )}

      {stage === "audited" && audit && (
        <div className="space-y-3">
          <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
            {audit.ok ? "✓ Verified — the encryption matches your choice." : "✗ Mismatch!"}
          </div>
          <dl className="space-y-1 text-xs text-slate-600">
            <div><dt className="inline font-medium">revealed choice: </dt><dd className="inline">{choice && LABEL[choice]}</dd></div>
            <div><dt className="inline font-medium">revealed randomness: </dt><dd className="hashmono inline">{audit.nonce}</dd></div>
          </dl>
          <p className="text-sm text-slate-600">This audited ballot is discarded. Encrypt a fresh one to vote for real.</p>
          <button onClick={() => choice && encrypt(choice)} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
            Encrypt again
          </button>
        </div>
      )}

      {stage === "assemble" && ceremony && (
        <ReceiptAssembly
          seedHex={ceremony.seedHex}
          onSealed={(display, canonical) => {
            setReceipt({ display, canonical, mascot: ceremony.mascot });
            setStage("receipt");
          }}
        />
      )}

      {stage === "receipt" && receipt && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Your ballot is in the box. This is the receipt you built:</p>
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="shrink-0" dangerouslySetInnerHTML={{ __html: receipt.mascot }} />
            <div>
              <div className="font-mono text-lg font-semibold">{receipt.display}</div>
              {receipt.display !== receipt.canonical && (
                <div className="mt-1 text-xs text-slate-500">
                  Standard form on the board: <span className="font-mono">{receipt.canonical}</span> — your
                  version and this one are interchangeable.
                </div>
              )}
              <div className="mt-1 text-xs text-slate-500">
                You helped seal your ballot. This proves it's counted — and it can't reveal how you voted.
              </div>
            </div>
          </div>
          <Link href={boardHref} className="text-sm text-seal underline">
            Find it on the public board →
          </Link>
        </div>
      )}
    </div>
  );
}
