"use client";

import { useEffect, useState } from "react";
import { SparkleIcon } from "./icons";

/**
 * A playful "cheer" reaction. Honesty matters on a voting platform, so cheers are
 * local to YOUR browser only: no fabricated global counts, nothing leaves the page.
 */
export function CheerButton({ id }: { id: string }) {
  const key = `ecclesia.cheer.${id}`;
  const [count, setCount] = useState(0);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    try {
      setCount(Number(window.localStorage.getItem(key)) || 0);
    } catch {
      // storage unavailable; cheers just won't persist
    }
  }, [key]);

  function cheer() {
    const next = Math.min(count + 1, 99);
    setCount(next);
    setBurst(true);
    setTimeout(() => setBurst(false), 350);
    try {
      window.localStorage.setItem(key, String(next));
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={cheer}
      className={`feed-action ${count > 0 ? "text-coral-500" : ""}`}
      title="Cheers stay in your browser. The demo never fakes engagement numbers."
    >
      <span className={burst ? "animate-wiggle" : ""}>
        <SparkleIcon size={15} />
      </span>
      {count > 0 ? `Cheered (${count})` : "Cheer"}
    </button>
  );
}
