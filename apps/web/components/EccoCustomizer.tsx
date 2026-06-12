"use client";

import Link from "next/link";
import {
  Ecco,
  ECCO_ACCESSORIES,
  ECCO_EXPRESSIONS,
  ECCO_PETAL_COLORS,
  type EccoAccessory,
} from "./ecco";
import { LockIcon } from "./icons";
import { accessoryUnlocked, useEccoProfile } from "./useEccoProfile";

const ACCESSORY_LABELS: Record<EccoAccessory, string> = {
  none: "Just me",
  cap: "Grad cap",
  tophat: "Top hat",
  crown: "Crown",
  bow: "Bow tie",
  moustache: "Moustache",
  glasses: "Glasses",
  balloon: "Balloon",
  flower: "Flower",
};

const EXPRESSION_LABELS = { happy: "Happy 🙂", joy: "Joyful 😄", wink: "Winky 😉" } as const;

/** The customisable personal Ecco from the pitch deck. Lives entirely in localStorage. */
export function EccoCustomizer() {
  const { profile, update } = useEccoProfile();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-ink">Your Ecco</h1>
        <p className="text-sm font-semibold text-ink/55">
          Your voting buddy. Vote in elections to unlock the full wardrobe — every ballot earns
          bragging rights.
        </p>
      </header>

      {/* preview */}
      <div className="card overflow-hidden p-0">
        <div className="bg-dots flex justify-center from-royal-400 via-grape-500 to-blush-500 py-8">
          <Ecco size={150} {...profile.look} className="animate-float drop-shadow-xl" />
        </div>
        <div className="flex flex-col items-center gap-2 p-4 sm:flex-row sm:justify-between">
          <label className="flex w-full items-center gap-2 sm:w-auto">
            <span className="text-xs font-extrabold uppercase tracking-wide text-ink/40">Name</span>
            <input
              value={profile.name}
              onChange={(e) => update({ name: e.target.value.slice(0, 24) || "Your Ecco" })}
              maxLength={24}
              className="w-full rounded-2xl border-2 border-royal-100 px-3 py-2 text-sm font-extrabold text-ink outline-none transition focus:border-royal-400 sm:w-44"
              aria-label="Ecco name"
            />
          </label>
          <span
            className={`chip ${profile.hasVoted ? "bg-mint-100 text-mint-700" : "bg-sunshine-100 text-sunshine-800"}`}
          >
            {profile.hasVoted
              ? "🗳️ Demo voter — wardrobe unlocked!"
              : "🔒 Vote once to unlock the wardrobe"}
          </span>
        </div>
      </div>

      {/* petal colour */}
      <section className="card">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink/40">
          Petal colour
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {ECCO_PETAL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => update({ look: { ...profile.look, petal: c } })}
              aria-label={`Petal colour ${c}`}
              aria-pressed={profile.look.petal === c}
              className={`h-10 w-10 rounded-full transition hover:scale-110 ${
                profile.look.petal === c
                  ? "ring-4 ring-ink/70 ring-offset-2"
                  : "ring-2 ring-royal-100"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </section>

      {/* expression */}
      <section className="card">
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-ink/40">Mood</h2>
        <div className="flex flex-wrap gap-2">
          {ECCO_EXPRESSIONS.map((x) => (
            <button
              key={x}
              onClick={() => update({ look: { ...profile.look, expression: x } })}
              aria-pressed={profile.look.expression === x}
              className={`rounded-2xl border-2 px-4 py-2 text-sm font-extrabold transition ${
                profile.look.expression === x
                  ? "border-royal-500 bg-royal-50 text-royal-700"
                  : "border-royal-100 bg-white text-ink/60 hover:border-royal-300"
              }`}
            >
              {EXPRESSION_LABELS[x]}
            </button>
          ))}
        </div>
      </section>

      {/* wardrobe */}
      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-ink/40">Wardrobe</h2>
          {!profile.hasVoted && (
            <Link
              href="/elections"
              className="text-xs font-extrabold text-coral-600 hover:underline"
            >
              Vote to unlock the rest →
            </Link>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {ECCO_ACCESSORIES.map((a) => {
            const unlocked = accessoryUnlocked(a, profile.hasVoted);
            const active = profile.look.accessory === a;
            return (
              <button
                key={a}
                disabled={!unlocked}
                onClick={() => update({ look: { ...profile.look, accessory: a } })}
                aria-pressed={active}
                className={`relative flex flex-col items-center gap-1 rounded-3xl border-2 p-3 transition ${
                  active
                    ? "border-royal-500 bg-royal-50"
                    : unlocked
                      ? "border-royal-100 bg-white hover:border-royal-300"
                      : "border-royal-50 bg-royal-50/50 opacity-60"
                }`}
              >
                <Ecco
                  size={56}
                  petal={profile.look.petal}
                  accessory={a}
                  expression={profile.look.expression}
                />
                <span className="text-[11px] font-extrabold text-ink/60">
                  {ACCESSORY_LABELS[a]}
                </span>
                {!unlocked && (
                  <span className="absolute right-2 top-2 text-ink/40">
                    <LockIcon size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <p className="card text-xs font-semibold text-ink/50">
        🔐 Your Ecco lives only in <strong>this browser</strong> — nothing about it is sent to any
        server. A mascot should be fun, not a tracking device.
      </p>
    </div>
  );
}
