import Link from "next/link";
import { mascotSvg } from "@ecclesia/receipt";
import { ArrowRightIcon } from "@/components/icons";
import { getDemoElections } from "@/lib/demo";

export const metadata = { title: "The Wall" };

/** Combined wall — a strip per election, linking to each full wall. */
export default async function WallPage() {
  const elections = await getDemoElections();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-ink">The Wall of Voters 🧱</h1>
        <p className="mt-1 text-sm font-semibold text-ink/55">
          Every counted ballot in every election, receipt by receipt. Public on purpose: it's how
          you check you're in — and how everyone checks nobody was added.
        </p>
      </header>

      {elections.map((e) => {
        const el = e.bundle.election;
        const recent = [...e.bundle.board].reverse().slice(0, 8);
        const counted = e.bundle.board.filter((b) => !b.isReplaced).length;
        return (
          <section key={el.electionId} className="card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-ink">{el.title}</h2>
                <span className="text-xs font-bold text-ink/45">{counted} ballots counted</span>
              </div>
              <Link href={`/e/${el.electionId}/board`} className="btn-ghost text-xs">
                Full wall
                <ArrowRightIcon size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {recent.map((b) => (
                <div
                  key={b.receiptPhrase}
                  title={b.receiptPhrase}
                  className={`overflow-hidden rounded-2xl ${b.isReplaced ? "opacity-50" : ""}`}
                  dangerouslySetInnerHTML={{ __html: mascotSvg(b.receiptPhrase, 80) }}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
