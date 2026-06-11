import Link from "next/link";
import { VoteFlow } from "@/components/VoteFlow";
import { DEMO_ELECTION_ID, getDemo } from "@/lib/demo";
import { beginCeremony } from "./actions";

export const metadata = { title: "Cast your ballot · Ecclesia Vote" };

export default async function VotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await params;
  const { bundle } = await getDemo();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cast your ballot</h1>
        <p className="text-sm text-slate-600">
          A demonstration of the cast-as-intended (Benaloh) flow. Encryption happens in your
          browser; auditing reveals the randomness so you can check it. Nothing here is persisted.
        </p>
      </div>

      <VoteFlow
        title={bundle.election.title}
        boardHref={`/e/${DEMO_ELECTION_ID}/board`}
        beginCeremony={beginCeremony}
      />

      <p className="text-sm text-slate-500">
        Want the underlying ideas first?{" "}
        <Link href="/how-it-works" className="text-seal">How verification works →</Link>
      </p>
    </div>
  );
}
