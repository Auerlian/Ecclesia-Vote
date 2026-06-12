import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { Ecco, EccoAvatar } from "@/components/ecco";
import { ChartIcon, ClockIcon, LockIcon, WallIcon } from "@/components/icons";
import { candidateByOptionId } from "@/lib/candidates";
import { getDemoElections } from "@/lib/demo";
import { pct } from "@/lib/format";

export const metadata = { title: "Elections" };

export default async function ElectionsPage() {
  const elections = await getDemoElections();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-4">
        <Ecco size={72} petal="#FF5C39" expression="joy" className="animate-float" />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Elections</h1>
          <p className="text-sm font-semibold text-ink/55">
            Tap one to begin voting. Encrypted in your browser, sealed with a receipt you build.
          </p>
        </div>
      </header>

      <div className="space-y-5">
        {elections.map((e) => {
          const el = e.bundle.election;
          const isCandidateRace = el.voteType === "multiple_choice";
          return (
            <article key={el.electionId} className="card card-hover overflow-hidden p-0">
              <div
                className={`bg-dots flex items-center justify-between px-5 py-2.5 text-white ${
                  isCandidateRace ? "from-coral-500 to-blush-500" : "from-royal-500 to-grape-500"
                }`}
              >
                <span className="text-xs font-extrabold uppercase tracking-wide">
                  {isCandidateRace ? "Election · choose one candidate" : "Referendum · yes / no"}
                </span>
                <span className="chip bg-white/20 text-white">
                  <ClockIcon size={13} />
                  <Countdown closesAt={el.votingClosesAt} />
                </span>
              </div>

              <div className="p-5">
                <h2 className="text-lg font-black text-ink">{el.title}</h2>

                {isCandidateRace ? (
                  <div className="mt-3 flex items-center">
                    {el.options.map((o) => {
                      const c = candidateByOptionId(o.optionId);
                      return (
                        <EccoAvatar
                          key={o.optionId}
                          size={44}
                          look={
                            c
                              ? { petal: c.petal, accessory: c.accessory, expression: c.expression }
                              : undefined
                          }
                          seed={o.optionId}
                          className="-mr-2 ring-2 ring-white"
                        />
                      );
                    })}
                    <span className="ml-5 text-xs font-bold text-ink/50">
                      {el.options.length} candidates standing
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <span className="chip bg-mint-100 text-mint-700">YES</span>
                    <span className="chip bg-coral-100 text-coral-700">NO</span>
                    <span className="chip bg-royal-50 text-ink/50">ABSTAIN</span>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-ink/50">
                  <span className="chip bg-royal-50 text-royal-700">
                    {e.bundle.tally.accepted}/{e.eligible} voted ·{" "}
                    {pct(e.bundle.tally.accepted, e.eligible)}
                  </span>
                  <span className="chip bg-royal-50 text-royal-700">
                    <LockIcon size={13} />
                    secret ballot
                  </span>
                  <span className="chip bg-royal-50 text-royal-700">advisory</span>
                  {el.allowRevote && (
                    <span className="chip bg-royal-50 text-royal-700">re-vote allowed</span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/vote/${e.voteToken}`}
                    className={isCandidateRace ? "btn-coral" : "btn-primary"}
                  >
                    Vote now
                  </Link>
                  <Link href={`/e/${el.electionId}/results`} className="btn-ghost">
                    <ChartIcon size={16} />
                    Results
                  </Link>
                  <Link href={`/e/${el.electionId}/board`} className="btn-ghost">
                    <WallIcon size={16} />
                    Wall
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="card text-sm font-semibold text-ink/60">
        🔐 <strong className="text-ink">Why it's safe:</strong> your choice is encrypted before it
        leaves your browser, your receipt proves it was counted without revealing it, and anyone can
        recompute the result from the public audit bundle.{" "}
        <Link href="/how-it-works" className="font-extrabold text-royal-600">
          Learn how it works →
        </Link>
      </p>
    </div>
  );
}
