"use client";

import { useState, useTransition } from "react";
import type { ReceiptLookupResponse } from "@ecclesia/shared";
import { SearchIcon } from "./icons";

const MESSAGES: Record<ReceiptLookupResponse["status"], { tone: string; text: string }> = {
  included: {
    tone: "border-mint-300 bg-mint-50 text-mint-800",
    text: "Found it. Your ballot is in the count.",
  },
  included_replaced: {
    tone: "border-sunshine-300 bg-sunshine-50 text-sunshine-800",
    text: "Found, but this receipt was replaced by a later ballot, so it is not the one counted. Search your most recent receipt to confirm the counted one.",
  },
  not_found: {
    tone: "border-royal-200 bg-royal-50 text-ink/60",
    text: "Not on this wall. Double-check the words, and make sure you're searching the right election.",
  },
};

export function ReceiptSearch({
  electionId,
  search,
  example,
}: {
  electionId: string;
  search: (electionId: string, phrase: string) => Promise<ReceiptLookupResponse>;
  example: string;
}) {
  const [phrase, setPhrase] = useState("");
  const [result, setResult] = useState<ReceiptLookupResponse | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    if (!phrase.trim()) return;
    startTransition(async () => setResult(await search(electionId, phrase)));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder={example || "adjective-noun-animal-12-34-56"}
          aria-label="Receipt phrase"
          className="flex-1 rounded-2xl border-2 border-royal-100 bg-white px-4 py-2.5 font-mono text-sm font-bold text-ink outline-none transition placeholder:font-sans placeholder:font-semibold placeholder:text-ink/30 focus:border-royal-400"
        />
        <button onClick={run} disabled={pending} className="btn-primary">
          <SearchIcon size={16} />
          {pending ? "Checking…" : "Find my receipt"}
        </button>
      </div>
      {result && (
        <div
          className={`animate-pop-in rounded-2xl border-2 p-3.5 text-sm font-extrabold ${MESSAGES[result.status].tone}`}
          role="status"
        >
          {MESSAGES[result.status].text}
        </div>
      )}
      <p className="text-xs font-semibold text-ink/45">
        This only ever answers one question: is a ballot with this receipt included? It cannot
        reveal how anyone voted, and nobody can use it to prove a choice (INV-2).
      </p>
    </div>
  );
}
