import Link from "next/link";
import { getDemo } from "@/lib/demo";

export const metadata = { title: "Public board · Ecclesia Vote" };

export default async function BoardPage({
  params,
}: {
  params: Promise<{ electionId: string }>;
}) {
  const { electionId } = await params;
  const { bundle } = await getDemo();
  const board = bundle.board;
  const counted = board.filter((b) => !b.isReplaced).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{bundle.election.title}</h1>
        <p className="text-sm text-slate-600">
          Public ballot board · {counted} counted ballot(s) · {board.length} receipt(s) shown
          (replaced ones struck through).
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {board.map((entry) => (
          <div
            key={entry.receiptPhrase}
            className={`rounded-lg border px-3 py-2 font-mono text-sm ${
              entry.isReplaced
                ? "border-slate-200 bg-slate-50 text-slate-400 line-through"
                : "border-slate-200 bg-white"
            }`}
          >
            {entry.receiptPhrase}
            {entry.isReplaced && <span className="ml-2 no-underline text-xs">(replaced)</span>}
          </div>
        ))}
      </div>

      <div className="flex gap-4 text-sm">
        <Link href={`/e/${electionId}/results`} className="text-seal">Results & receipt search →</Link>
        <Link href={`/e/${electionId}/audit`} className="text-seal">Audit bundle →</Link>
      </div>
    </div>
  );
}
