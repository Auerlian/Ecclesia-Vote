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
    <div className="space-y-4 animate-pop-in">
      <div>
        <h2 className="text-lg font-black text-ink">Build your receipt</h2>
        <p className="text-sm font-semibold text-ink/55">
          Pick whichever words and numbers you like best.{" "}
          <strong className="text-ink">Every option seals the exact same ballot</strong>, which is
          what lets you show anyone any version without ever revealing your vote.
        </p>
      </div>

      <div className="space-y-3">
        {assembly.slots.map((slot, i) => (
          <div key={i}>
            <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-ink/40">
              {slot.kind === "word" ? `Word ${i + 1}` : `Number ${i - 2}`}
            </div>
            <div className="flex flex-wrap gap-2">
              {slot.options.map((opt) => {
                const active = picks[i] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => pick(i, opt)}
                    aria-pressed={active}
                    className={`rounded-2xl border-2 px-3.5 py-2 font-mono text-sm font-bold transition ${
                      active
                        ? "border-royal-500 bg-royal-500 text-white shadow-glow"
                        : "border-royal-100 bg-white text-ink hover:border-royal-400"
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
        <button onClick={seal} disabled={chosen !== total} className="btn-coral">
          Seal my receipt
        </button>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-royal-100">
            <div
              className="h-full rounded-full bg-mint-500 transition-all"
              style={{ width: `${(chosen / total) * 100}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-ink/45">
            {chosen}/{total}
          </span>
        </div>
      </div>
    </div>
  );
}
