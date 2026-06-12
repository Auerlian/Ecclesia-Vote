import { ShieldIcon } from "@/components/icons";
import { getDemoElection } from "@/lib/demo";

export const metadata = { title: "Audit room" };

export default async function AuditPage({ params }: { params: Promise<{ electionId: string }> }) {
  const { electionId } = await params;
  const { bundle } = await getDemoElection(electionId);
  const m = bundle.manifest;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-100 text-mint-700">
            <ShieldIcon size={22} />
          </span>
          <h1 className="text-2xl font-black tracking-tight text-ink">The audit room</h1>
        </div>
        <p className="mt-2 text-sm font-semibold text-ink/55">
          {bundle.election.title}: everything a third party needs to recompute this result, with no
          access to our database or app code. Scepticism welcome; bring your own laptop.
        </p>
      </header>

      <div className="card">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { n: bundle.ballots.length, label: "ballot records" },
            { n: bundle.credentials.length, label: "public credentials" },
            { n: bundle.auditChain.length, label: "audit events" },
            { n: bundle.board.length, label: "receipts" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-royal-50 py-3 text-center">
              <div className="text-xl font-black tabular-nums text-royal-700">{s.n}</div>
              <div className="text-[11px] font-bold text-ink/45">{s.label}</div>
            </div>
          ))}
        </div>
        <a href={`/e/${electionId}/audit/bundle`} className="btn-mint mt-4">
          Download bundle (JSON)
        </a>
      </div>

      <div className="card">
        <h2 className="mb-2 text-lg font-black text-ink">Re-verify it yourself</h2>
        <p className="mb-3 text-sm font-semibold text-ink/60">
          The{" "}
          <code className="rounded bg-royal-50 px-1.5 py-0.5 font-mono text-xs">
            ecclesia-verify
          </code>{" "}
          tool has zero dependency on this app. Point it at a bundle directory; it exits 0 only if
          every check passes.
        </p>
        <pre className="overflow-x-auto rounded-2xl bg-ink p-4 text-xs leading-relaxed text-royal-100">
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

      <p className="card text-xs font-semibold text-ink/55">
        The bundle deliberately contains <strong>no link from receipt phrases to ballots</strong>{" "}
        and no voter identities, so you can verify the count without ever being able to unmask a
        voter.
      </p>
    </div>
  );
}
