import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { EccoAvatar } from "@/components/ecco";
import { ChartIcon, ClockIcon, ShieldIcon, WallIcon } from "@/components/icons";
import { getDemoElections } from "@/lib/demo";
import { pct } from "@/lib/format";

export const metadata = { title: "Society" };

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const elections = await getDemoElections();
  const name = slug.replace(/-/g, " ");
  const totalEligible = elections.reduce((n, e) => n + e.eligible, 0);
  const totalVoted = elections.reduce((n, e) => n + e.bundle.tally.accepted, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* cover + identity, like a society page */}
      <div className="card overflow-hidden p-0">
        <div className="bg-flux h-28 sm:h-36" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end gap-4">
            <EccoAvatar
              seed={slug}
              size={88}
              look={{ accessory: "cap" }}
              className="shrink-0 ring-4 ring-white"
            />
            <div className="pb-1">
              <h1 className="text-2xl font-black capitalize tracking-tight text-ink">{name}</h1>
              <p className="text-xs font-bold text-ink/45">Organiser dashboard · demo society</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { n: totalEligible, label: "members eligible" },
              { n: totalVoted, label: "ballots cast" },
              { n: pct(totalVoted, totalEligible), label: "avg turnout" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-royal-50 py-3 text-center">
                <div className="text-xl font-black tabular-nums text-royal-700">{s.n}</div>
                <div className="text-[11px] font-bold text-ink/45">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-extrabold uppercase tracking-wide text-ink/40">
          Running now
        </h2>
        {elections.map((e) => {
          const el = e.bundle.election;
          return (
            <div key={el.electionId} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-extrabold text-ink">{el.title}</div>
                  <div className="text-xs font-bold text-ink/45">
                    {el.voteType === "yes_no"
                      ? "Referendum · yes/no"
                      : `Election · ${el.options.length} candidates`}{" "}
                    · advisory
                  </div>
                </div>
                <span className="chip bg-mint-100 text-mint-700">
                  <ClockIcon size={13} />
                  open · <Countdown closesAt={el.votingClosesAt} />
                </span>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs font-bold text-ink/50">
                  <span>turnout</span>
                  <span>
                    {e.bundle.tally.accepted}/{e.eligible} ·{" "}
                    {pct(e.bundle.tally.accepted, e.eligible)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-royal-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint-400 to-mint-600"
                    style={{ width: pct(e.bundle.tally.accepted, e.eligible) }}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/e/${el.electionId}/board`} className="btn-ghost px-3 py-1.5 text-xs">
                  <WallIcon size={14} />
                  Wall
                </Link>
                <Link
                  href={`/e/${el.electionId}/results`}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  <ChartIcon size={14} />
                  Results
                </Link>
                <Link href={`/e/${el.electionId}/audit`} className="btn-ghost px-3 py-1.5 text-xs">
                  <ShieldIcon size={14} />
                  Audit
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      <p className="card text-xs font-semibold text-ink/55">
        Organisers see turnout and audit signals only, <strong>never</strong> how any individual
        voted. By database design, no admin role has a read path to a vote choice (INV-10).
      </p>
    </div>
  );
}
