import { getDemo } from "@/lib/demo";

export const metadata = { title: "Audit bundle · Ecclesia Vote" };

export default async function AuditPage({
  params,
}: {
  params: Promise<{ electionId: string }>;
}) {
  const { electionId } = await params;
  const { bundle } = await getDemo();
  const m = bundle.manifest;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit bundle</h1>
        <p className="text-sm text-slate-600">
          Everything a third party needs to recompute this result — with no access to our database
          or app code.
        </p>
      </div>

      <div className="card space-y-2">
        <div className="flex flex-wrap gap-6 text-sm">
          <div><span className="font-semibold">{bundle.ballots.length}</span> ballot records</div>
          <div><span className="font-semibold">{bundle.credentials.length}</span> public credentials</div>
          <div><span className="font-semibold">{bundle.auditChain.length}</span> audit events</div>
          <div><span className="font-semibold">{bundle.board.length}</span> receipts</div>
        </div>
        <a
          href={`/e/${electionId}/audit/bundle`}
          className="inline-block rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white no-underline"
        >
          Download bundle (JSON)
        </a>
      </div>

      <div className="card">
        <h2 className="mb-2 text-lg font-semibold">Re-verify it yourself</h2>
        <p className="mb-3 text-sm text-slate-600">
          The <code className="font-mono">ecclesia-verify</code> tool has zero dependency on this
          app. Point it at a bundle directory; it exits 0 only if every check passes.
        </p>
        <pre className="overflow-x-auto rounded-lg bg-ink p-4 text-xs text-slate-100">
{`# from the repo:
node tools/verifier/ecclesia-verify.mjs <bundle-directory>

# it checks:
#   • the audit hash chain is intact
#   • every ballot hash = sha256(JCS(payload))
#   • every ballot credential is in the issued set
#   • the recomputed tally equals the published tally
#   • the three artifact hashes match the manifest`}
        </pre>
        <p className="mt-3 hashmono">tally hash · {m.tallyHash}</p>
      </div>
    </div>
  );
}
