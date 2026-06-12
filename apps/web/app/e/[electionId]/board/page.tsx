import Link from "next/link";
import { mascotSvg } from "@ecclesia/receipt";
import { ChartIcon, ShieldIcon } from "@/components/icons";
import { getDemoElection } from "@/lib/demo";

export const metadata = { title: "The Wall" };

export default async function BoardPage({ params }: { params: Promise<{ electionId: string }> }) {
  const { electionId } = await params;
  const { bundle } = await getDemoElection(electionId);
  const board = [...bundle.board].reverse(); // newest first, like a feed
  const counted = bundle.board.filter((b) => !b.isReplaced).length;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-ink">The Wall of Voters</h1>
        <p className="mt-1 text-sm font-semibold text-ink/55">
          {bundle.election.title}. Every sealed ballot gets a receipt and its own Ecco, published
          here for anyone to check.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip bg-mint-100 text-mint-700">{counted} counted</span>
          <span className="chip bg-royal-50 text-royal-700">{board.length} receipts shown</span>
          <span className="chip bg-sunshine-100 text-sunshine-800">
            changed minds are struck through, never hidden
          </span>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {board.map((entry) => (
          <div
            key={entry.receiptPhrase}
            className={`card card-hover flex flex-col items-center gap-2 p-3 text-center ${
              entry.isReplaced ? "opacity-55" : ""
            }`}
          >
            <div
              className="overflow-hidden rounded-2xl"
              dangerouslySetInnerHTML={{ __html: mascotSvg(entry.receiptPhrase, 84) }}
            />
            <span
              className={`break-words font-mono text-[11px] font-bold leading-tight ${
                entry.isReplaced ? "text-ink/40 line-through" : "text-ink/75"
              }`}
            >
              {entry.receiptPhrase}
            </span>
            {entry.isReplaced && (
              <span className="chip bg-sunshine-100 text-[10px] text-sunshine-800">re-voted</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/e/${electionId}/results`} className="btn-primary">
          <ChartIcon size={16} />
          Results & receipt search
        </Link>
        <Link href={`/e/${electionId}/audit`} className="btn-ghost">
          <ShieldIcon size={16} />
          Audit bundle
        </Link>
      </div>

      <p className="card text-xs font-semibold text-ink/50">
        A receipt on this wall says one thing: a ballot with this phrase is sealed in the box.
        Phrases are vote-independent by construction, so the wall can be fully public without
        leaking a single choice.
      </p>
    </div>
  );
}
