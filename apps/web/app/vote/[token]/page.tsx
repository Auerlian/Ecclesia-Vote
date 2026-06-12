import Link from "next/link";
import { VoteFlow } from "@/components/VoteFlow";
import { LockIcon } from "@/components/icons";
import { PRESIDENT_CANDIDATES } from "@/lib/candidates";
import { DEMO_ELECTION_ID, VOTE_TOKENS, getDemoElection } from "@/lib/demo";
import { beginCeremony } from "./actions";

export const metadata = { title: "Cast your ballot" };

export default async function VotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const electionId = VOTE_TOKENS[token] ?? DEMO_ELECTION_ID;
  const { bundle } = await getDemoElection(electionId);
  const el = bundle.election;
  const isCandidateRace = el.voteType === "multiple_choice";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-black tracking-tight text-ink">Cast your ballot</h1>
        <span className="chip bg-royal-100 text-royal-700">
          <LockIcon size={13} />
          secret · advisory
        </span>
      </div>
      <p className="text-sm font-semibold text-ink/55">
        The full cast-as-intended ceremony: encrypt, optionally audit, seal with your own receipt.
        This demo ballot isn't persisted — it exists to prove the experience.
      </p>

      <VoteFlow
        title={el.title}
        voteType={isCandidateRace ? "multiple_choice" : "yes_no"}
        candidates={isCandidateRace ? PRESIDENT_CANDIDATES : []}
        allowAbstain={el.allowAbstain}
        boardHref={`/e/${el.electionId}/board`}
        resultsHref={`/e/${el.electionId}/results`}
        beginCeremony={beginCeremony}
      />

      <p className="text-center text-sm font-semibold text-ink/45">
        Want the ideas behind the ceremony first?{" "}
        <Link href="/how-it-works" className="font-extrabold text-royal-600">
          How verification works →
        </Link>
      </p>
    </div>
  );
}
