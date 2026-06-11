import Link from "next/link";
import { DEMO_ELECTION_ID, getDemo } from "@/lib/demo";
import { pct } from "@/lib/format";

export const metadata = { title: "Organisation · Ecclesia Vote" };

export default async function OrgPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { bundle, eligible } = await getDemo();
  const voted = bundle.board.filter((b) => !b.isReplaced).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold capitalize">{slug.replace(/-/g, " ")}</h1>
        <p className="text-sm text-slate-600">Organiser dashboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <div className="text-3xl font-bold">{eligible}</div>
          <div className="text-xs text-slate-500">eligible voters</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold">{voted}</div>
          <div className="text-xs text-slate-500">have voted</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold">{pct(voted, eligible)}</div>
          <div className="text-xs text-slate-500">turnout</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">{bundle.election.title}</div>
            <div className="text-xs text-slate-500">Open · yes / no · advisory</div>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            open
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href={`/e/${DEMO_ELECTION_ID}/board`} className="text-seal">Board →</Link>
          <Link href={`/e/${DEMO_ELECTION_ID}/results`} className="text-seal">Results →</Link>
          <Link href={`/e/${DEMO_ELECTION_ID}/audit`} className="text-seal">Audit →</Link>
        </div>
      </div>

      <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Organisers see turnout and audit signals only — never how any individual voted. By database
        design, no admin role has a read path to a vote choice (INV-10).
      </p>
    </div>
  );
}
