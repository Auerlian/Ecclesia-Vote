"use client";

import { useEffect, useState } from "react";

function label(msLeft: number): string {
  if (msLeft <= 0) return "Closed";
  const mins = Math.floor(msLeft / 60_000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(minutes, 1)}m left`;
}

/**
 * Live countdown to an ISO close time. Renders a stable placeholder until mounted so the
 * server and client markup always match.
 */
export function Countdown({ closesAt, className }: { closesAt: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const text = now === null ? "…" : label(new Date(closesAt).getTime() - now);
  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
