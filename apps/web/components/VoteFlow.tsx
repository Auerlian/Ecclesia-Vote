"use client";

import Link from "next/link";
import { useState } from "react";
import { CandidateCard } from "./CandidateCard";
import { Confetti } from "./Confetti";
import { ReceiptAssembly } from "./ReceiptAssembly";
import { unlockWardrobe } from "./useEccoProfile";
import type { CandidateProfile } from "@/lib/candidates";

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

const STEPS = ["Pick", "Lock", "Seal", "Done"] as const;

function stepOf(stage: Stage): number {
  switch (stage) {
    case "choose":
      return 0;
    case "challenge":
    case "audited":
      return 1;
    case "assemble":
      return 2;
    case "receipt":
      return 3;
  }
}

function Stepper({ stage }: { stage: Stage }) {
  const current = stepOf(stage);
  return (
    <ol className="flex items-center gap-1.5" aria-label="Ballot progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-1.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition ${
                done
                  ? "bg-mint-500 text-white"
                  : active
                    ? "bg-royal-500 text-white shadow-glow"
                    : "bg-royal-100 text-royal-400"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`hidden text-xs font-extrabold sm:block ${
                active ? "text-royal-600" : done ? "text-mint-600" : "text-ink/35"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                className={`h-1 flex-1 rounded-full ${done ? "bg-mint-300" : "bg-royal-100"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** What the voter is choosing between. yes/no ballots pass no candidates. */
export interface VoteFlowProps {
  title: string;
  voteType: "yes_no" | "multiple_choice";
  candidates: CandidateProfile[];
  allowAbstain: boolean;
  boardHref: string;
  resultsHref: string;
  beginCeremony: () => Promise<{ seedHex: string; mascot: string }>;
}

const YES_NO_CHOICES = [
  {
    id: "yes",
    label: "Yes",
    emoji: "👍",
    card: "border-mint-300 hover:border-mint-500 hover:bg-mint-50",
    active: "border-mint-500 bg-mint-50",
  },
  {
    id: "no",
    label: "No",
    emoji: "👎",
    card: "border-coral-300 hover:border-coral-500 hover:bg-coral-50",
    active: "border-coral-500 bg-coral-50",
  },
  {
    id: "abstain",
    label: "Abstain",
    emoji: "🤷",
    card: "border-royal-100 hover:border-royal-300 hover:bg-royal-50",
    active: "border-royal-400 bg-royal-50",
  },
] as const;

export function VoteFlow({
  title,
  voteType,
  candidates,
  allowAbstain,
  boardHref,
  resultsHref,
  beginCeremony,
}: VoteFlowProps) {
  const [stage, setStage] = useState<Stage>("choose");
  const [choice, setChoice] = useState<string | null>(null);
  const [commit, setCommit] = useState<{ nonce: string; hash: string } | null>(null);
  const [audit, setAudit] = useState<{ nonce: string; recomputed: string; ok: boolean } | null>(
    null,
  );
  const [receipt, setReceipt] = useState<{
    display: string;
    canonical: string;
    mascot: string;
  } | null>(null);
  const [ceremony, setCeremony] = useState<{ seedHex: string; mascot: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const choiceLabel =
    voteType === "yes_no"
      ? YES_NO_CHOICES.find((c) => c.id === choice)?.label
      : choice === "abstain"
        ? "Abstain"
        : candidates.find((c) => c.optionId === choice)?.name;

  async function encrypt(c: string) {
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
    <div className="space-y-5">
      <Stepper stage={stage} />

      <div className="card space-y-4 p-5 sm:p-6">
        {stage === "choose" && (
          <div className="space-y-4 animate-pop-in">
            <div>
              <h2 className="text-lg font-black text-ink">{title}</h2>
              <p className="text-sm font-semibold text-ink/55">
                {voteType === "yes_no"
                  ? "Pick a side (or sit on the fence). Encrypted in your browser before anything is sent."
                  : "Pick your candidate. Encrypted in your browser before anything is sent."}
              </p>
            </div>

            {voteType === "yes_no" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {YES_NO_CHOICES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setChoice(c.id)}
                    aria-pressed={choice === c.id}
                    className={`rounded-3xl border-2 bg-white p-5 text-center transition ${
                      choice === c.id ? c.active : c.card
                    }`}
                  >
                    <div className="text-3xl">{c.emoji}</div>
                    <div className="mt-1 text-base font-black text-ink">{c.label}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((c) => (
                  <CandidateCard
                    key={c.optionId}
                    candidate={c}
                    selected={choice === c.optionId}
                    onSelect={() => setChoice(c.optionId)}
                  />
                ))}
                {allowAbstain && (
                  <button
                    onClick={() => setChoice("abstain")}
                    aria-pressed={choice === "abstain"}
                    className={`w-full rounded-3xl border-2 p-3 text-sm font-extrabold transition ${
                      choice === "abstain"
                        ? "border-royal-400 bg-royal-50 text-ink"
                        : "border-dashed border-royal-200 bg-white text-ink/50 hover:border-royal-400"
                    }`}
                  >
                    🤷 Abstain — be counted without picking anyone
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => choice && encrypt(choice)}
              disabled={!choice}
              className="btn-primary w-full sm:w-auto"
            >
              🔐 Encrypt my ballot
            </button>
          </div>
        )}

        {stage === "challenge" && commit && (
          <div className="space-y-4 animate-pop-in">
            <div className="rounded-2xl bg-royal-50 p-4">
              <div className="text-sm font-extrabold text-ink">
                Your ballot is encrypted and locked in 🔒
              </div>
              <p className="mt-1 text-sm font-semibold text-ink/60">
                Choice: <strong className="text-ink">{choiceLabel}</strong> — sealed under this
                commitment:
              </p>
              <p className="hashmono mt-2">{commit.hash}</p>
            </div>
            <p className="text-sm font-semibold text-ink/60">
              Now <strong className="text-ink">cast</strong> it — or play inspector 🕵️ and{" "}
              <strong className="text-ink">audit</strong> it to catch the system cheating. You
              choose <em>after</em> it's locked, so it can't cheat selectively.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={doCast} disabled={busy} className="btn-coral">
                {busy ? "Preparing…" : "🗳️ Cast this ballot"}
              </button>
              <button onClick={doAudit} className="btn-ghost">
                🕵️ Audit it instead
              </button>
            </div>
            <details className="text-xs font-semibold text-ink/50">
              <summary className="cursor-pointer font-extrabold">What's happening here?</summary>
              <p className="mt-1">
                A Benaloh challenge. Auditing reveals the randomness so you can confirm the
                ciphertext encodes your choice. Audited ballots are discarded and never counted —
                which is exactly why a cast ballot can never be proven to anyone.
              </p>
            </details>
          </div>
        )}

        {stage === "audited" && audit && (
          <div className="space-y-4 animate-pop-in">
            <div
              className={`rounded-2xl border-2 p-4 text-sm font-extrabold ${
                audit.ok
                  ? "border-mint-300 bg-mint-50 text-mint-800"
                  : "border-coral-300 bg-coral-50 text-coral-800"
              }`}
            >
              {audit.ok
                ? "✓ Verified! The encryption really does contain your choice. The system didn't cheat."
                : "✗ Mismatch — this would be evidence of cheating."}
            </div>
            <dl className="space-y-1 rounded-2xl bg-royal-50 p-4 text-xs font-semibold text-ink/60">
              <div>
                <dt className="inline font-extrabold text-ink">revealed choice: </dt>
                <dd className="inline">{choiceLabel}</dd>
              </div>
              <div>
                <dt className="inline font-extrabold text-ink">revealed randomness: </dt>
                <dd className="hashmono inline">{audit.nonce}</dd>
              </div>
            </dl>
            <p className="text-sm font-semibold text-ink/60">
              This audited ballot is now spoiled and thrown away — that's the rule that keeps cast
              ballots unprovable. Encrypt a fresh one to vote for real.
            </p>
            <button onClick={() => choice && encrypt(choice)} className="btn-primary">
              🔐 Encrypt again
            </button>
          </div>
        )}

        {stage === "assemble" && ceremony && (
          <ReceiptAssembly
            seedHex={ceremony.seedHex}
            onSealed={(display, canonical) => {
              setReceipt({ display, canonical, mascot: ceremony.mascot });
              unlockWardrobe();
              setStage("receipt");
            }}
          />
        )}

        {stage === "receipt" && receipt && (
          <div className="space-y-4">
            <Confetti />
            <div className="text-center">
              <h2 className="text-xl font-black text-ink">Your ballot is in the box! 🎉</h2>
              <p className="text-sm font-semibold text-ink/55">
                This receipt is yours to keep. It proves your ballot is counted — and can never
                reveal how you voted.
              </p>
            </div>

            <div className="animate-tada overflow-hidden rounded-3xl border-2 border-sunshine-300 bg-gradient-to-br from-sunshine-50 to-coral-50 p-5">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div
                  className="shrink-0 overflow-hidden rounded-2xl shadow-card"
                  dangerouslySetInnerHTML={{ __html: receipt.mascot }}
                />
                <div className="min-w-0 text-center sm:text-left">
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-sunshine-700">
                    Official receipt · keep me
                  </div>
                  <div className="mt-1 break-all font-mono text-lg font-bold text-ink">
                    {receipt.display}
                  </div>
                  {receipt.display !== receipt.canonical && (
                    <div className="mt-1 text-[11px] font-semibold text-ink/50">
                      Wall version: <span className="font-mono">{receipt.canonical}</span> — both
                      are interchangeable, on purpose.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-grape-50 px-4 py-3 text-center text-sm font-extrabold text-grape-700">
              🎁 Wardrobe unlocked — your Ecco just earned new accessories!
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Link href={boardHref} className="btn-primary">
                Find it on the wall
              </Link>
              <Link href={resultsHref} className="btn-ghost">
                Live results
              </Link>
              <Link href="/me" className="btn-ghost">
                Dress your Ecco
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
