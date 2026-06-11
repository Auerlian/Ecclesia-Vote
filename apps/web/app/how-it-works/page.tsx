import type { ReactNode } from "react";

export const metadata = { title: "How verification works · Ecclesia Vote" };

function Q({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="card">
      <h2 className="mb-2 text-lg font-semibold">{q}</h2>
      <div className="space-y-2 text-sm text-slate-600">{children}</div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">How you can check your vote</h1>
      <p className="max-w-2xl text-slate-600">
        Two separate checks, on purpose. One proves your ballot is counted; the other proves it was
        encrypted correctly. Neither can be used to prove <em>how</em> you voted — that is what makes
        the system safe from coercion and vote-buying.
      </p>

      <Q q="1. Did my ballot get counted? (inclusion)">
        <p>
          When you cast, you <strong>build your own receipt</strong> — picking from words and
          numbers — like <code className="font-mono">silver-stream-otter-20-44-08</code>. It appears
          on the public board, and you can search it any time to confirm your ballot is counted.
        </p>
        <p>
          Here's the trick that keeps it safe: every option you could have picked seals the{" "}
          <em>same</em> ballot. So your receipt is <strong>not</strong> derived from your choice, and
          you can show anyone any equivalent version of it. Even if someone forces you to reveal it,
          it only ever says “this ballot exists” — it can never reveal or prove how you voted.
        </p>
      </Q>

      <Q q="2. Was my ballot encrypted correctly? (cast-as-intended)">
        <p>
          Before you cast, the app encrypts your choice in your browser and shows you a commitment.
          You then choose: <strong>cast</strong> it, or <strong>audit</strong> it.
        </p>
        <p>
          If you audit, the app reveals the randomness it used so you (or any tool) can confirm the
          ciphertext really encodes your choice. Audited ballots are thrown away and never counted —
          and because you decide to audit only <em>after</em> the ballot is committed, the system
          cannot guess which ballots you will check, so it cannot cheat.
        </p>
      </Q>

      <Q q="3. Was the final tally honest? (universal verifiability)">
        <p>
          After the vote closes, anyone can download the audit bundle and run the standalone{" "}
          <code className="font-mono">ecclesia-verify</code> tool. It re-walks the audit log’s hash
          chain, recomputes every ballot hash, and recomputes the tally — with no access to our
          servers. If our published result and the recomputed result disagree, the recomputed
          result wins.
        </p>
      </Q>

      <Q q="What this prototype does NOT yet do">
        <p>
          This is the <strong>v0.1 prototype</strong>. The active engine does not perform real
          encryption — it exists to prove the experience and the data flows. An operator with full
          database access could in principle correlate timings. Real cryptographic secrecy (even
          against a compromised server) arrives in v0.2 via a network-isolated Belenios engine.
        </p>
      </Q>
    </div>
  );
}
