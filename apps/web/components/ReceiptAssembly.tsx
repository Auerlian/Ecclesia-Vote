"use client";

import { useState } from "react";
// Subpath import: pure-JS assembly only — keeps node:crypto out of the client bundle.
import { assembleDisplay, deriveAssembly } from "@ecclesia/receipt/assembly";

/**
 * The voter assembles their receipt by picking one of 4 equivalent skins per slot. Every option
 * seals the same ballot (docs/receipt-design.md) — the choice is the ceremony, not a channel.
 */
export function ReceiptAssembly({
  seedHex,
  onSealed,
}: {
  seedHex: string;
  onSealed: (display: string, canonical: string) => void;
}) {
  const assembly = deriveAssembly(seedHex); // deterministic from the seed
  const [picks, setPicks] = useState<(string | null)[]>(() => assembly.slots.map(() => null));
  const chosen = picks.filter((p) => p !== null).length;
  const total = assembly.slots.length;

  function pick(slot: number, option: string) {
    setPicks((prev) => {
      const next = [...prev];
      next[slot] = option;
      return next;
    });
  }

  function seal() {
    if (chosen !== total) return;
    onSealed(assembleDisplay(picks as string[]), assembly.canonical);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Build your receipt. Pick whichever words and numbers you like — <strong>every option
        seals the exact same ballot</strong>, which is what lets you show anyone any version
        without it ever revealing your vote.
      </p>

      <div className="space-y-3">
        {assembly.slots.map((slot, i) => (
          <div key={i}>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              {slot.kind === "word" ? `Word ${i + 1}` : `Number ${i - 2}`}
            </div>
            <div className="flex flex-wrap gap-2">
              {slot.options.map((opt) => {
                const active = picks[i] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => pick(i, opt)}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-sm transition ${
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-slate-300 bg-white hover:border-ink"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={seal}
          disabled={chosen !== total}
          className="rounded-lg bg-seal px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Seal my receipt
        </button>
        <span className="text-xs text-slate-500">
          {chosen}/{total} chosen
        </span>
      </div>
    </div>
  );
}
