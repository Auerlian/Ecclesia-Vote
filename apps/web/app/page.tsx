import Link from "next/link";
import { mascotSvg } from "@ecclesia/receipt";
import { CandidateCard } from "@/components/CandidateCard";
import { CheerButton } from "@/components/CheerButton";
import { Countdown } from "@/components/Countdown";
import { EccoAvatar } from "@/components/ecco";
import { FeedPost } from "@/components/FeedPost";
import { ShareButton } from "@/components/ShareButton";
import { YourEccoCard } from "@/components/YourEccoCard";
import {
  BallotIcon,
  BookIcon,
  ChartIcon,
  ClockIcon,
  MegaphoneIcon,
  ShieldIcon,
  UserIcon,
  WallIcon,
} from "@/components/icons";
import { PRESIDENT_CANDIDATES } from "@/lib/candidates";
import {
  DEMO_ELECTION_ID,
  DEMO_ORG_NAME,
  DEMO_ORG_SLUG,
  PRESIDENT_ELECTION_ID,
  getDemoElection,
} from "@/lib/demo";
import { pct, timeAgo } from "@/lib/format";

const QUICK_LINKS = [
  { href: "/elections", label: "Elections", icon: BallotIcon },
  { href: "/wall", label: "The Wall", icon: WallIcon },
  { href: `/e/${PRESIDENT_ELECTION_ID}/results`, label: "Results", icon: ChartIcon },
  { href: `/e/${PRESIDENT_ELECTION_ID}/audit`, label: "Audit room", icon: ShieldIcon },
  { href: "/how-it-works", label: "Learn", icon: BookIcon },
  { href: `/org/${DEMO_ORG_SLUG}`, label: "Organiser view", icon: UserIcon },
];

