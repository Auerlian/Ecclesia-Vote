"use client";

import { useEffect, useState } from "react";
import { EccoAvatar, ECCO_ACCESSORIES } from "./ecco";
import { accessoryUnlocked, countCheersGiven, useEccoProfile } from "./useEccoProfile";

/**
 * "From your Ecco": observations about the user, derived strictly from what happens in this
 * browser. On a voting platform this boundary is the feature: Ecco can know your habits, but
 * vote contents are hidden from everyone by construction, so there is nothing to leak.
 */
export function EccoInsights() {
  const { profile } = useEccoProfile();
  const [cheers, setCheers] = useState(0);

  useEffect(() => {
    setCheers(countCheersGiven());
  }, [profile]);

  const wearable = ECCO_ACCESSORIES.filter((a) => a !== "none");
  const unlocked = wearable.filter((a) => accessoryUnlocked(a, profile.hasVoted)).length;
  const metOn = profile.firstSeenAt
    ? new Date(profile.firstSeenAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const observations: string[] = [
    profile.ballotsCast === 0
      ? "You haven't sealed a ballot in this browser yet. Your first receipt is waiting."
      : profile.ballotsCast === 1
        ? "You have sealed 1 demo ballot in this browser. The wardrobe noticed."
        : `You have sealed ${profile.ballotsCast} demo ballots in this browser. A habit is forming.`,
    cheers === 0
      ? "You haven't cheered anyone on the feed yet. The candidates are trying their best."
      : `You have given ${cheers} cheer${cheers === 1 ? "" : "s"} on the feed. Generous.`,
    `Your wardrobe is ${unlocked} of ${wearable.length} accessories deep.`,
    ...(metOn ? [`You and your Ecco first met on ${metOn}.`] : []),
  ];

  return (
    <section className="card">
      <div className="flex items-center gap-3">
        <EccoAvatar size={44} look={profile.look} />
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink/40">
            From your Ecco
          </h2>
          <p className="text-xs font-semibold text-ink/45">
            Things it has noticed about you, from this browser alone.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {observations.map((line) => (
          <li
            key={line}
            className="rounded-2xl bg-royal-50 px-4 py-2.5 text-sm font-semibold text-ink/75"
          >
            {line}
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-2xl border-2 border-dashed border-royal-100 px-4 py-2.5 text-xs font-semibold text-ink/50">
        Ecco only knows what happens in this browser. How you voted is hidden from everyone,
        including Ecco. That part is mathematics, not policy.
      </p>
      <p className="mt-2 px-1 text-xs font-semibold text-ink/40">
        Coming in v0.2: Ecco will summarise manifestos and surface the decisions you care about,
        computed on your device.
      </p>
    </section>
  );
}
