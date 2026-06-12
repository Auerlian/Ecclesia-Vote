import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { EccoAvatar } from "@/components/ecco";
import { ReceiptSearch } from "@/components/ReceiptSearch";
import { TallyBars, type TallyRow } from "@/components/TallyBars";
import { ClockIcon, ShieldIcon, WallIcon } from "@/components/icons";
import { candidateByOptionId } from "@/lib/candidates";
import { getDemoElection } from "@/lib/demo";
import { pct } from "@/lib/format";
import { searchReceipt } from "../actions";

export const metadata = { title: "Results" };

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-royal-50 py-2 first:border-t-0">
      <span className="text-xs font-extrabold text-ink/45">{label}</span>
      <span className="hashmono">{value}</span>
    </div>
  );
}

const BAR_CLASSES = [
  "bg-gradient-to-r from-royal-400 to-royal-600",
  "bg-gradient-to-r from-coral-400 to-coral-600",
  "bg-gradient-to-r from-grape-400 to-grape-600",
  "bg-gradient-to-r from-mint-400 to-mint-600",
  "bg-gradient-to-r from-blush-400 to-blush-600",
];

export default async function ResultsPage({ params }: { params: Promise<{ electionId: string }> }) {
  const { electionId } = await params;
  const demo = await getDemoElection(electionId);
  const { bundle, eligible, exampleReceipt } = demo;
  const t = bundle.tally;
  const m = bundle.manifest;
  const el = bundle.election;
  const isCandidateRace = el.voteType === "multiple_choice";
  const stillOpen = new Date(el.votingClosesAt).getTime() > Date.now();

  let rows: TallyRow[];
  let leader: { name: string; votes: number; petal: string } | null = null;

  if (isCandidateRace) {
    const ranked = [...t.options].sort((a, b) => b.votes - a.votes);
    rows = ranked.map((o, i) => {
      const c = candidateByOptionId(o.optionId);
      return {
        key: o.optionId,
        label: c?.name ?? o.optionId,
        sublabel: c?.tagline,
        votes: o.votes,
        barClass: BAR_CLASSES[i % BAR_CLASSES.length],
        avatar: c ? (
          <EccoAvatar
            size={44}
            look={{
              petal: c.petal,
              accessory: i === 0 ? "crown" : c.accessory,
              expression: i === 0 ? "joy" : c.expression,
            }}
          />
        ) : (
          <EccoAvatar size={44} seed={o.optionId} />
        ),
      };
    });
    const top = ranked[0];
    const topC = top ? candidateByOptionId(top.optionId) : undefined;
    if (top && topC && top.votes > 0 && top.votes > (ranked[1]?.votes ?? 0)) {
      leader = { name: topC.name, votes: top.votes, petal: topC.petal };
    }
  } else {
    const find = (id: string) => t.options.find((o) => o.optionId === id)?.votes ?? 0;
    rows = [
      {
        key: "yes",
        label: "Yes 👍",
        votes: find("yes"),
        barClass: "bg-gradient-to-r from-mint-400 to-mint-600",
      },
      {
        key: "no",
        label: "No 👎",
        votes: find("no"),
        barClass: "bg-gradient-to-r from-coral-400 to-coral-600",
      },
    ];
  }
  rows.push({
    key: "abstain",
    label: "Abstain 🤷",
    votes: t.abstain,
    barClass: "bg-gradient-to-r from-royal-200 to-royal-300",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">{el.title}</h1>
          <p className="text-sm font-semibold text-ink/55">
            {stillOpen
              ? "Live results — advisory vote, still open."
              : "Final results — advisory vote."}
          </p>
        </div>
        {stillOpen && (
          <span className="chip bg-coral-100 text-coral-700">
            <ClockIcon size={13} />
            <Countdown closesAt={el.votingClosesAt} />
          </span>
        )}
      </header>

      {leader && (
        <div className="bg-dots animate-pop-in overflow-hidden rounded-3xl from-sunshine-400 via-coral-400 to-blush-500 p-6 text-white shadow-lift">
          <div className="flex items-center gap-4">
            <EccoAvatar
              size={72}
              look={{ petal: leader.petal, accessory: "crown", expression: "joy" }}
              className="shrink-0 ring-4 ring-white/60"
            />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wide text-white/85">
                {stillOpen ? "Currently leading" : "Winner"} 👑
              </div>
              <div className="text-2xl font-black drop-shadow-sm">{leader.name}</div>
              <div className="text-sm font-bold text-white/85">
                {leader.votes} of {t.effectiveBallots} candidate votes
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { n: eligible, label: "eligible members", tone: "text-ink" },
          { n: t.accepted, label: "ballots counted", tone: "text-royal-600" },
          { n: pct(t.accepted, eligible), label: "turnout", tone: "text-coral-500" },
        ].map((s) => (
          <div key={s.label} className="card py-4 text-center">
            <div className={`text-3xl font-black tabular-nums ${s.tone}`}>{s.n}</div>
            <div className="text-xs font-bold text-ink/45">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-black text-ink">The tally</h2>
        <TallyBars rows={rows} totalBallots={t.accepted} />
        {t.spoiled > 0 && (
          <p className="mt-3 text-xs font-semibold text-ink/45">
            {t.spoiled} spoiled ballot(s) excluded.
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="mb-1 text-lg font-black text-ink">Find my receipt 🔎</h2>
        <p className="mb-3 text-sm font-semibold text-ink/55">
          Paste any version of the receipt you built — confirm your ballot is in this count.
        </p>
        <ReceiptSearch electionId={el.electionId} search={searchReceipt} example={exampleReceipt} />
      </div>

      <details className="card group">
        <summary className="flex cursor-pointer items-center justify-between text-lg font-black text-ink">
          Verification artifacts 🤓
          <span className="text-sm font-bold text-royal-500 transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <p className="mb-3 mt-1 text-xs font-semibold text-ink/45">
          These hashes pin the published data. The audit bundle reproduces every one of them.
        </p>
        <HashRow label="election config hash" value={m.electionHash} />
        <HashRow label="ballot box hash" value={m.ballotsHash} />
        <HashRow label="tally hash" value={m.tallyHash} />
        <HashRow label="audit chain head" value={m.hashChainHead} />
      </details>

      <div className="flex flex-wrap gap-2">
        <Link href={`/e/${el.electionId}/board`} className="btn-ghost">
          <WallIcon size={16} />
          The wall of voters
        </Link>
        <Link href={`/e/${el.electionId}/audit`} className="btn-ghost">
          <ShieldIcon size={16} />
          Download & re-verify
        </Link>
      </div>
    </div>
  );
}