export default async function Home() {
  const president = await getDemoElection(PRESIDENT_ELECTION_ID);
  const bylaws = await getDemoElection(DEMO_ELECTION_ID);
  const wallPreview = president.bundle.board
    .filter((b) => !b.isReplaced)
    .slice(-6)
    .reverse();

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_290px]">
      {/* ---- left rail ------------------------------------------------- */}
      <aside className="hidden lg:block">
        <div className="sticky top-32 space-y-4">
          <Link
            href={`/org/${DEMO_ORG_SLUG}`}
            className="card card-hover flex items-center gap-3 p-4 no-underline"
          >
            <EccoAvatar seed={DEMO_ORG_SLUG} size={42} look={{ accessory: "cap" }} />
            <div>
              <div className="text-sm font-extrabold text-ink">{DEMO_ORG_NAME}</div>
              <div className="text-xs font-semibold text-ink/45">Your society</div>
            </div>
          </Link>

          <nav className="card p-2" aria-label="Quick links">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-ink/70 no-underline transition hover:bg-royal-50 hover:text-royal-600"
              >
                <l.icon size={18} />
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="card space-y-1.5 p-4">
            <div className="text-xs font-extrabold uppercase tracking-wide text-ink/40">
              The decision pipeline
            </div>
            {[
              "Inform & deliberate",
              "Vote once, secretly",
              "Verify your receipt",
              "Anyone re-checks the tally",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-2 text-xs font-bold text-ink/65">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-royal-100 font-mono text-[10px] text-royal-700">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ---- the feed --------------------------------------------------- */}
      <div className="min-w-0 space-y-5">
        {/* composer-style teaser */}
        <div className="card flex items-center gap-3 p-4">
          <EccoAvatar seed="you" size={40} />
          <Link
            href="/elections"
            className="flex-1 rounded-full bg-royal-50 px-4 py-2.5 text-sm font-bold text-ink/40 no-underline transition hover:bg-royal-100"
          >
            What should your society decide next?
          </Link>
          <span className="chip hidden bg-grape-100 text-grape-700 sm:inline-flex">v0.2 ✨</span>
        </div>

        {/* pinned: presidential election */}
        <FeedPost
          pinned
          avatar={<EccoAvatar seed={DEMO_ORG_SLUG} size={44} look={{ accessory: "cap" }} />}
          author={DEMO_ORG_NAME}
          verified
          meta={`${timeAgo(president.bundle.election.votingOpensAt)} · Secret ballot · Advisory`}
          actions={
            <>
              <CheerButton id="post-president" />
              <ShareButton path={`/vote/${president.voteToken}`} />
              <Link href={`/e/${PRESIDENT_ELECTION_ID}/board`} className="feed-action">
                <WallIcon size={15} />
                Wall
              </Link>
            </>
          }
        >
          <h2 className="text-lg font-black leading-snug text-ink">
            🗳️ {president.bundle.election.title} is OPEN!
          </h2>
          <p className="mt-1 text-sm font-semibold text-ink/65">
            Four candidates. One ballot box. Your call — and only you will ever know what it was.
          </p>
          <div className="mt-3 flex items-center gap-1">
            {PRESIDENT_CANDIDATES.map((c) => (
              <EccoAvatar
                key={c.optionId}
                size={40}
                look={{ petal: c.petal, accessory: c.accessory, expression: c.expression }}
                className="-mr-2 ring-2 ring-white"
              />
            ))}
            <span className="ml-4 text-xs font-bold text-ink/50">
              {PRESIDENT_CANDIDATES.map((c) => c.name.split(" ")[0]).join(", ")} are running
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={`/vote/${president.voteToken}`} className="btn-coral">
              Cast your vote
            </Link>
            <span className="chip bg-mint-100 text-mint-700">
              {president.bundle.tally.accepted} ballots in
            </span>
            <span className="chip bg-coral-100 text-coral-700">
              <ClockIcon size={13} />
              <Countdown closesAt={president.bundle.election.votingClosesAt} />
            </span>
          </div>
        </FeedPost>

        {/* candidate post #1 */}
        <FeedPost
          avatar={
            <EccoAvatar
              size={44}
              look={{
                petal: PRESIDENT_CANDIDATES[0]!.petal,
                accessory: PRESIDENT_CANDIDATES[0]!.accessory,
                expression: PRESIDENT_CANDIDATES[0]!.expression,
              }}
            />
          }
          author={PRESIDENT_CANDIDATES[0]!.name}
          meta="Candidate for President · 5h ago"
          actions={
            <>
              <CheerButton id="post-aisha" />
              <ShareButton path={`/vote/${president.voteToken}`} />
              <Link href={`/vote/${president.voteToken}`} className="feed-action">
                <BallotIcon size={15} />
                Vote
              </Link>
            </>
          }
        >
          <CandidateCard candidate={PRESIDENT_CANDIDATES[0]!} />
        </FeedPost>

        {/* education: receipts */}
        <FeedPost
          avatar={
            <EccoAvatar
              size={44}
              look={{ petal: "#3D6BFF", accessory: "glasses", expression: "joy" }}
            />
          }
          author="Ecco"
          verified
          meta="Ecclesia tips · for everyone"
          actions={
            <>
              <CheerButton id="post-edu-receipt" />
              <Link href="/how-it-works" className="feed-action">
                <BookIcon size={15} />
                Learn how
              </Link>
            </>
          }
        >
          <div className="rounded-2xl bg-gradient-to-br from-royal-500 to-grape-600 p-5 text-white">
            <div className="text-2xl">🤫</div>
            <h3 className="mt-1 text-base font-black leading-snug">
              Your receipt proves your vote is counted — and can never reveal what it was.
            </h3>
            <p className="mt-1.5 text-sm font-semibold text-white/80">
              You build it yourself from words and numbers, every version seals the same ballot, and
              it shows up on the public wall. Coercion-proof by design.
            </p>
          </div>
        </FeedPost>

        {/* bylaws referendum */}
        <FeedPost
          avatar={<EccoAvatar seed={DEMO_ORG_SLUG} size={44} look={{ accessory: "cap" }} />}
          author={DEMO_ORG_NAME}
          verified
          meta={`${timeAgo(bylaws.bundle.election.votingOpensAt)} · Referendum · Yes / No`}
          actions={
            <>
              <CheerButton id="post-bylaws" />
              <ShareButton path={`/vote/${bylaws.voteToken}`} />
              <Link href={`/e/${DEMO_ELECTION_ID}/results`} className="feed-action">
                <ChartIcon size={15} />
                Live results
              </Link>
            </>
          }
        >
          <h2 className="text-base font-black leading-snug text-ink">
            📜 {bylaws.bundle.election.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-ink/65">
            The committee proposes new bylaws — clearer roles, faster decisions, fewer all-caps
            email threads. The vote is advisory and closes today.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href={`/vote/${bylaws.voteToken}`} className="btn-primary">
              Vote yes / no
            </Link>
            <span className="chip bg-mint-100 text-mint-700">
              {bylaws.bundle.tally.accepted} ballots in
            </span>
            <span className="chip bg-coral-100 text-coral-700">
              <ClockIcon size={13} />
              <Countdown closesAt={bylaws.bundle.election.votingClosesAt} />
            </span>
          </div>
        </FeedPost>

        {/* candidate post #2 */}
        <FeedPost
          avatar={
            <EccoAvatar
              size={44}
              look={{
                petal: PRESIDENT_CANDIDATES[3]!.petal,
                accessory: PRESIDENT_CANDIDATES[3]!.accessory,
                expression: PRESIDENT_CANDIDATES[3]!.expression,
              }}
            />
          }
          author={PRESIDENT_CANDIDATES[3]!.name}
          meta="Candidate for President · 8h ago"
          actions={
            <>
              <CheerButton id="post-dev" />
              <ShareButton path={`/vote/${president.voteToken}`} />
              <Link href={`/vote/${president.voteToken}`} className="feed-action">
                <BallotIcon size={15} />
                Vote
              </Link>
            </>
          }
        >
          <CandidateCard candidate={PRESIDENT_CANDIDATES[3]!} />
        </FeedPost>

        {/* wall teaser */}
        <FeedPost
          avatar={
            <EccoAvatar seed="the-wall" size={44} look={{ petal: "#FFB81F", expression: "joy" }} />
          }
          author="The Wall"
          verified
          meta="Every counted ballot, in public · live"
          actions={
            <>
              <Link href="/wall" className="feed-action">
                <WallIcon size={15} />
                See the whole wall
              </Link>
              <Link href={`/e/${PRESIDENT_ELECTION_ID}/results`} className="feed-action">
                <MegaphoneIcon size={15} />
                Find your receipt
              </Link>
            </>
          }
        >
          <p className="text-sm font-semibold text-ink/65">
            {president.bundle.tally.accepted} receipts and counting on the presidential wall — each
            one a sealed ballot with its own little Ecco. Spot yours, never reveal it. 🧱
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {wallPreview.map((b) => (
              <div
                key={b.receiptPhrase}
                className="overflow-hidden rounded-2xl"
                title={b.receiptPhrase}
                dangerouslySetInnerHTML={{ __html: mascotSvg(b.receiptPhrase, 96) }}
              />
            ))}
          </div>
        </FeedPost>

        {/* education: audit */}
        <FeedPost
          avatar={
            <EccoAvatar
              size={44}
              look={{ petal: "#12B97E", accessory: "tophat", expression: "wink" }}
            />
          }
          author="Ecco"
          verified
          meta="Ecclesia tips · for sceptics (we love sceptics)"
          actions={
            <>
              <CheerButton id="post-edu-audit" />
              <Link href={`/e/${PRESIDENT_ELECTION_ID}/audit`} className="feed-action">
                <ShieldIcon size={15} />
                Audit room
              </Link>
            </>
          }
        >
          <div className="rounded-2xl bg-gradient-to-br from-mint-500 to-royal-600 p-5 text-white">
            <div className="text-2xl">🕵️</div>
            <h3 className="mt-1 text-base font-black leading-snug">Don't trust us. Check us.</h3>
            <p className="mt-1.5 text-sm font-semibold text-white/80">
              Download the audit bundle and recompute the whole result on your own machine with one
              command. If our number and your number disagree — yours wins.
            </p>
          </div>
        </FeedPost>
      </div>

      {/* ---- right rail -------------------------------------------------- */}
      <aside className="hidden lg:block">
        <div className="sticky top-32 space-y-4">
          <YourEccoCard />

          <div className="card space-y-3 p-4">
            <div className="text-xs font-extrabold uppercase tracking-wide text-ink/40">
              Turnout watch
            </div>
            {[president, bylaws].map((e) => {
              const t = e.bundle.tally.accepted;
              return (
                <div key={e.bundle.election.electionId}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs font-bold text-ink/70">
                      {e.bundle.election.title}
                    </span>
                    <span className="shrink-0 text-xs font-extrabold text-royal-600">
                      {pct(t, e.eligible)}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-royal-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-royal-400 to-grape-500"
                      style={{ width: pct(t, e.eligible) }}
                    />
                  </div>
                  <div className="mt-0.5 text-[11px] font-semibold text-ink/40">
                    {t} of {e.eligible} members
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card p-4">
            <div className="text-xs font-extrabold uppercase tracking-wide text-ink/40">
              Closing soon
            </div>
            {[bylaws, president].map((e) => (
              <Link
                key={e.bundle.election.electionId}
                href={`/vote/${e.voteToken}`}
                className="mt-2 flex items-center justify-between gap-2 rounded-2xl bg-royal-50 px-3 py-2 no-underline transition hover:bg-royal-100"
              >
                <span className="truncate text-xs font-bold text-ink/70">
                  {e.bundle.election.title}
                </span>
                <span className="shrink-0 text-[11px] font-extrabold text-coral-600">
                  <Countdown closesAt={e.bundle.election.votingClosesAt} />
                </span>
              </Link>
            ))}
          </div>

          <p className="px-2 text-[11px] font-semibold leading-relaxed text-ink/35">
            Nobody — not organisers, not admins, not Ecco — can see how you voted. Receipts prove
            inclusion only.
          </p>
        </div>
      </aside>
    </div>
  );
}
