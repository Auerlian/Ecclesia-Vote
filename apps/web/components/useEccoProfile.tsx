"use client";

import { useCallback, useEffect, useState } from "react";
import { ECCO_ACCESSORIES, type EccoAccessory, type EccoExpression, type EccoLook } from "./ecco";

/**
 * Your personal Ecco lives ONLY in this browser (localStorage), deliberately. A server-side
 * profile that follows you around a voting platform would be a tracking surface; a local mascot
 * is pure fun with nothing to leak. Everything Ecco "knows" about you is derived from this
 * browser alone, which is also what makes the insights honest: vote contents are hidden from
 * everyone, including Ecco.
 */

export interface EccoProfile {
  name: string;
  look: EccoLook;
  /** Demo ballots sealed in this browser. Casting the first one unlocks the wardrobe. */
  ballotsCast: number;
  /** When this browser first met its Ecco (ISO date). */
  firstSeenAt: string | null;
  hasVoted: boolean;
}

const KEY = "ecclesia.ecco.v1";
const UPDATED_EVENT = "ecclesia:ecco-updated";
const CHEER_PREFIX = "ecclesia.cheer.";

export const DEFAULT_PROFILE: EccoProfile = {
  name: "Your Ecco",
  look: { petal: "#3D6BFF", accessory: "none", expression: "happy" },
  ballotsCast: 0,
  firstSeenAt: null,
  hasVoted: false,
};

/** Accessories anyone can wear; the rest unlock when you cast your first demo ballot. */
export const STARTER_ACCESSORIES: readonly EccoAccessory[] = ["none", "bow", "glasses"];

export function accessoryUnlocked(a: EccoAccessory, hasVoted: boolean): boolean {
  return hasVoted || STARTER_ACCESSORIES.includes(a);
}

function readProfile(): EccoProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<EccoProfile>;
    const look = parsed.look ?? DEFAULT_PROFILE.look;
    const ballotsCast =
      typeof parsed.ballotsCast === "number" && parsed.ballotsCast >= 0
        ? Math.floor(parsed.ballotsCast)
        : parsed.hasVoted === true // migrate pre-counter profiles
          ? 1
          : 0;
    return {
      name:
        typeof parsed.name === "string" && parsed.name.trim()
          ? parsed.name.slice(0, 24)
          : DEFAULT_PROFILE.name,
      look: {
        petal: typeof look.petal === "string" ? look.petal : DEFAULT_PROFILE.look.petal,
        accessory: ECCO_ACCESSORIES.includes(look.accessory as EccoAccessory)
          ? (look.accessory as EccoAccessory)
          : "none",
        expression: (["happy", "joy", "wink"] as EccoExpression[]).includes(
          look.expression as EccoExpression,
        )
          ? (look.expression as EccoExpression)
          : "happy",
      },
      ballotsCast,
      firstSeenAt: typeof parsed.firstSeenAt === "string" ? parsed.firstSeenAt : null,
      hasVoted: parsed.hasVoted === true || ballotsCast > 0,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function writeProfile(p: EccoProfile) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event(UPDATED_EVENT));
  } catch {
    // Storage unavailable (private mode etc.); the Ecco just won't persist.
  }
}

export function useEccoProfile() {
  // Start from the default on both server and client to avoid hydration mismatches,
  // then hydrate from localStorage after mount.
  const [profile, setProfile] = useState<EccoProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const sync = () => setProfile(readProfile());
    // First visit: remember when this browser met its Ecco.
    const current = readProfile();
    if (!current.firstSeenAt) {
      writeProfile({ ...current, firstSeenAt: new Date().toISOString() });
    }
    sync();
    window.addEventListener(UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<EccoProfile>) => {
    setProfile((prev) => {
      const next: EccoProfile = {
        ...prev,
        ...patch,
        look: { ...prev.look, ...(patch.look ?? {}) },
      };
      writeProfile(next);
      return next;
    });
  }, []);

  return { profile, update };
}

/** Record a completed demo ballot from anywhere (used by the vote ceremony). */
export function recordBallotCast() {
  const current = readProfile();
  writeProfile({
    ...current,
    ballotsCast: current.ballotsCast + 1,
    hasVoted: true,
    firstSeenAt: current.firstSeenAt ?? new Date().toISOString(),
  });
}

/** Total cheers given across the feed (browser-local, see CheerButton). */
export function countCheersGiven(): number {
  if (typeof window === "undefined") return 0;
  try {
    let total = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(CHEER_PREFIX)) {
        total += Number(window.localStorage.getItem(key)) || 0;
      }
    }
    return total;
  } catch {
    return 0;
  }
}
