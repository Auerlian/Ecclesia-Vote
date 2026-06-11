import Link from "next/link";
import { DEMO_ELECTION_ID } from "@/lib/demo";

const e = (p: string) => `/e/${DEMO_ELECTION_ID}/${p}`;

const PIPELINE = [
  "Define the issue",
  "Inform & deliberate",
  "Verify eligibility",
  "Vote once, secretly",
  "Publish results",
  "Verify your inclusion",
  "Anyone re-checks the tally",
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">A decision pipeline, not a vote button.</h1>
        <p className="max-w-2xl text-slate-600">
          Ecclesia Vote runs advisory ballots, consultations, and member decisions with
          end-to-end verifiability: a receipt proves your ballot is counted without ever
          revealing how you voted, and anyone can recompute the result from published artifacts.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/vote/demo-token" className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white no-underline">
            Try the demo ballot
          </Link>
          <Link href={e("results")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium no-underline">
            See live results
          </Link>
          <Link href="/how-it-works" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium no-underline">
            How verification works
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: e("board"), title: "Public board", body: "Every receipt phrase, replaced ones struck through." },
          { href: e("results"), title: "Results & receipt search", body: "Tally, turnout, artifact hashes, inclusion check." },
          { href: e("audit"), title: "Audit bundle", body: "Download everything a third party needs to re-verify." },
          { href: "/org/demo-society", title: "Organiser view", body: "Turnout and audit signals — never individual choices." },
        ].map((c) => (
          <Link key={c.title} href={c.href} className="card no-underline transition hover:shadow-md">
            <div className="font-semibold text-ink">{c.title}</div>
            <p className="mt-1 text-sm text-slate-600">{c.body}</p>
          </Link>
        ))}
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">The pipeline</h2>
        <ol className="flex flex-wrap gap-2 text-sm">
          {PIPELINE.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1">
                <span className="mr-1 font-mono text-xs text-slate-400">{i + 1}</span>
                {step}
              </span>
              {i < PIPELINE.length - 1 && <span className="text-slate-300">→</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
