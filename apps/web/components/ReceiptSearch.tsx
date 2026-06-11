"use client";

import { useState, useTransition } from "react";
import type { ReceiptLookupResponse } from "@ecclesia/shared";

const MESSAGES: Record<ReceiptLookupResponse["status"], { tone: string; text: string }> = {
  included: {
    tone: "border-green-300 bg-green-50 text-green-900",
    text: "✓ Your ballot is in the count.",
  },
  included_replaced: {
    tone: "border-amber-300 bg-amber-50 text-amber-900",
    text: "✓ Found — but this receipt was replaced by a later ballot, so it is not the one counted. Search your most recent receipt to confirm the counted one.",
  },
  not_found: {
    tone: "border-slate-300 bg-slate-50 text-slate-700",
    text: "Not found on this board.",
  },
};

export function ReceiptSearch({
  search,
  example,
}: {
  search: (phrase: string) => Promise<ReceiptLookupResponse>;
  example: string;
}) {
  const [phrase, setPhrase] = useState("");
  const [result, setResult] = useState<ReceiptLookupResponse | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    if (!phrase.trim()) return;
    startTransition(async () => setResult(await search(phrase)));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder={example || "adjective-noun-animal-1234"}
          aria-label="Receipt phrase"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
        />
        <button
          onClick={run}
          disabled={pending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Checking…" : "Find my receipt"}
        </button>
      </div>
      {result && (
        <div className={`rounded-lg border p-3 text-sm ${MESSAGES[result.status].tone}`}>
          {MESSAGES[result.status].text}
        </div>
      )}
      <p className="text-xs text-slate-500">
        This only confirms whether a ballot is included. It never reveals how anyone voted, and
        nobody can use it to prove a choice (INV-2).
      </p>
    </div>
  );
}
