"use client";

import Link from "next/link";
import { Ecco, ECCO_ACCESSORIES } from "./ecco";
import { accessoryUnlocked, useEccoProfile } from "./useEccoProfile";

/** Right-rail "Your Ecco" card — the customisable personal mascot from the pitch deck. */
export function YourEccoCard() {
  const { profile } = useEccoProfile();
  const unlocked = ECCO_ACCESSORIES.filter(
    (a) => a !== "none" && accessoryUnlocked(a, profile.hasVoted),
  ).length;
  const total = ECCO_ACCESSORIES.length - 1;

  return (
    <div className="card overflow-hidden p-0">
      <div className="bg-flux flex justify-center pb-2 pt-4">
        <Ecco size={104} {...profile.look} className="drop-shadow-lg" />
      </div>
      <div className="space-y-2 p-4">
        <div className="text-center">
          <div className="text-sm font-extrabold text-ink">{profile.name}</div>
          <div className="text-xs font-semibold text-ink/45">
            {profile.hasVoted ? "Demo voter" : "Hasn't voted yet"}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-sunshine-50 px-3 py-2">
          <span className="text-xs font-extrabold text-sunshine-800">
            Wardrobe {unlocked}/{total}
          </span>
          {!profile.hasVoted && (
            <span className="text-[11px] font-bold text-sunshine-700">vote to unlock</span>
          )}
        </div>
        <Link href="/me" className="btn-ghost w-full text-xs">
          Customise your Ecco
        </Link>
      </div>
    </div>
  );
}
