import Link from "next/link";
import type { ReactNode } from "react";
import { Ecco } from "@/components/ecco";

export const metadata = { title: "How verification works" };

function Lesson({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="card card-hover overflow-hidden p-0">
      <div className="bg-flux flex items-center gap-3 px-5 py-3 text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-black">
          {n}
        </span>
        <h2 className="text-base font-black leading-snug">{title}</h2>
      </div>
      <div className="space-y-2.5 p-5 text-sm font-semibold leading-relaxed text-ink/70">
        {children}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="card flex items-center gap-5 overflow-hidden">
        <Ecco size={92} petal="#8B4DFF" accessory="glasses" expression="joy" className="shrink-0" />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">
            Three checks make an election trustworthy
          </h1>
          <p className="mt-1 text-sm font-semibold text-ink/55">
            Each takes about a minute to understand, and none of them require trusting us.
          </p>
        </div>
      </header>

      <Lesson n={1} title="Did my ballot get counted?">
        <p>
          When you cast, you <strong className="text-ink">build your own receipt</strong> by picking
          from words and numbers, like{" "}
          <code className="rounded bg-royal-50 px-1.5 py-0.5 font-mono text-xs">
            silver-stream-otter-20-44-08
          </code>
          . It appears on the public wall, and you can search it any time to confirm your ballot is
          counted.
        </p>
        <p>
          Here's the trick that keeps it safe: every option you could have picked seals the{" "}
          <em>same</em> ballot. Your receipt is <strong className="text-ink">not</strong> derived
          from your choice, so even if someone forces you to reveal it, it only ever says that this
          ballot exists. It can never say how you voted.
        </p>
      </Lesson>

      <Lesson n={2} title="Was my ballot encrypted correctly?">
        <p>
          Before you cast, the app encrypts your choice in your browser and shows you a commitment.
          Then you choose: <strong className="text-ink">cast</strong> it, or{" "}
          <strong className="text-ink">audit</strong> it.
        </p>
        <p>
          If you audit, the app must reveal the randomness it used, so you (or any tool) can confirm
          the ciphertext really encodes your choice. Audited ballots are thrown away and never
          counted, and because you decide <em>after</em> the ballot is committed, the system can't
          guess which ballots you'll check. Cheating becomes a lottery the system always eventually
          loses.
        </p>
      </Lesson>

      <Lesson n={3} title="Was the final tally honest?">
        <p>
          After the vote closes, anyone can download the audit bundle and run the standalone{" "}
          <code className="rounded bg-royal-50 px-1.5 py-0.5 font-mono text-xs">
            ecclesia-verify
          </code>{" "}
          tool. It re-walks the audit log's hash chain, recomputes every ballot hash, and recomputes
          the tally, all with no access to our servers.
        </p>
        <p>
          If our published result and the recomputed result disagree,{" "}
          <strong className="text-ink">the recomputed result wins</strong>. That's the whole point.
        </p>
      </Lesson>

      <div className="card border-2 border-dashed border-sunshine-300 bg-sunshine-50">
        <h2 className="text-base font-black text-ink">What this prototype does not yet do</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/70">
          This is the <strong>v0.1 prototype</strong>. The active engine does not perform real
          encryption; it exists to prove the experience and the data flows. An operator with full
          database access could in principle correlate timings. Real cryptographic secrecy (even
          against a compromised server) arrives in v0.2 via a network-isolated Belenios engine.
        </p>
      </div>

      <div className="bg-flux card border-none text-center text-white">
        <h2 className="text-lg font-black">The best way to learn it is to do it</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm font-semibold text-white/80">
          Cast a demo ballot, audit the encryption, build a receipt, find it on the wall.
        </p>
        <div className="mt-4 flex justify-center">
          <Link href="/elections" className="btn bg-white text-royal-700 hover:bg-royal-50">
            Try the demo ballot
          </Link>
        </div>
      </div>
    </div>
  );
}
