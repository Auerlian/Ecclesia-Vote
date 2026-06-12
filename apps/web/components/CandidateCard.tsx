"use client";

import { useState } from "react";
import { EccoAvatar } from "./ecco";
import type { CandidateProfile } from "@/lib/candidates";

/**
 * Candidate profile card with an expandable manifesto — used in the feed and on ballots.
 * Optionally selectable (vote flow). Pure display: candidate data never touches ballots.
 */
export function CandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: CandidateProfile;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const c = candidate;

  return (
    <div
      className={`rounded-3xl border-2 p-4 transition ${
        selected
          ? "border-royal-500 bg-royal-50 shadow-glow"
          : "border-royal-100 bg-white hover:border-royal-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <EccoAvatar
          size={52}
          look={{ petal: c.petal, accessory: c.accessory, expression: c.expression }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold text-ink">{c.name}</div>
          <div className="truncate text-xs font-bold text-royal-600">“{c.tagline}”</div>
          <div className="text-[11px] font-semibold text-ink/45">{c.year}</div>
        </div>
        {onSelect && (
          <button
            onClick={onSelect}
            aria-pressed={selected}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold transition ${
              selected
                ? "bg-royal-500 text-white"
                : "border-2 border-royal-200 bg-white text-royal-600 hover:border-royal-400"
            }`}
          >
            {selected ? "Selected ✓" : "Select"}
          </button>
        )}
      </div>

      <p className="mt-3 rounded-2xl bg-sunshine-50 px-3 py-2 text-xs font-semibold text-ink/70">
        <span className="mr-1 font-extrabold text-sunshine-700">In short:</span>
        {c.summary}
      </p>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-2 text-xs font-extrabold text-royal-600 hover:underline"
        aria-expanded={open}
      >
        {open ? "Hide manifesto" : "Read full manifesto"}
      </button>
      {open && <p className="mt-2 text-sm leading-relaxed text-ink/75">{c.manifesto}</p>}
    </div>
  );
}
