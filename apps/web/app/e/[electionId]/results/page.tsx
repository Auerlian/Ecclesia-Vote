import Link from "next/link";
import { TallyBars } from "@/components/TallyBars";
import { ReceiptSearch } from "@/components/ReceiptSearch";
import { getDemo } from "@/lib/demo";
import { pct } from "@/lib/format";
import { searchReceipt } from "../actions";

export const metadata = { title: "Results · Ecclesia Vote" };

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-slate-100 py-2 first:border-t-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="hashmono">{value}</span>
    </div>
  );
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ electionId: string }>;
}) {
  const { electionId } = await params;
  const { bundle, eligible, exampleReceipt } = await getDemo();
  const t = bundle.tally;
  const m = bundle.manifest;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{bundle.election.title}</h1>
        <p className="text-sm text-slate-600">Results — advisory vote.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <div className="text-3xl font-bold">{eligible}</div>
          <div className="text-xs text-slate-500">eligible</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold">{t.accepted}</div>
          <div className="text-xs text-slate-500">ballots counted</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold">{pct(t.accepted, eligible)}</div>
          <div className="text-xs text-slate-500">turnout</div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Tally</h2>
        <TallyBars tally={t} />
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Find my receipt</h2>
        <ReceiptSearch search={searchReceipt} example={exampleReceipt} />
      </div>

      <div className="card">
        <h2 className="mb-1 text-lg font-semibold">Verification artifacts</h2>
        <p className="mb-3 text-xs text-slate-500">
          These hashes pin the published data. The audit bundle reproduces them.
        </p>
        <HashRow label="election config hash" value={m.electionHash} />
        <HashRow label="ballot box hash" value={m.ballotsHash} />
        <HashRow label="tally hash" value={m.tallyHash} />
        <HashRow label="audit chain head" value={m.hashChainHead} />
        <div className="mt-3 flex gap-4 text-sm">
          <Link href={`/e/${electionId}/board`} className="text-seal">Public board →</Link>
          <Link href={`/e/${electionId}/audit`} className="text-seal">Download & re-verify →</Link>
        </div>
      </div>
    </div>
  );
}
